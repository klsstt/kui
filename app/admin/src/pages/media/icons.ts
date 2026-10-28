import type { DocPageContext } from '../../docs/types'
import { demo, pageHead, propsTable } from '../../docs/ui'
import { iconCategories, iconCount } from '../../data/icons'
import { trackDispose } from '../../context'

/**
 * 字体图标。
 * 上半部分是用法与最小可复制实现，下半部分是完整清单：
 * 点击任意图标即复制 `fa fa-<name>`，可按分类与关键字筛选。
 */

function copyText(value: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(value).catch(() => fallbackCopy(value))
    }
    fallbackCopy(value)
    return Promise.resolve()
}

function fallbackCopy(value: string): void {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.append(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
}

export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: `内置 Font Awesome 4.7 图标集，共 ${iconCount} 个图标。图标只服务于阅读、定位与操作确认：同一个动作在全站使用同一个图标，尺寸与颜色跟随文字。`,
    tags: ['Icon', 'fa fa-*'],
})}

${demo({
    title: '图标用法',
    desc: '图标继承文字颜色与字号，通过父级控制尺寸；纯装饰图标加 aria-hidden，独立按钮必须提供可访问名称。',
    tags: ['.fa', '.fa-lg'],
    html: `
<div class="kui-stack">
    <div class="kui-cluster">
        <span class="kui-cluster"><i class="fa fa-home" aria-hidden="true"></i> 首页</span>
        <span class="kui-cluster"><i class="fa fa-search" aria-hidden="true"></i> 搜索</span>
        <span class="kui-cluster"><i class="fa fa-bell" aria-hidden="true"></i> 通知</span>
        <span class="kui-cluster"><i class="fa fa-user" aria-hidden="true"></i> 账户</span>
        <span class="kui-cluster"><i class="fa fa-cog" aria-hidden="true"></i> 设置</span>
    </div>
    <div class="kui-cluster">
        <i class="fa fa-star" aria-hidden="true"></i>
        <i class="fa fa-star fa-lg" aria-hidden="true"></i>
        <i class="fa fa-star fa-2x" aria-hidden="true"></i>
        <i class="fa fa-star fa-3x" aria-hidden="true"></i>
    </div>
    <div class="kui-cluster">
        <button type="button" class="btn btn-default btn-icon" aria-label="刷新"><i class="fa fa-refresh" aria-hidden="true"></i></button>
        <button type="button" class="btn btn-primary"><i class="fa fa-download" aria-hidden="true"></i> 下载</button>
        <button type="button" class="btn btn-ghost btn-icon" aria-label="更多操作"><i class="fa fa-ellipsis-h" aria-hidden="true"></i></button>
    </div>
</div>`,
})}

${demo({
    title: '可复制图标清单的最小实现',
    desc: '每个图标是一个按钮，点击把类名写入剪贴板；用事件委托只需一个监听器。',
    script: `
const list = document.querySelector<HTMLElement>('[data-icons-mini]')
list?.addEventListener('click', async (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-icon-name]')
    if (!button) {
        return
    }
    await navigator.clipboard.writeText('fa fa-' + button.dataset.iconName)
    button.classList.add('is-copied')
    window.setTimeout(() => button.classList.remove('is-copied'), 1200)
})
`,
    html: `
<div class="doc-icon-grid doc-icon-grid--mini" data-icons-mini>
    <button type="button" class="doc-icon" data-icon-name="home"><i class="fa fa-home" aria-hidden="true"></i><span>home</span></button>
    <button type="button" class="doc-icon" data-icon-name="search"><i class="fa fa-search" aria-hidden="true"></i><span>search</span></button>
    <button type="button" class="doc-icon" data-icon-name="bell"><i class="fa fa-bell" aria-hidden="true"></i><span>bell</span></button>
    <button type="button" class="doc-icon" data-icon-name="calendar"><i class="fa fa-calendar" aria-hidden="true"></i><span>calendar</span></button>
    <button type="button" class="doc-icon" data-icon-name="bar-chart"><i class="fa fa-bar-chart" aria-hidden="true"></i><span>bar-chart</span></button>
    <button type="button" class="doc-icon" data-icon-name="check"><i class="fa fa-check" aria-hidden="true"></i><span>check</span></button>
</div>`,
})}

<section class="doc-icons" data-icons-browser>
    <header class="doc-icons__head">
        <div class="doc-icons__title">
            <h2>全部图标</h2>
            <p>共 <strong>${iconCount}</strong> 个，点击复制类名，双击复制完整标签。</p>
        </div>
        <div class="doc-icons__tools">
            <label class="docs-search docs-search--inline">
                <i class="fa fa-search" aria-hidden="true"></i>
                <input class="docs-search__input" type="search" placeholder="搜索图标名" aria-label="搜索图标" data-icons-search>
            </label>
            <div class="kui-segmented" data-icons-mode role="group" aria-label="复制格式">
                <button type="button" class="is-active" data-icons-format="class">类名</button>
                <button type="button" data-icons-format="html">完整标签</button>
            </div>
        </div>
    </header>
    <div class="doc-icons__cats" data-icons-cats></div>
    <p class="doc-icons__count" data-icons-count></p>
    <div class="doc-icon-groups" data-icons-groups></div>
    <div class="doc-icon-empty kui-empty" data-icons-empty hidden>
        <i class="fa fa-search" aria-hidden="true"></i>
        <strong>没有匹配的图标</strong>
        <p>换一个关键词，或切换到「全部」分类。</p>
    </div>
</section>

