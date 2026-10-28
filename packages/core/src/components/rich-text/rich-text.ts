import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export type RichTextMode = 'visual' | 'markdown'

export interface RichTextOptions extends PlainObject {
    /** 初始 HTML */
    value: string
    /** 占位文案 */
    placeholder: string
    /** 编辑区可访问名称 */
    label: string
    /** 最小高度（CSS 像素） */
    minHeight: number
    /** 是否显示源码 / Markdown 视图 */
    markdown: boolean
    /** 粘帖时是否只保留纯文本 */
    plainPaste: boolean
    /** 内容变化回调 */
    onChange?: (payload: { html: string; markdown: string }) => void
}

interface ToolbarAction {
    /** 命令标识 */
    name: string
    /** 图标 class */
    icon: string
    /** 提示文案 */
    title: string
    /** 执行体 */
    run: (editor: RichText) => void
}

const BLOCK_FORMATS: Array<{ value: string; label: string }> = [
    { value: 'p', label: '正文' },
    { value: 'h2', label: '标题' },
    { value: 'h3', label: '小标题' },
    { value: 'blockquote', label: '引用' },
    { value: 'pre', label: '代码块' },
]

/**
 * 富文本。
 * 可视编辑与 Markdown 共用同一份内容：工具栏改动即时反映到 HTML，
 * 切到 Markdown 视图看到的就是可直接提交的文本，切回时再解析回 HTML。
 */
export class RichText extends Component<RichTextOptions> {
    static readonly componentName = 'rich-text'
    static readonly selector = '[data-kui-rich-text]'
    static readonly defaults: RichTextOptions = {
        value: '',
        placeholder: '开始输入内容…',
        label: '富文本编辑区',
        minHeight: 180,
        markdown: true,
        plainPaste: true,
    }

    private editor!: HTMLElement
    private toolbar!: HTMLElement
    private source: HTMLTextAreaElement | null = null
    private mode: RichTextMode = 'visual'
    private emitTimer: number | null = null

    private constructor(element: HTMLElement, options: Partial<RichTextOptions> = {}) {
        super(element, RichText.componentName, mergeOptions(RichText.defaults, options))
        this.mount()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<RichTextOptions> = {}): RichText {
        const element = RichText.resolveElement(target)
        return (
            getInstance<RichText>(element, RichText.componentName) ??
            new RichText(element, { ...readDataOptions<RichTextOptions>(element), ...options })
        )
    }

    /** 当前 HTML */
    get html(): string {
        return this.mode === 'visual' ? this.editor.innerHTML : markdownToHtml(this.sourceValue())
    }

    /** 当前 Markdown */
    get markdown(): string {
        return this.mode === 'visual' ? htmlToMarkdown(this.editor.innerHTML) : this.sourceValue()
    }

    getHtml(): string {
        return this.html
    }

    /** 写入 HTML */
    setHtml(html: string): void {
        if (this.mode === 'visual') {
            this.editor.innerHTML = html
        }
        if (this.source) {
            this.source.value = htmlToMarkdown(html)
        }
        this.scheduleChange()
    }

    /** 写入 Markdown */
    setMarkdown(markdown: string): void {
        if (this.mode === 'visual') {
            this.editor.innerHTML = markdownToHtml(markdown)
        }
        if (this.source) {
            this.source.value = markdown
        }
        this.scheduleChange()
    }

    /** 切换 可视 / Markdown 视图 */
    setMode(mode: RichTextMode): void {
        if (mode === this.mode) {
            return
        }
        if (mode === 'markdown') {
            if (this.source) {
                this.source.value = htmlToMarkdown(this.editor.innerHTML)
            }
        } else if (this.source) {
            this.editor.innerHTML = markdownToHtml(this.source.value)
        }
        this.mode = mode
        this.element.classList.toggle('is-markdown', mode === 'markdown')
        this.editor.hidden = mode === 'markdown'
        if (this.source) {
            this.source.hidden = mode !== 'markdown'
        }
        this.toolbar.querySelectorAll<HTMLElement>('[data-richtext-visual-only]').forEach((node) => {
            node.hidden = mode === 'markdown'
        })
        this.scheduleChange()
    }

