import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export interface CodeBlockOptions extends PlainObject {
    /** 语言标识（ts / js / java / json / xml / yml / css / bash / sql / md / plain） */
    language: string
    /** 是否提供复制按钮 */
    copyable: boolean
    /** 是否显示行号 */
    lineNumbers: boolean
    /** 是否提供行号开关 */
    lineNumbersToggle: boolean
    /** 最大高度，超出滚动 */
    maxHeight: string
    /** 复制成功回调 */
    onCopy?: (source: string) => void
}

const LANGUAGE_ALIASES: Record<string, string> = {
    ts: 'ts',
    typescript: 'ts',
    tsx: 'ts',
    js: 'js',
    javascript: 'js',
    mjs: 'js',
    jsx: 'js',
    java: 'java',
    json: 'json',
    jsonc: 'json',
    xml: 'xml',
    html: 'html',
    svg: 'xml',
    yml: 'yml',
    yaml: 'yml',
    css: 'css',
    scss: 'css',
    less: 'css',
    sh: 'bash',
    bash: 'bash',
    shell: 'bash',
    zsh: 'bash',
    sql: 'sql',
    md: 'md',
    markdown: 'md',
    text: 'plain',
    plain: 'plain',
}

const KEYWORDS: Record<string, string[]> = {
    ts: ['as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'finally', 'for', 'from', 'function', 'if', 'implements', 'import', 'in', 'interface', 'let', 'new', 'of', 'private', 'protected', 'public', 'readonly', 'return', 'static', 'super', 'switch', 'this', 'throw', 'try', 'type', 'typeof', 'var', 'void', 'while', 'yield'],
    js: ['async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'from', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'of', 'return', 'static', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'yield'],
    java: ['abstract', 'boolean', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 'do', 'else', 'enum', 'extends', 'final', 'finally', 'for', 'if', 'implements', 'import', 'instanceof', 'interface', 'new', 'package', 'private', 'protected', 'public', 'return', 'static', 'super', 'switch', 'this', 'throw', 'throws', 'try', 'void', 'while'],
    sql: ['select', 'from', 'where', 'join', 'left', 'right', 'inner', 'outer', 'on', 'group', 'by', 'order', 'having', 'limit', 'offset', 'insert', 'into', 'values', 'update', 'set', 'delete', 'create', 'table', 'alter', 'drop', 'index', 'as', 'and', 'or', 'not', 'null', 'distinct'],
}

const COMMENT: Record<string, { line?: string; block?: [string, string] }> = {
    ts: { line: '//', block: ['/*', '*/'] },
    js: { line: '//', block: ['/*', '*/'] },
    java: { line: '//', block: ['/*', '*/'] },
    css: { block: ['/*', '*/'] },
    yml: { line: '#' },
    bash: { line: '#' },
    sql: { line: '--' },
}

function normalizeLanguage(value: string): string {
    return LANGUAGE_ALIASES[value.trim().toLowerCase()] ?? 'plain'
}

function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function wrap(kind: string, value: string): string {
    return `<span class="kui-code-block__tok kui-code-block__tok--${kind}">${escapeHtml(value)}</span>`
}

/** 轻量高亮：只识别注释、字符串、数字与关键字，不追求完整语法 */
function highlight(source: string, language: string): string {
    if (language === 'plain' || language === 'md') {
        return escapeHtml(source)
    }

    const keywords = KEYWORDS[language] ?? []
    const comment = COMMENT[language]
    const blocks: Array<{ pattern: string; kind: string }> = []

    if (comment?.block) {
        blocks.push({ pattern: `${escapeRegExp(comment.block[0])}[\\s\\S]*?${escapeRegExp(comment.block[1])}`, kind: 'comment' })
    }
    if (comment?.line) {
        blocks.push({ pattern: `${escapeRegExp(comment.line)}[^\\n]*`, kind: 'comment' })
    }
    if (language === 'xml' || language === 'html') {
        blocks.push({ pattern: '<!--[\\s\\S]*?-->', kind: 'comment' })
        blocks.push({ pattern: '</?[\\w:.-]+', kind: 'tag' })
        blocks.push({ pattern: '[\\w:.-]+(?==)', kind: 'attr' })
    }
    if (language === 'json') {
        blocks.push({ pattern: '"(?:\\\\.|[^"\\\\])*"(?=\\s*:)', kind: 'key' })
    }
    if (language === 'yml') {
        blocks.push({ pattern: '^[ \\t-]*[\\w.-]+(?=\\s*:)', kind: 'key' })
    }
    blocks.push({ pattern: '"(?:\\\\.|[^"\\\\])*"', kind: 'string' })
    blocks.push({ pattern: "'(?:\\\\.|[^'\\\\])*'", kind: 'string' })
    blocks.push({ pattern: '`(?:\\\\.|[^`\\\\])*`', kind: 'string' })
    blocks.push({ pattern: '\\b\\d+(?:\\.\\d+)?\\b', kind: 'number' })
    if (keywords.length) {
        blocks.push({ pattern: `\\b(?:${keywords.join('|')})\\b`, kind: 'keyword' })
    }

    const pattern = new RegExp(
        blocks
            .map((block) => `(${block.pattern})`)
            .join('|'),
        language === 'sql' ? 'gim' : 'gm',
    )
    const kinds = blocks.map((block) => block.kind)
    let result = ''
    let lastIndex = 0
    for (const match of source.matchAll(pattern)) {
        const index = match.index ?? 0
        result += escapeHtml(source.slice(lastIndex, index))
        const groupIndex = match.slice(1).findIndex((value) => value !== undefined)
        result += wrap(kinds[groupIndex] ?? 'plain', match[0])
        lastIndex = index + match[0].length
    }
    result += escapeHtml(source.slice(lastIndex))
    return result
}

/**
 * 代码块。
 * 统一承载源码呈现、行号、语言标识与一键复制；
 * 行号由 CSS 计数器绘制，复制仍然使用原始文本，不受高亮结构影响。
 */
export class CodeBlock extends Component<CodeBlockOptions> {
    static readonly componentName = 'code-block'
    static readonly selector = '[data-kui-code-block]'
    static readonly defaults: CodeBlockOptions = {
        language: 'ts',
        copyable: true,
        lineNumbers: false,
        lineNumbersToggle: true,
        maxHeight: '',
    }

    private code: HTMLElement | null = null
    private lineButton: HTMLButtonElement | null = null
    private languageLabel: HTMLElement | null = null
    private rawSource = ''

    private constructor(element: HTMLElement, options: Partial<CodeBlockOptions> = {}) {
        super(element, CodeBlock.componentName, mergeOptions(CodeBlock.defaults, options))
        this.rawSource = readSource(element)
        element.classList.add('kui-code-block')
        element.replaceChildren()
        this.render()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<CodeBlockOptions> = {}): CodeBlock {
        const element = CodeBlock.resolveElement(target)
        return (
            getInstance<CodeBlock>(element, CodeBlock.componentName) ??
            new CodeBlock(element, { ...readDataOptions<CodeBlockOptions>(element), ...options })
        )
    }

    /** 当前源码 */
    get source(): string {
        return this.rawSource
    }

    /** 替换源码 */
    setSource(source: string): void {
        this.rawSource = source
        this.paint()
    }

    /** 切换语言 */
    setLanguage(language: string): void {
        this.options.language = language
        if (this.languageLabel) {
            this.languageLabel.textContent = normalizeLanguage(language)
        }
        this.paint()
    }

    /** 显示 / 隐藏行号 */
    setLineNumbers(enabled: boolean): void {
        this.options.lineNumbers = enabled
        this.element.classList.toggle('kui-code-block--numbered', enabled)
        this.lineButton?.setAttribute('aria-pressed', String(enabled))
    }

    /** 复制到剪贴板 */
    async copy(): Promise<boolean> {
        const source = this.rawSource
        try {
            await navigator.clipboard.writeText(source)
        } catch {
            const textarea = document.createElement('textarea')
            textarea.value = source
            document.body.append(textarea)
            textarea.select()
            document.execCommand('copy')
            textarea.remove()
        }
        this.options.onCopy?.(source)
        this.emit('kui:code-block:copy', { source })
        return true
    }

    private render(): void {
        const language = normalizeLanguage(this.options.language)

        const toolbar = document.createElement('div')
        toolbar.className = 'kui-code-block__toolbar'

        const label = document.createElement('span')
        label.className = 'kui-code-block__lang'
        label.textContent = language
        this.languageLabel = label
        toolbar.append(label)

        const actions = document.createElement('span')
        actions.className = 'kui-code-block__actions'

        if (this.options.lineNumbersToggle) {
            const lineButton = document.createElement('button')
            lineButton.type = 'button'
            lineButton.className = 'kui-code-block__lineno'
            lineButton.setAttribute('aria-label', '行号')
            lineButton.setAttribute('aria-pressed', String(this.options.lineNumbers))
            lineButton.title = '显示 / 隐藏行号'
            lineButton.innerHTML = '<i class="fa fa-list-ol" aria-hidden="true"></i><span>行号</span>'
            this.listen(lineButton, 'click', () => this.setLineNumbers(!this.options.lineNumbers))
            this.lineButton = lineButton
            actions.append(lineButton)
        }

        if (this.options.copyable) {
            const copyButton = document.createElement('button')
            copyButton.type = 'button'
            copyButton.className = 'kui-code-block__copy'
            copyButton.innerHTML = '<i class="fa fa-clone" aria-hidden="true"></i><span>复制</span>'
            this.listen(copyButton, 'click', () => {
                void this.copy().then(() => {
                    copyButton.classList.add('is-copied')
                    copyButton.querySelector('span')!.textContent = '已复制'
                    window.setTimeout(() => {
                        copyButton.classList.remove('is-copied')
                        copyButton.querySelector('span')!.textContent = '复制'
                    }, 1600)
                })
            })
            actions.append(copyButton)
        }

        toolbar.append(actions)

        const pre = document.createElement('pre')
        pre.className = 'kui-code-block__pre'
        pre.tabIndex = 0
        pre.setAttribute('aria-label', `${language} 代码`)
        if (this.options.maxHeight) {
            pre.style.maxHeight = this.options.maxHeight
        }
        this.code = document.createElement('code')
        this.code.className = `language-${language}`
        pre.append(this.code)

        this.element.append(toolbar, pre)
        this.setLineNumbers(this.options.lineNumbers)
        this.paint()
    }

    private paint(): void {
        if (!this.code) {
            return
        }
        const language = normalizeLanguage(this.options.language)
        const lines = this.rawSource.split('\n')
        this.code.innerHTML = lines
            .map((line, index) => `<span class="kui-code-block__line" data-line="${index + 1}">${highlight(line, language) || ' '}</span>`)
            .join('')
    }
}

function readSource(element: HTMLElement): string {
    const holder = element.querySelector('pre, code, script[type="text/plain"]')
    return (holder?.textContent ?? element.textContent ?? '').replace(/^\n+|\s+$/g, '')
}
