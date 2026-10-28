import { CodeBlock } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, codeSample, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 代码块。
 * 代码块用深色底把「源码」与「正文」分开，工具条只放语言、行号与复制；
 * 语言决定高亮规则，认不出来的语言退回纯文本，而不是报错或空白。
 */

interface CodeSample {
    /** 语言标签 */
    label: string
    /** 源码 */
    code: string
}

const SAMPLES: Record<string, CodeSample> = {
    ts: {
        label: 'TypeScript',
        code: `import { Progress } from '@kui/core'

const bar = Progress.getOrCreate('#upload', { value: 40, showText: true })
bar.setValue(72)

export function report(): number {
    return bar.getPercent()
}`,
    },
    js: {
        label: 'JavaScript',
        code: `document.addEventListener('DOMContentLoaded', () => {
    const panel = document.querySelector('[data-panel]')
    if (!panel) return

    panel.classList.add('is-ready')
    console.log('panel ready', panel.dataset.panel)
})`,
    },
    java: {
        label: 'Java',
        code: `public final class OrderService {
    private final List<Order> orders = new ArrayList<>();

    public void add(Order order) {
        orders.add(Objects.requireNonNull(order));
    }

    public int count() {
        return orders.size();
    }
}`,
    },
    json: {
        label: 'JSON',
        code: `{
  "name": "kui-docs",
  "private": true,
  "scripts": { "build": "vite build" },
  "dependencies": {
    "@kui/core": "^0.1.0",
    "@kui/tokens": "^0.1.0"
  }
}`,
    },
    xml: {
        label: 'XML',
        code: `<header class="kui-page-header">
    <div class="kui-page-header__text">
        <h2 class="kui-page-header__title">渠道复盘</h2>
        <p class="kui-page-header__desc">数据截至昨天 24:00。</p>
    </div>
</header>`,
    },
    yml: {
        label: 'YML',
        code: `theme:
  name: green
  radius: 6px
tokens:
  - --kui-color-primary
  - --kui-space-4
build:
  target: es2022
  sourcemap: false`,
    },
}

const UNKNOWN_SAMPLE = `G21 ; 单位：毫米
G90 ; 绝对坐标
M104 S200 ; 喷头升温
G28 ; 回零
G1 X40 Y32 F1200 ; 移动到起点`

const LONG_SAMPLE = `<main class="docs-content" id="docs-content" tabindex="-1">
    <header class="doc-page__head">
        <p class="doc-page__crumb"><span>基础样式 01</span></p>
        <h1 class="doc-page__title">排版</h1>
        <p class="doc-page__lead">字号、字重、行高共同决定一屏信息的阅读顺序。</p>
    </header>
    <section class="doc-demo" id="typ-scale" data-demo>
        <header class="doc-demo__head">
            <h3 class="doc-demo__title" data-demo-title>字号阶梯</h3>
        </header>
        <div class="doc-demo__stage">
            <table class="table">
                <thead><tr><th>级</th><th>写法</th><th>像素</th></tr></thead>
                <tbody><tr><td>1</td><td>h1</td><td>28</td></tr></tbody>
            </table>
        </div>
    </section>
    <section class="doc-props">
        <h2 class="doc-props__title">API</h2>
    </section>
</main>`

/** 示例里的源码要按文本写进 HTML，尖括号必须先转义 */
function escapeCode(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const languageButtons = Object.entries(SAMPLES)
    .map(([language, sample], index) => {
        const active = index === 0 ? ' class="is-active"' : ''
        return `<button type="button"${active} data-code-lang="${language}">${sample.label}</button>`
    })
    .join('\n            ')

export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '代码块负责呈现源码并支持一键复制。语言标签由 data-language 决定，行号可以随时开关，长代码在块内滚动；认不出来的语言退回纯文本，正文里提到的标识符则使用行内代码。',
    tags: ['CodeBlock', '[data-kui-code-block]', 'setLanguage()'],
})}

${sectionTitle('语言与行号', '六种语言共用同一个实例：切语言换的是高亮规则与源码，块的位置与宽度不变。')}

