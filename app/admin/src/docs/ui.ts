import { CodeBlock } from '@kui/core'
import { trackComponent } from '../context'
import { groupIndexLabel } from './nav'
import type { DocPageMeta } from './types'

/**
 * 文档页面的展示元件。
 * 每个示例都是「标题 + 说明 + 实时预览 + 可复制源码」四段式：
 * 预览与源码来自同一份字符串，复制出去的就是页面上正在跑的代码。
 */

export type DemoStage = 'pad' | 'flush' | 'grid' | 'center' | 'tinted'

export interface DemoOptions {
    /** 示例标题 */
    title: string
    /** 一句话说明 */
    desc?: string
    /** 预览区 HTML，同时作为源码 */
    html: string
    /** 初始化脚本（可选，作为第二段源码展示） */
    script?: string
    /** 预览区样式变体 */
    stage?: DemoStage
    /** 右上角的标签，例如组件名、选择器 */
    tags?: string[]
}

let demoSeq = 0

/** 每次渲染新页面前重置示例序号 */
export function resetDemoSeq(): void {
    demoSeq = 0
}

export function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** 去掉模板字符串带来的公共缩进，保证复制出去的源码左侧对齐 */
export function dedent(value: string): string {
    const lines = value.replace(/^\n+/, '').replace(/\s+$/, '').split('\n')
    const indents = lines.filter((line) => line.trim()).map((line) => (/^\s*/.exec(line) ?? [''])[0].length)
    const indent = indents.length ? Math.min(...indents) : 0
    return lines.map((line) => line.slice(indent)).join('\n')
}

/**
 * 示例脚本在展示时去掉文档站的内部接线（root 作用域、实例登记），
 * 让复制出去的代码在普通页面里可以直接运行。
 */
