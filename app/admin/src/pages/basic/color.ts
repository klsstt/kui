import { colorPalette, colorShades } from '@kui/tokens'
import { trackDispose } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, codeSample, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 颜色。
 * 页面里不出现随手取的字面色值：色卡直接来自 @kui/tokens 的 12 色系 × 8 阶，
 * 组件只引用语义令牌，主题切换时改的是令牌值，不是某一行样式。
 */

/** 一行一个色系：色系名 + 8 个色卡 */
function rampRow(id: string, label: string, shades: Record<string, string>): string {
    const cells = colorShades
        .map((shade) => {
            const hex = shades[shade] ?? '#ffffff'
            return `<button type="button" class="kui-board kui-stack kui-stack--tight kui-hover-lift" style="background: ${hex}; cursor: pointer" data-col-hex="${hex}" data-col-token="${id}-${shade}" data-col-shade="${shade}" aria-label="复制 ${id}-${shade} ${hex}"><span class="badge badge-neutral" data-col-label>${shade}</span></button>`
        })
        .join('\n            ')

    return `
    <div class="kui-stack kui-stack--tight">
        <div class="kui-cluster kui-justify-between">
            <span class="kui-list__title">${id} · ${label}</span>
            <code class="kui-inline-code">${id}-50 → ${id}-700</code>
        </div>
        <div class="kui-grid" style="grid-template-columns: repeat(8, minmax(0, 1fr)); --kui-grid-gap: var(--kui-space-2)">
            ${cells}
        </div>
    </div>`
}

const paletteRows = colorPalette.map((ramp) => rampRow(ramp.id, ramp.label, ramp.shades)).join('\n')

export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '颜色分两层：12 个色系 × 8 阶的原始色板用来选色，语义令牌用来写界面。页面里出现的每一个颜色都能追到令牌，切换主题时改的是令牌值，不是某一行样式。',
    tags: ['--kui-color-*', 'colorPalette', 'color-mix'],
})}

${sectionTitle('色板', '色板是选色时的素材库；写进组件的是语义令牌，不是这里的 96 个色值。')}

${demo({
    title: '12 色系 × 8 阶色卡',
    desc: '每个色系给出 50–700 共 8 阶；悬停时色卡右移放大并显示该阶的 hex，点击色卡把颜色复制到剪贴板，顶部提示条确认复制结果。',
    tags: ['colorPalette', 'colorShades', 'navigator.clipboard'],
    script: `
const copyText = async (text: string): Promise<void> => {
    try {
        await navigator.clipboard.writeText(text)
    } catch {
        const area = document.createElement('textarea')
        area.value = text
        document.body.append(area)
        area.select()
        document.execCommand('copy')
        area.remove()
    }
}

const toast = document.querySelector<HTMLElement>('[data-col-toast]')
const toastText = document.querySelector<HTMLElement>('[data-col-toast-text]')
const toastToken = document.querySelector<HTMLElement>('[data-col-toast-token]')
let hideTimer = 0

document.querySelectorAll<HTMLElement>('[data-col-hex]').forEach((swatch) => {
    const hex = swatch.dataset.colHex ?? ''
    const token = swatch.dataset.colToken ?? ''
    const shade = swatch.dataset.colShade ?? ''
    const label = swatch.querySelector<HTMLElement>('[data-col-label]')

    const reveal = (): void => {
        swatch.style.transform = 'translateX(3px) scale(1.05)'
        swatch.style.zIndex = '2'
        if (label) label.textContent = hex
    }
    const reset = (): void => {
        swatch.style.removeProperty('transform')
        swatch.style.removeProperty('z-index')
        if (label) label.textContent = shade
    }

    swatch.addEventListener('mouseenter', reveal)
    swatch.addEventListener('mouseleave', reset)
    swatch.addEventListener('focus', reveal)
    swatch.addEventListener('blur', reset)
    swatch.addEventListener('click', () => {
        void copyText(hex)
        if (toastText) toastText.textContent = hex
        if (toastToken) toastToken.textContent = token
        if (toast) toast.hidden = false
        window.clearTimeout(hideTimer)
        hideTimer = window.setTimeout(() => {
            if (toast) toast.hidden = true
        }, 1800)
    })
})
`,
    html: `
<div class="kui-stack">
    <div class="alert alert-success" data-col-toast hidden>
        <i class="fa fa-check-circle" aria-hidden="true"></i>
        <div>已复制 <code class="kui-inline-code" data-col-toast-text>#3b82f6</code> · <span data-col-toast-token>blue-500</span></div>
    </div>
    <div class="kui-stack" data-col-palette>
${paletteRows}
    </div>
</div>`,
})}