    /** 聚焦编辑区 */
    focus(): void {
        if (this.mode === 'visual') {
            this.editor.focus()
        } else {
            this.source?.focus()
        }
    }

    private mount(): void {
        this.element.classList.add('kui-rich-text')
        this.element.style.setProperty('--kui-rich-text-min-height', `${this.options.minHeight}px`)
        this.element.replaceChildren()

        const toolbar = document.createElement('div')
        toolbar.className = 'kui-rich-text__toolbar'
        toolbar.setAttribute('role', 'toolbar')
        toolbar.setAttribute('aria-label', '文本格式')

        const editor = document.createElement('div')
        editor.className = 'kui-rich-text__editor'
        editor.contentEditable = 'true'
        editor.setAttribute('role', 'textbox')
        editor.setAttribute('aria-multiline', 'true')
        editor.setAttribute('aria-label', this.options.label)
        editor.dataset.placeholder = this.options.placeholder
        editor.innerHTML = this.options.value

        this.toolbar = toolbar
        this.editor = editor

        this.buildToolbar()

        if (this.options.markdown) {
            const source = document.createElement('textarea')
            source.className = 'kui-rich-text__source'
            source.spellcheck = false
            source.setAttribute('aria-label', 'Markdown 源码')
            source.hidden = true
            source.value = htmlToMarkdown(this.options.value)
            this.source = source
            this.listen(source, 'input', () => this.scheduleChange())
            this.element.append(toolbar, editor, source)
        } else {
            this.element.append(toolbar, editor)
        }

        this.listen(editor, 'input', () => this.scheduleChange())
        this.listen(editor, 'paste', (event) => this.onPaste(event))
        this.listen(editor, 'keydown', (event) => {
            if (event.key === 'Tab') {
                event.preventDefault()
                document.execCommand('insertText', false, '    ')
            }
        })
    }

    private buildToolbar(): void {
        const actions: ToolbarAction[] = [
            { name: 'undo', icon: 'fa fa-undo', title: '撤销', run: () => document.execCommand('undo') },
            { name: 'redo', icon: 'fa fa-repeat', title: '重做', run: () => document.execCommand('redo') },
            { name: 'bold', icon: 'fa fa-bold', title: '加粗', run: () => document.execCommand('bold') },
            { name: 'italic', icon: 'fa fa-italic', title: '斜体', run: () => document.execCommand('italic') },
            { name: 'underline', icon: 'fa fa-underline', title: '下划线', run: () => document.execCommand('underline') },
            { name: 'strike', icon: 'fa fa-strikethrough', title: '删除线', run: () => document.execCommand('strikeThrough') },
            {
                name: 'ul',
                icon: 'fa fa-list-ul',
                title: '无序列表',
                run: () => document.execCommand('insertUnorderedList'),
            },
            {
                name: 'ol',
                icon: 'fa fa-list-ol',
                title: '有序列表',
                run: () => document.execCommand('insertOrderedList'),
            },
            { name: 'quote', icon: 'fa fa-quote-left', title: '引用', run: () => document.execCommand('formatBlock', false, 'blockquote') },
            { name: 'code', icon: 'fa fa-code', title: '行内代码', run: (editor) => editor.wrapSelection('code') },
            {
                name: 'link',
                icon: 'fa fa-link',
                title: '链接',
                run: () => {
                    const url = window.prompt('输入链接地址', 'https://')
                    if (url) {
                        document.execCommand('createLink', false, url)
                    }
                },
            },
            {
                name: 'image',
                icon: 'fa fa-picture-o',
                title: '图片',
                run: (editor) => {
                    const url = window.prompt('输入图片地址', 'https://')
                    if (url) {
                        editor.insertHtml(`<img src="${escapeAttribute(url)}" alt="">`)
                    }
                },
            },
            { name: 'clear', icon: 'fa fa-eraser', title: '清除格式', run: () => document.execCommand('removeFormat') },
        ]

        const format = document.createElement('select')
        format.className = 'kui-rich-text__select'
        format.setAttribute('aria-label', '段落格式')
        BLOCK_FORMATS.forEach((item) => {
            const option = document.createElement('option')
            option.value = item.value
            option.textContent = item.label
            format.append(option)
        })
        this.listen(format, 'change', () => {
            document.execCommand('formatBlock', false, format.value)
            format.value = 'p'
        })
        format.dataset.richtextVisualOnly = ''
        this.toolbar.append(format)

        actions.forEach((action) => {
            const button = document.createElement('button')
            button.type = 'button'
            button.className = 'kui-rich-text__button'
            button.title = action.title
            button.setAttribute('aria-label', action.title)
            button.dataset.action = action.name
            button.innerHTML = `<i class="${action.icon}" aria-hidden="true"></i>`
            button.addEventListener('mousedown', (event) => event.preventDefault())
            button.addEventListener('click', () => {
                this.editor.focus()
                action.run(this)
                this.scheduleChange()
            })
            this.toolbar.append(button)
        })

        if (this.options.markdown) {
            const toggle = document.createElement('button')
            toggle.type = 'button'
            toggle.className = 'kui-rich-text__mode'
            toggle.dataset.richtextMode = ''
            toggle.innerHTML = '<i class="fa fa-code" aria-hidden="true"></i><span>Markdown</span>'
            toggle.addEventListener('click', () => {
                const next = this.mode === 'visual' ? 'markdown' : 'visual'
                this.setMode(next)
                toggle.classList.toggle('is-active', next === 'markdown')
            })
            this.toolbar.append(toggle)
        }
    }