${demo({
    title: '六种语言切换',
    desc: '按钮调用 setLanguage() 换高亮规则、调用 setSource() 换源码；行号开关调用 setLineNumbers()，复制按钮由组件生成，取的是纯文本源码。',
    tags: ['setLanguage()', 'setLineNumbers()', 'data-kui-code-block'],
    script: `
// SAMPLES 为页面里定义的六段源码，键与 data-code-lang 一致
declare const SAMPLES: Record<string, { label: string; code: string }>

const block = CodeBlock.getOrCreate('[data-code-live]', {
    language: 'ts',
    lineNumbers: false,
    lineNumbersToggle: false,
})
const hint = document.querySelector<HTMLElement>('[data-code-hint]')
const lineNumberToggle = document.querySelector<HTMLInputElement>('[data-code-linenos]')

const syncHint = (language: string): void => {
    const sample = SAMPLES[language]
    if (hint) hint.textContent = '当前 ' + sample.label + ' · ' + sample.code.split('\\n').length + ' 行'
}

document.querySelectorAll<HTMLButtonElement>('[data-code-lang]').forEach((button) => {
    button.addEventListener('click', () => {
        const language = button.dataset.codeLang ?? 'ts'
        block.setLanguage(language)
        block.setSource(SAMPLES[language].code)
        document.querySelectorAll('[data-code-lang]').forEach((item) => item.classList.toggle('is-active', item === button))
        syncHint(language)
    })
})

lineNumberToggle?.addEventListener('change', () => {
    block.setLineNumbers(lineNumberToggle.checked)
})
`,
    html: `
<div class="kui-board kui-stack">
    <div class="kui-cluster kui-justify-between">
        <div class="kui-segmented" role="group" aria-label="选择语言">
            ${languageButtons}
        </div>
        <label class="form-check">
            <input class="kui-checkbox" type="checkbox" data-code-linenos>
            <span>行号</span>
        </label>
    </div>
    <div class="kui-code-block" data-kui-code-block data-code-live data-language="ts">
        <pre><code>${escapeCode(SAMPLES.ts.code)}</code></pre>
    </div>
    <p class="kui-stat__label" data-code-hint>当前 TypeScript · ${SAMPLES.ts.code.split('\n').length} 行</p>
</div>`,
})}

${sectionTitle('兜底与长代码', '认不出来的语言只是不高亮，不影响阅读与复制；过长时给它一个最大高度，页面本身不被撑长。')}

${demo({
    title: '无法识别语言时的兜底',
    desc: 'data-language 写成 gcode 这类未登记的值时，语言标签显示 plain、内容按纯文本渲染；不会报错，也不会把源码吞掉。',
    tags: ['normalizeLanguage', 'plain'],
    html: `
<div class="kui-stack">
    <div class="kui-code-block" data-kui-code-block data-language="gcode">
        <pre><code>${escapeCode(UNKNOWN_SAMPLE)}</code></pre>
    </div>
    <div class="kui-cluster">
        <span class="kui-stat__label">支持 ts / js / java / json / xml / yml / css / bash / sql / md / plain，别名同样识别。</span>
    </div>
</div>`,
})}

${demo({
    title: '行号、最大高度与复制',
    desc: '长代码开行号便于指位，超过 200px 后在块内滚动；工具条右侧的行号按钮与复制按钮都作用于当前实例，复制成功后就地变成「已复制」。',
    tags: ['data-line-numbers', 'data-max-height', '.kui-code-block__copy'],
    html: `
<div class="kui-board kui-stack">
    <div class="kui-code-block" data-kui-code-block data-language="html" data-line-numbers data-max-height="200px">
        <pre><code>${escapeCode(LONG_SAMPLE)}</code></pre>
    </div>
    <div class="kui-cluster kui-justify-between">
        <span class="kui-stat__label">行号由 CSS 计数器绘制，复制时不会带上序号。</span>
        <span class="badge badge-neutral">约 1.9 屏</span>
    </div>
</div>`,
})}

${demo({
    title: '行内代码',
    desc: '正文里被提到的类名、属性与命令用行内代码包住，它跟随正文着色、不换行、不带复制，不打断阅读节奏。',
    tags: ['.kui-inline-code'],
    html: `
<div class="kui-prose">
    <p>正文里提到 <code class="kui-inline-code">data-kui-code-block</code>、<code class="kui-inline-code">--kui-color-primary</code> 或 <code class="kui-inline-code">CodeBlock.getOrCreate()</code> 时用行内代码，字号随正文缩放，不单独占一行。</p>
    <p>整段源码才用深色块：<code class="kui-inline-code">setSource()</code> 替换内容、<code class="kui-inline-code">copy()</code> 复制到剪贴板，两者都作用于同一个实例。</p>
</div>`,
})}