${demo({
    title: '渐变色生成器',
    desc: '起点色、终点色与角度三个输入直接拼出 linear-gradient；预览与可复制的 CSS 来自同一个字符串，改一个参数两边同时更新。',
    stage: 'tinted',
    tags: ['linear-gradient', 'input[type=color]'],
    script: `
const copyText = async (text: string): Promise<void> => {
    try {
        await navigator.clipboard.writeText(text)
    } catch {
        const area = document.createElement('textarea')
        area.value = text
        document.body.append(area)
        area.select()
        document.execCommand('copy')
        area.remove()
    }
}

const from = document.querySelector<HTMLInputElement>('[data-col-from]')
const to = document.querySelector<HTMLInputElement>('[data-col-to]')
const angle = document.querySelector<HTMLInputElement>('[data-col-angle]')
const preview = document.querySelector<HTMLElement>('[data-col-preview]')
const css = document.querySelector<HTMLElement>('[data-col-css]')
const angleText = document.querySelector<HTMLElement>('[data-col-angle-text]')
const copy = document.querySelector<HTMLButtonElement>('[data-col-css-copy]')

const sync = (): void => {
    const value = 'linear-gradient(' + (angle?.value ?? '120') + 'deg, ' + (from?.value ?? '') + ', ' + (to?.value ?? '') + ')'
    if (preview) preview.style.background = value
    if (css) css.textContent = value
    if (angleText) angleText.textContent = (angle?.value ?? '120') + '°'
}

;[from, to, angle].forEach((input) => input?.addEventListener('input', sync))

copy?.addEventListener('click', () => {
    const text = css?.textContent ?? ''
    void copyText(text).then(() => {
        copy.textContent = '已复制'
        window.setTimeout(() => {
            copy.textContent = '复制 CSS'
        }, 1400)
    })
})

sync()
`,
    html: `
<div class="kui-board kui-stack">
    <div class="kui-grid kui-grid--sm">
        <label class="form-group">
            <span class="form-label">起点色</span>
            <input class="form-control" type="color" value="#3b82f6" data-col-from>
        </label>
        <label class="form-group">
            <span class="form-label">终点色</span>
            <input class="form-control" type="color" value="#8b5cf6" data-col-to>
        </label>
        <label class="form-group">
            <span class="form-label">角度 · <span data-col-angle-text>120°</span></span>
            <input class="kui-w-full" type="range" min="0" max="360" step="1" value="120" data-col-angle aria-label="渐变角度">
        </label>
    </div>
    <div class="kui-board kui-mixed-type" data-col-preview style="background: linear-gradient(120deg, #3b82f6, #8b5cf6); --kui-board-padding: var(--kui-space-7)">
        <span class="badge badge-neutral">实时预览</span>
    </div>
    <div class="kui-cluster kui-justify-between">
        <code class="kui-inline-code" data-col-css>linear-gradient(120deg, #3b82f6, #8b5cf6)</code>
        <button type="button" class="btn btn-default btn-sm" data-col-css-copy><i class="fa fa-clone" aria-hidden="true"></i> 复制 CSS</button>
    </div>
</div>`,
})}

${sectionTitle('文本、表面与层级', '同一个语义色按比例混进表面色或透明色，得到底色、描边与悬停态；颜色数量不随页面数量增长。')}