    private sourceValue(): string {
        return this.source?.value ?? ''
    }

    private onPaste(event: ClipboardEvent): void {
        if (!this.options.plainPaste) {
            return
        }
        const text = event.clipboardData?.getData('text/plain')
        if (text === undefined) {
            return
        }
        event.preventDefault()
        this.insertHtml(escapeHtml(text).replace(/\n/g, '<br>'))
    }

    private insertHtml(html: string): void {
        document.execCommand('insertHTML', false, html)
        this.scheduleChange()
    }

    private wrapSelection(tag: string): void {
        const selection = window.getSelection()
        const text = selection?.toString() ?? ''
        this.insertHtml(`<${tag}>${escapeHtml(text) || '代码'}</${tag}>`)
    }

    private scheduleChange(): void {
        if (this.emitTimer !== null) {
            window.clearTimeout(this.emitTimer)
        }
        this.emitTimer = window.setTimeout(() => {
            const payload = { html: this.html, markdown: this.markdown }
            this.options.onChange?.(payload)
            this.emit('kui:rich-text:change', payload)
        }, 180)
    }

    dispose(): void {
        if (this.emitTimer !== null) {
            window.clearTimeout(this.emitTimer)
        }
        super.dispose()
    }
}

/** HTML → Markdown：只覆盖富文本工具栏能产出的结构 */
export function htmlToMarkdown(html: string): string {
    const root = document.createElement('div')
    root.innerHTML = html
    return convertChildren(root)
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

function convertChildren(node: Node): string {
    return Array.from(node.childNodes)
        .map((child) => convertNode(child))
        .join('')
}

function convertNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
        return (node.textContent ?? '').replace(/\s+/g, ' ')
    }
    if (!(node instanceof HTMLElement)) {
        return ''
    }
    const inner = convertChildren(node).trim()
    switch (node.tagName.toLowerCase()) {
        case 'h1':
            return `# ${inner}\n\n`
        case 'h2':
            return `## ${inner}\n\n`
        case 'h3':
            return `### ${inner}\n\n`
        case 'h4':
            return `#### ${inner}\n\n`
        case 'p':
        case 'div':
            return inner ? `${inner}\n\n` : ''
        case 'br':
            return '\n'
        case 'strong':
        case 'b':
            return `**${inner}**`
        case 'em':
        case 'i':
            return `*${inner}*`
        case 'u':
            return `<u>${inner}</u>`
        case 'del':
        case 's':
        case 'strike':
            return `~~${inner}~~`
        case 'code':
            return `\`${node.textContent ?? ''}\``
        case 'pre':
            return `\`\`\`\n${node.textContent ?? ''}\n\`\`\`\n\n`
        case 'blockquote':
            return `${inner
                .split('\n')
                .map((line) => `> ${line}`)
                .join('\n')}\n\n`
        case 'ul':
        case 'ol': {
            const ordered = node.tagName.toLowerCase() === 'ol'
            const items = Array.from(node.children)
                .filter((child) => child.tagName.toLowerCase() === 'li')
                .map((child, index) => `${ordered ? `${index + 1}.` : '-'} ${convertChildren(child).trim()}`)
            return `${items.join('\n')}\n\n`
        }
        case 'a':
            return `[${inner || (node.getAttribute('href') ?? '')}](${node.getAttribute('href') ?? ''})`
        case 'img':
            return `![${node.getAttribute('alt') ?? ''}](${node.getAttribute('src') ?? ''})`
        default:
            return inner ? `${inner}\n\n` : ''
    }
}