${propsTable([
    { name: 'fa', type: 'class', defaultValue: '—', desc: '图标的基础类名，必须与具体图标名同时出现。' },
    { name: 'fa-&lt;name&gt;', type: 'class', defaultValue: '—', desc: '具体图标，例如 <code>fa fa-home</code>；完整清单见本页下方。' },
    { name: 'fa-lg / fa-2x / fa-3x', type: 'class', defaultValue: '—', desc: '相对当前字号的放大，优先用父级字号控制，而非固定倍数。' },
    { name: 'fa-fw', type: 'class', defaultValue: '—', desc: '固定宽度，用于列表或工具栏中图标需要竖向对齐的场景。' },
    { name: 'fa-spin / fa-pulse', type: 'class', defaultValue: '—', desc: '旋转动画，用于加载指示；尊重 reduced-motion。' },
    { name: 'aria-hidden', type: 'attribute', defaultValue: '—', desc: '纯装饰图标必须加，避免读屏重复朗读。' },
    { name: 'aria-label', type: 'attribute', defaultValue: '—', desc: '图标按钮没有可见文字时必须提供。' },
])}

`

    /* ---------- 图标浏览器 ---------- */
    const browser = root.querySelector<HTMLElement>('[data-icons-browser]')
    const catHost = root.querySelector<HTMLElement>('[data-icons-cats]')
    const groupHost = root.querySelector<HTMLElement>('[data-icons-groups]')
    const search = root.querySelector<HTMLInputElement>('[data-icons-search]')
    const countLabel = root.querySelector<HTMLElement>('[data-icons-count]')
    const empty = root.querySelector<HTMLElement>('[data-icons-empty]')
    const modeGroup = root.querySelector<HTMLElement>('[data-icons-mode]')
    if (!browser || !catHost || !groupHost || !search || !countLabel || !empty || !modeGroup) {
        return
    }

    let activeCategory = 'all'
    let format: 'class' | 'html' = 'class'

    const renderCats = (): void => {
        const total = iconCategories.reduce((sum, category) => sum + category.icons.length, 0)
        const entries = [
            { id: 'all', title: '全部', count: total },
            ...iconCategories.map((category) => ({ id: category.id, title: category.title, count: category.icons.length })),
        ]
        catHost.innerHTML = entries
            .map(
                (entry) =>
                    `<button type="button" class="chip${entry.id === activeCategory ? ' is-active' : ''}" data-icons-cat="${entry.id}">${entry.title}<em>${entry.count}</em></button>`,
            )
            .join('')
    }

    const renderGroups = (): void => {
        const keyword = search.value.trim().toLowerCase()
        const groups = iconCategories
            .filter((category) => activeCategory === 'all' || category.id === activeCategory)
            .map((category) => ({
                ...category,
                icons: category.icons.filter((name) => !keyword || name.includes(keyword)),
            }))
            .filter((category) => category.icons.length > 0)

        groupHost.innerHTML = groups
            .map(
                (category) => `
<section class="doc-icon-group">
    <h3>${category.title}<span>${category.icons.length}</span></h3>
    <div class="doc-icon-grid">
        ${category.icons
            .map(
                (name) => `<button type="button" class="doc-icon" data-icon-name="${name}" title="fa-${name}">
            <i class="fa fa-${name}" aria-hidden="true"></i><span>${name}</span>
        </button>`,
            )
            .join('')}
    </div>
</section>`,
            )
            .join('')

        const visible = groups.reduce((sum, category) => sum + category.icons.length, 0)
        countLabel.textContent = `显示 ${visible} 个图标`
        empty.hidden = visible > 0
    }

    const toast = (message: string): void => {
        let element = document.querySelector<HTMLElement>('.doc-toast')
        if (!element) {
            element = document.createElement('div')
            element.className = 'doc-toast'
            element.setAttribute('role', 'status')
            document.body.append(element)
            const created = element
            trackDispose(() => created.remove())
        }
        element.textContent = message
        element.classList.add('is-visible')
        window.clearTimeout(Number(element.dataset.timer ?? '0'))
        const timer = window.setTimeout(() => document.querySelector<HTMLElement>('.doc-toast')?.classList.remove('is-visible'), 1600)
        element.dataset.timer = String(timer)
        trackDispose(() => window.clearTimeout(timer))
    }

    const copy = async (name: string, asHtml: boolean): Promise<void> => {
        const value = asHtml ? `<i class="fa fa-${name}" aria-hidden="true"></i>` : `fa fa-${name}`
        await copyText(value)
        toast(`已复制 ${value}`)
    }

    catHost.addEventListener('click', (event) => {
        const chip = (event.target as HTMLElement).closest<HTMLElement>('[data-icons-cat]')
        if (!chip) {
            return
        }
        activeCategory = chip.dataset.iconsCat ?? 'all'
        renderCats()
        renderGroups()
    })

    search.addEventListener('input', () => renderGroups())

    modeGroup.addEventListener('click', (event) => {
        const button = (event.target as HTMLElement).closest<HTMLElement>('[data-icons-format]')
        if (!button) {
            return
        }
        format = button.dataset.iconsFormat === 'html' ? 'html' : 'class'
        modeGroup.querySelectorAll<HTMLElement>('[data-icons-format]').forEach((item) => {
            item.classList.toggle('is-active', item === button)
        })
    })

    groupHost.addEventListener('click', (event) => {
        const button = (event.target as HTMLElement).closest<HTMLElement>('[data-icon-name]')
        if (!button) {
            return
        }
        void copy(button.dataset.iconName ?? '', format === 'html')
        button.classList.add('is-copied')
        window.setTimeout(() => button.classList.remove('is-copied'), 1200)
    })

    groupHost.addEventListener('dblclick', (event) => {
        const button = (event.target as HTMLElement).closest<HTMLElement>('[data-icon-name]')
        if (button) {
            void copy(button.dataset.iconName ?? '', true)
        }
    })

    renderCats()
    renderGroups()
}