${demo({
    title: '文本色与强调',
    desc: '正文用三级文本色拉开层次，强调用荧光笔、下划线与语义强调三种现成写法；渐变文字只出现在标题级。',
    tags: ['.kui-mark', '.kui-underline-mark', '.kui-text-gradient'],
    html: `
<div class="kui-stack">
    <div class="kui-board">
        <div class="kui-prose">
            <p>正文用 <span class="kui-em">--kui-color-text-muted</span>，比标题低一档；时间、占位与元信息再退到 text-subtle，三级之外不再增加新的灰。</p>
            <p>需要把一句话从段落里提出来时，用<mark class="kui-mark">荧光笔标注结论</mark>，或者用 <span class="kui-underline-mark">下划线标注引用</span>；两者都不改字号与字重。</p>
        </div>
    </div>
    <div class="kui-grid kui-grid--md">
        <article class="kui-board kui-stack kui-stack--tight">
            <h2 class="kui-text-gradient">渐变文字</h2>
            <p class="kui-stat__label">.kui-text-gradient · 品牌色到信息色，只用于封面级标题</p>
        </article>
        <article class="kui-board kui-stack kui-stack--tight">
            <p class="kui-list__title">标题 text · 正文 muted · 辅助 subtle</p>
            <p class="kui-page-header__desc">同一段文字里，三级文本色已经足够区分主次，不需要再调字号。</p>
            <p class="kui-stat__label">更新于 09:24 · 由系统自动同步</p>
        </article>
    </div>
</div>`,
})}