function normalizeScript(source: string): string {
    return source
        .split('\n')
        .map((line) => line.replace(/trackComponent\(((?:[^()]|\([^()]*\))*)\)/g, '$1'))
        .map((line) => line.replace(/\broot\./g, 'document.'))
        .filter((line) => !/^\s*[A-Za-z_$][\w$]*\s*;?\s*$/.test(line))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

function codePanel(source: string, language: string, label: string): string {
    const note =
        label === '初始化脚本'
            ? '<p class="doc-code__note">示例省略了 import 与实例登记；组件选项见页末 API 表。</p>'
            : ''
    return `
<div class="doc-code">
    <p class="doc-code__label">${label}</p>
    <div class="kui-code-block" data-kui-code-block data-language="${language}">
        <pre><code>${escapeHtml(source)}</code></pre>
    </div>
    ${note}
</div>`
}

export function demo(options: DemoOptions): string {
    demoSeq += 1
    const id = `demo-${demoSeq}`
    const stage = options.stage ?? 'pad'
    const tags = options.tags?.length
        ? `<div class="doc-demo__tags">${options.tags.map((tag) => `<code>${escapeHtml(tag)}</code>`).join('')}</div>`
        : ''
    const desc = options.desc ? `<p class="doc-demo__desc">${options.desc}</p>` : ''
    const script = options.script?.trim()
        ? codePanel(normalizeScript(dedent(options.script)), 'ts', '初始化脚本')
        : ''
    const html = dedent(options.html)

    return `
<section class="doc-demo" id="${id}" data-demo>
    <header class="doc-demo__head">
        <div class="doc-demo__text">
            <h3 class="doc-demo__title" data-demo-title>${options.title}</h3>
            ${desc}
            ${tags}
        </div>
        <button type="button" class="doc-demo__toggle" data-demo-toggle aria-expanded="false" aria-controls="${id}-code">
            <i class="fa fa-code" aria-hidden="true"></i><span>查看源代码</span>
        </button>
    </header>
    <div class="doc-demo__stage doc-demo__stage--${stage}">${html}</div>
    <div class="doc-demo__code" id="${id}-code" hidden>
        ${codePanel(html, 'html', 'HTML 结构')}
        ${script}
    </div>
</section>`
}

export interface PageHeadOptions {
    /** 一句话定位 */
    lead: string
    /** 组件名或选择器标签 */
    tags?: string[]
}

export function pageHead(meta: DocPageMeta, options: PageHeadOptions): string {
    const tags = options.tags?.length
        ? `<div class="doc-page__tags">${options.tags.map((tag) => `<code>${escapeHtml(tag)}</code>`).join('')}</div>`
        : ''
    return `
<header class="doc-page__head">
    <p class="doc-page__crumb"><span>${groupIndexLabel(meta.id)}</span></p>
    <h1 class="doc-page__title">${meta.title}</h1>
    <p class="doc-page__lead">${options.lead}</p>
    ${tags}
</header>`
}

export interface PropRow {
    /** 名称 */
    name: string
    /** 类型 */
    type: string
    /** 默认值 */
    defaultValue?: string
    /** 说明 */
    desc: string
}

/** 属性表：复杂表格之外统一使用这张表说明 API */
export function propsTable(rows: PropRow[], caption = 'API'): string {
    return `
<section class="doc-props">
    <h2 class="doc-props__title">${caption}</h2>
    <div class="doc-props__scroll" tabindex="0" role="region" aria-label="${caption} 表格">
        <table class="table doc-props__table">
            <thead>
                <tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr>
            </thead>
            <tbody>
                ${rows
                    .map(
                        (row) => `<tr>
                    <td><code>${escapeHtml(row.name)}</code></td>
                    <td><code>${escapeHtml(row.type)}</code></td>
                    <td>${row.defaultValue ? `<code>${escapeHtml(row.defaultValue)}</code>` : '—'}</td>
                    <td>${row.desc}</td>
                </tr>`,
                    )
                    .join('')}
            </tbody>
        </table>
    </div>
</section>`
}

/** 页内小节标题，用于把多个示例归入同一主题 */
export function sectionTitle(title: string, desc?: string): string {
    return `
<header class="doc-section">
    <h2>${title}</h2>
    ${desc ? `<p>${desc}</p>` : ''}
</header>`
}

/** 提示块：用于标注限制条件或兼容说明 */
export function callout(content: string, tone: 'info' | 'warning' = 'info'): string {
    const icon = tone === 'warning' ? 'fa fa-exclamation-triangle' : 'fa fa-info-circle'
    return `<div class="alert alert-${tone}"><i class="${icon}" aria-hidden="true"></i><div>${content}</div></div>`
}

/** 代码块（非示例用，例如安装命令） */
export function codeSample(source: string, language = 'bash', label = '示例'): string {
    return codePanel(dedent(source), language, label)
}

/** 页面挂载后的共同增强：源码复制、展开/收起、进场动画 */
export function mountPage(root: HTMLElement): void {
    root.querySelectorAll<HTMLElement>('[data-kui-code-block]').forEach((element) => {
        trackComponent(CodeBlock.getOrCreate(element, { language: element.dataset.language ?? 'html' }))
    })

    root.querySelectorAll<HTMLElement>('[data-demo-toggle]').forEach((button) => {
        button.addEventListener('click', () => {
            const section = button.closest<HTMLElement>('[data-demo]')
            const panel = section?.querySelector<HTMLElement>('.doc-demo__code')
            if (!section || !panel) {
                return
            }
            const open = button.getAttribute('aria-expanded') === 'true'
            button.setAttribute('aria-expanded', String(!open))
            section.classList.toggle('is-open', !open)
            panel.hidden = open
            const label = button.querySelector('span')
            if (label) {
                label.textContent = open ? '查看源代码' : '收起代码'
            }
        })
    })

    root.querySelectorAll<HTMLElement>('[data-demo]').forEach((section) => {
        section.classList.add('is-revealed')
    })
}