/** Markdown → HTML：支持标题、列表、引用、代码块与常见行内语法 */
export function markdownToHtml(markdown: string): string {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n')
    const output: string[] = []
    let index = 0

    while (index < lines.length) {
        const line = lines[index]

        if (/^```/.test(line)) {
            const language = line.slice(3).trim()
            const buffer: string[] = []
            index += 1
            while (index < lines.length && !/^```/.test(lines[index])) {
                buffer.push(lines[index])
                index += 1
            }
            index += 1
            output.push(`<pre><code${language ? ` class="language-${escapeAttribute(language)}"` : ''}>${escapeHtml(buffer.join('\n'))}</code></pre>`)
            continue
        }

        if (/^\s*$/.test(line)) {
            index += 1
            continue
        }

        const heading = /^(#{1,6})\s+(.*)$/.exec(line)
        if (heading) {
            const level = Math.min(heading[1].length, 6)
            output.push(`<h${level}>${inline(heading[2])}</h${level}>`)
            index += 1
            continue
        }

        if (/^>\s?/.test(line)) {
            const buffer: string[] = []
            while (index < lines.length && /^>\s?/.test(lines[index])) {
                buffer.push(lines[index].replace(/^>\s?/, ''))
                index += 1
            }
            output.push(`<blockquote>${buffer.map((item) => `<p>${inline(item)}</p>`).join('')}</blockquote>`)
            continue
        }

        if (/^\s*[-*+]\s+/.test(line)) {
            const buffer: string[] = []
            while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
                buffer.push(`<li>${inline(lines[index].replace(/^\s*[-*+]\s+/, ''))}</li>`)
                index += 1
            }
            output.push(`<ul>${buffer.join('')}</ul>`)
            continue
        }

        if (/^\s*\d+\.\s+/.test(line)) {
            const buffer: string[] = []
            while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
                buffer.push(`<li>${inline(lines[index].replace(/^\s*\d+\.\s+/, ''))}</li>`)
                index += 1
            }
            output.push(`<ol>${buffer.join('')}</ol>`)
            continue
        }

        const paragraph: string[] = []
        while (index < lines.length && !/^\s*$/.test(lines[index]) && !/^(#{1,6})\s+|^```|^>\s?|^\s*[-*+]\s+|^\s*\d+\.\s+/.test(lines[index])) {
            paragraph.push(lines[index])
            index += 1
        }
        output.push(`<p>${inline(paragraph.join(' '))}</p>`)
    }

    return output.join('')
}

function inline(text: string): string {
    return escapeHtml(text)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
        .replace(/~~([^~]+)~~/g, '<del>$1</del>')
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function escapeAttribute(value: string): string {
    return escapeHtml(value).replace(/'/g, '&#39;')
}