${demo({
    title: '背景、边框、透明层级与阴影',
    desc: '表面分三层，描边分两档，透明层级固定为 8 / 16 / 32 / 64%，阴影只有三档；每一档都有名字，页面不再临时调透明度。',
    tags: ['--kui-color-surface-*', '--kui-shadow-*'],
    html: `
<div class="kui-stack">
    <div class="kui-grid kui-grid--sm">
        <article class="kui-board kui-stack kui-stack--tight" style="background: var(--kui-color-surface)">
            <div class="kui-cluster"><code class="kui-inline-code">--kui-color-surface</code></div>
            <span class="kui-stat__label">卡片、面板与浮层</span>
        </article>
        <article class="kui-board kui-stack kui-stack--tight" style="background: var(--kui-color-surface-muted)">
            <div class="kui-cluster"><code class="kui-inline-code">--kui-color-surface-muted</code></div>
            <span class="kui-stat__label">次级表面、表头与轨道</span>
        </article>
        <article class="kui-board kui-stack kui-stack--tight" style="background: var(--kui-color-background)">
            <div class="kui-cluster"><code class="kui-inline-code">--kui-color-background</code></div>
            <span class="kui-stat__label">页面底色，比表面低一层</span>
        </article>
        <article class="kui-board kui-stack kui-stack--tight" style="background: color-mix(in srgb, var(--kui-color-primary) 10%, var(--kui-color-surface))">
            <div class="kui-cluster"><code class="kui-inline-code">primary 10% + surface</code></div>
            <span class="kui-stat__label">选中态与语义徽章底色</span>
        </article>
    </div>
    <div class="kui-grid kui-grid--sm">
        <article class="kui-board kui-stack kui-stack--tight" style="border: 1px solid var(--kui-color-border)">
            <div class="kui-cluster"><code class="kui-inline-code">--kui-color-border</code></div>
            <span class="kui-stat__label">控件边框与分隔</span>
        </article>
        <article class="kui-board kui-stack kui-stack--tight" style="border: 1px solid var(--kui-color-border-subtle)">
            <div class="kui-cluster"><code class="kui-inline-code">--kui-color-border-subtle</code></div>
            <span class="kui-stat__label">容器内更浅一档的分隔线</span>
        </article>
        <article class="kui-board kui-stack kui-stack--tight" style="border: 1px solid color-mix(in srgb, var(--kui-color-primary) 32%, transparent)">
            <div class="kui-cluster"><code class="kui-inline-code">primary 32% + transparent</code></div>
            <span class="kui-stat__label">强调描边，落在任意底色上都成立</span>
        </article>
        <article class="kui-board kui-stack kui-stack--tight" style="border: 1px solid transparent; background: color-mix(in srgb, var(--kui-color-danger) 10%, var(--kui-color-surface))">
            <div class="kui-cluster"><code class="kui-inline-code">danger 10% + surface</code></div>
            <span class="kui-stat__label">错误区域的底色，不画红框</span>
        </article>
    </div>
    <div class="kui-board kui-stack">
        <div class="kui-cluster"><code class="kui-inline-code">透明层级：8% / 16% / 32% / 64%</code></div>
        <div class="kui-grid" style="--kui-grid-min: 7rem">
            <div class="kui-board kui-stack kui-stack--tight" style="background: color-mix(in srgb, var(--kui-color-primary) 8%, var(--kui-color-surface))">
                <div class="kui-cluster"><span class="badge badge-neutral">8%</span><code class="kui-inline-code">底色</code></div>
            </div>
            <div class="kui-board kui-stack kui-stack--tight" style="background: color-mix(in srgb, var(--kui-color-primary) 16%, var(--kui-color-surface))">
                <div class="kui-cluster"><span class="badge badge-neutral">16%</span><code class="kui-inline-code">徽章</code></div>
            </div>
            <div class="kui-board kui-stack kui-stack--tight" style="background: color-mix(in srgb, var(--kui-color-primary) 32%, var(--kui-color-surface))">
                <div class="kui-cluster"><span class="badge badge-neutral">32%</span><code class="kui-inline-code">描边</code></div>
            </div>
            <div class="kui-board kui-stack kui-stack--tight" style="background: color-mix(in srgb, var(--kui-color-primary) 64%, var(--kui-color-surface))">
                <div class="kui-cluster"><span class="badge badge-neutral">64%</span><code class="kui-inline-code">遮罩</code></div>
            </div>
        </div>
    </div>
    <div class="kui-grid kui-grid--sm">
        <article class="kui-board kui-stack kui-stack--tight" style="box-shadow: var(--kui-shadow-sm)">
            <div class="kui-cluster"><code class="kui-inline-code">--kui-shadow-sm</code></div>
            <span class="kui-stat__label">下拉、气泡与悬停</span>
        </article>
        <article class="kui-board kui-stack kui-stack--tight" style="box-shadow: var(--kui-shadow-md)">
            <div class="kui-cluster"><code class="kui-inline-code">--kui-shadow-md</code></div>
            <span class="kui-stat__label">浮层与模态框</span>
        </article>
        <article class="kui-board kui-stack kui-stack--tight" style="box-shadow: var(--kui-shadow-lg)">
            <div class="kui-cluster"><code class="kui-inline-code">--kui-shadow-lg</code></div>
            <span class="kui-stat__label">整屏浮层与引导</span>
        </article>
    </div>
</div>`,
})}

${callout('派生色一律写成 <code>color-mix(in srgb, var(--kui-color-…) 12%, var(--kui-color-surface))</code>：主题切换时混色基数跟着变，不必为每个主题维护一套色值。只有色板本身保存原始 hex，组件里不出现字面色值。')}

${sectionTitle('主题与明暗模式', '12 个主题共用同一套令牌名，浅色 / 深色通过顶栏状态按钮切换。')}