${callout('在示例里再嵌代码块时，必须先把源码的尖括号写成 <code>&amp;lt;</code> 与 <code>&amp;gt;</code>，否则浏览器会把它当成真实结构渲染；页面自身用转义函数统一处理这一步。')}

${codeSample(`
npm install @kui/core @kui/style @kui/tokens

# 只装核心组件与样式
npm install @kui/core @kui/style
`, 'bash', '安装')}

${propsTable([
    { name: 'data-kui-code-block', type: 'attribute', defaultValue: '—', desc: '标记代码块容器，页面挂载时自动初始化并登记实例。' },
    { name: 'data-language', type: 'string', defaultValue: 'ts', desc: '语言标签，同时写入 <code>language-*</code> 类名；未登记的值退回 <code>plain</code>。' },
    { name: 'data-copyable', type: 'boolean', defaultValue: 'true', desc: '是否显示复制按钮；关闭后工具条只留语言与行号。' },
    { name: 'data-line-numbers', type: 'boolean', defaultValue: 'false', desc: '初始开启行号，左侧留出 2.8em 槽位。' },
    { name: 'data-max-height', type: 'string', defaultValue: '—', desc: '内容区最大高度，例如 <code>200px</code>，超出后块内滚动。' },
    { name: 'lineNumbersToggle', type: 'boolean', defaultValue: 'true', desc: '是否在工具条里提供行号按钮；自管开关时设为 <code>false</code>。' },
    { name: '.kui-code-block__toolbar / __lang / __copy', type: 'class', defaultValue: '—', desc: '工具条、语言标签与复制按钮，由实例生成。' },
    { name: '.kui-code-block--numbered', type: 'class', defaultValue: '—', desc: '行号状态类，由 <code>setLineNumbers()</code> 切换。' },
    { name: '.kui-code-block__tok--*', type: 'class', defaultValue: '—', desc: '语法色：keyword / string / number / key / tag / attr / comment。' },
    { name: 'CodeBlock.getOrCreate(el, options)', type: 'method', defaultValue: '—', desc: '按元素取实例或新建，选项与 data-* 合并。' },
    { name: 'setSource(source)', type: 'method', defaultValue: '—', desc: '替换源码并重新高亮，不改语言。' },
    { name: 'setLanguage(language)', type: 'method', defaultValue: '—', desc: '切换语言标签与高亮规则，认不出时退回纯文本。' },
    { name: 'setLineNumbers(enabled)', type: 'method', defaultValue: 'false', desc: '显示或隐藏行号，同时更新工具条按钮的 <code>aria-pressed</code>。' },
    { name: 'copy()', type: 'method', defaultValue: '—', desc: '复制纯文本源码，触发 <code>kui:code-block:copy</code>。' },
    { name: '.kui-inline-code', type: 'class', defaultValue: '—', desc: '行内代码，浅底细边，不参与复制。' },
])}

`

    /* ---------- 语言切换与行号开关 ---------- */
    const block = root.querySelector<HTMLElement>('[data-code-live]')
    const hint = root.querySelector<HTMLElement>('[data-code-hint]')
    const lineNumberToggle = root.querySelector<HTMLInputElement>('[data-code-linenos]')

    if (block) {
        const instance = CodeBlock.getOrCreate(block, {
            language: 'ts',
            lineNumbers: false,
            lineNumbersToggle: false,
        })
        trackComponent(instance)

        const syncHint = (language: string): void => {
            const sample = SAMPLES[language] ?? SAMPLES.ts
            if (hint) {
                hint.textContent = `当前 ${sample.label} · ${sample.code.split('\n').length} 行`
            }
        }

        root.querySelectorAll<HTMLButtonElement>('[data-code-lang]').forEach((button) => {
            button.addEventListener('click', () => {
                const language = button.dataset.codeLang ?? 'ts'
                const sample = SAMPLES[language] ?? SAMPLES.ts
                instance.setLanguage(language)
                instance.setSource(sample.code)
                root.querySelectorAll('[data-code-lang]').forEach((item) => {
                    item.classList.toggle('is-active', item === button)
                })
                syncHint(language)
            })
        })

        lineNumberToggle?.addEventListener('change', () => {
            instance.setLineNumbers(lineNumberToggle.checked)
        })
    }
}