${demo({
    title: '切换主题',
    desc: '主题按钮把 data-kui-theme 写到 html 上，整站一起换色：顶栏明暗独立切换 data-kui-mode, 品牌色、文本、描边、表面与焦点环同步变化，组件功能与布局不动。离开本页时自动恢复进入前的主题。',
    tags: ['[data-kui-theme]', '--kui-seed-color-brand'],
    script: `
const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-col-theme]'))
const status = document.querySelector<HTMLElement>('[data-col-status]')

buttons.forEach((button) => {
    button.addEventListener('click', () => {
        const theme = button.dataset.colTheme ?? 'blue'
        document.documentElement.dataset.kuiTheme = theme
        buttons.forEach((item) => item.classList.toggle('is-active', item === button))
        if (status) status.textContent = '当前主题：' + theme + ' · 整站生效'
    })
})
`,
    html: `
<div class="kui-stack" data-col-scope>
    <div class="kui-cluster">
        <div class="kui-segmented" role="group" aria-label="选择主题">
            ${colorPalette.map((theme) => `<button type="button" class="btn btn-outline btn-primary btn-sm" data-col-theme="${theme.id}">${theme.label}</button>`).join('')}
        </div>
        <span class="kui-stat__label" data-col-status>当前主题：blue · 整站生效</span>
    </div>
    <div class="kui-board kui-stack">
        <div class="kui-cluster">
            <button type="button" class="btn btn-primary btn-sm">主操作</button>
            <button type="button" class="btn btn-outline btn-primary btn-sm">次级操作</button>
            <span class="badge badge-primary">进行中</span>
            <span class="badge badge-success">已完成</span>
            <span class="kui-dot kui-dot--primary" aria-hidden="true"></span>
        </div>
        <div class="progress progress-sm"><div class="progress-bar" style="width: 62%"></div></div>
        <p class="kui-page-header__desc">同一段结构支持12色 x 明暗模式：按钮、徽章、进度、表面与文本一起换色，组件行为保持不变。</p>
    </div>
</div>`,
})}

${codeSample(`
import { colorPalette, colorShades } from '@kui/tokens'

// 12 个色系，每个色系 8 阶（50 → 700）
colorPalette.forEach((ramp) => {
    console.log(ramp.id, ramp.label, ramp.shades['500'])
})

// 需要按阶遍历时用 colorShades，顺序固定
colorShades.forEach((shade) => {
    console.log(shade, colorPalette[0].shades[shade])
})
`, 'ts', '读取色板')}

${propsTable([
    { name: 'colorPalette', type: 'ColorRamp[]', defaultValue: '12 项', desc: '色系数组，每项含 <code>id</code>、中文 <code>label</code> 与 <code>shades</code>（50–700）。' },
    { name: 'colorShades', type: 'readonly string[]', defaultValue: "['50'…'700']", desc: '色阶顺序，渲染色卡时按它遍历，不要用 <code>Object.keys</code>。' },
    { name: '--kui-color-primary', type: 'color', defaultValue: 'seed', desc: '品牌主色，主操作、链接与选中态。' },
    { name: '--kui-color-success / -warning / -danger / -info', type: 'color', defaultValue: 'seed', desc: '四种状态色，分别对应成功、提醒、失败与说明。' },
    { name: '--kui-color-text / -muted / -subtle', type: 'color', defaultValue: 'neutral-900 / 700 / 500', desc: '三级文本色，按信息重要性递减。' },
    { name: '--kui-color-border / -subtle', type: 'color', defaultValue: 'neutral-300', desc: '描边；<code>-subtle</code> 是容器内更浅一档的分隔线。' },
    { name: '--kui-color-surface / -muted', type: 'color', defaultValue: 'neutral-0 / 100', desc: '卡片底色与次级表面。' },
    { name: '--kui-color-background', type: 'color', defaultValue: 'neutral-50', desc: '页面底色，比表面低一层。' },
    { name: '--kui-color-on-primary', type: 'color', defaultValue: 'white', desc: '品牌色上的反白文字，主题切换时同步。' },
    { name: '--kui-shadow-sm / -md / -lg', type: 'shadow', defaultValue: 'seed', desc: '三档阴影：下拉与悬停 / 浮层 / 整屏浮层。' },
    { name: '[data-kui-theme]', type: 'attribute', defaultValue: 'blue', desc: '支持色卡中的12个颜色id, 例如 <code>blue</code> / <code>green</code> / <code>amber</code>' },
    { name: '[data-kui-mode]', type: 'attribute', defaultValue: 'light', desc: '<code>light</code> / <code>dark</code>, 与颜色独立，局部主题请将两个属性写在同一个容器上。' },
])}

`

    /* ---------- 色卡：悬停预览 hex，点击复制 ---------- */
    const toast = root.querySelector<HTMLElement>('[data-col-toast]')
    const toastText = root.querySelector<HTMLElement>('[data-col-toast-text]')
    const toastToken = root.querySelector<HTMLElement>('[data-col-toast-token]')
    let hideTimer = 0

    const copyText = async (text: string): Promise<void> => {
        try {
            await navigator.clipboard.writeText(text)
        } catch {
            const area = document.createElement('textarea')
            area.value = text
            document.body.append(area)
            area.select()
            document.execCommand('copy')
            area.remove()
        }
    }

    root.querySelectorAll<HTMLElement>('[data-col-hex]').forEach((swatch) => {
        const hex = swatch.dataset.colHex ?? ''
        const token = swatch.dataset.colToken ?? ''
        const shade = swatch.dataset.colShade ?? ''
        const label = swatch.querySelector<HTMLElement>('[data-col-label]')

        const reveal = (): void => {
            swatch.style.transform = 'translateX(3px) scale(1.05)'
            swatch.style.zIndex = '2'
            if (label) {
                label.textContent = hex
            }
        }
        const reset = (): void => {
            swatch.style.removeProperty('transform')
            swatch.style.removeProperty('z-index')
            if (label) {
                label.textContent = shade
            }
        }

        swatch.addEventListener('mouseenter', reveal)
        swatch.addEventListener('mouseleave', reset)
        swatch.addEventListener('focus', reveal)
        swatch.addEventListener('blur', reset)
        swatch.addEventListener('click', () => {
            void copyText(hex)
            if (toastText) {
                toastText.textContent = hex
            }
            if (toastToken) {
                toastToken.textContent = token
            }
            if (toast) {
                toast.hidden = false
            }
            window.clearTimeout(hideTimer)
            hideTimer = window.setTimeout(() => {
                if (toast) {
                    toast.hidden = true
                }
            }, 1800)
        })
    })

    /* ---------- 渐变色生成器 ---------- */
    const from = root.querySelector<HTMLInputElement>('[data-col-from]')
    const to = root.querySelector<HTMLInputElement>('[data-col-to]')
    const angle = root.querySelector<HTMLInputElement>('[data-col-angle]')
    const preview = root.querySelector<HTMLElement>('[data-col-preview]')
    const css = root.querySelector<HTMLElement>('[data-col-css]')
    const angleText = root.querySelector<HTMLElement>('[data-col-angle-text]')
    const copyButton = root.querySelector<HTMLButtonElement>('[data-col-css-copy]')

    const syncGradient = (): void => {
        const value = `linear-gradient(${angle?.value ?? '120'}deg, ${from?.value ?? ''}, ${to?.value ?? ''})`
        if (preview) {
            preview.style.background = value
        }
        if (css) {
            css.textContent = value
        }
        if (angleText) {
            angleText.textContent = `${angle?.value ?? '120'}°`
        }
    }

    ;[from, to, angle].forEach((input) => input?.addEventListener('input', syncGradient))

    copyButton?.addEventListener('click', () => {
        void copyText(css?.textContent ?? '').then(() => {
            copyButton.textContent = '已复制'
            window.setTimeout(() => {
                copyButton.textContent = '复制 CSS'
            }, 1400)
        })
    })

    syncGradient()

    /* ---------- 主题切换：写在 html 上，整站生效 ---------- */
    const themeButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-col-theme]'))
    const status = root.querySelector<HTMLElement>('[data-col-status]')
    const originalTheme = document.documentElement.dataset.kuiTheme

    themeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const theme = button.dataset.colTheme ?? 'blue'
            document.documentElement.dataset.kuiTheme = theme
            themeButtons.forEach((item) => item.classList.toggle('is-active', item === button))
            if (status) {
                status.textContent = `当前主题：${theme} · 整站生效`
            }
        })
    })

    trackDispose(() => {
        if (originalTheme) {
            document.documentElement.dataset.kuiTheme = originalTheme
        } else {
            delete document.documentElement.dataset.kuiTheme
        }
    })
}
