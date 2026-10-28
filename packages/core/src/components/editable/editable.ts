import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export type EditableType = 'text' | 'number' | 'money' | 'date' | 'email' | 'tel' | 'select'

export interface EditableOption {
    /** 选项值 */
    value: string
    /** 选项文案 */
    label: string
}

export interface EditableOptions extends PlainObject {
    /** 编辑类型 */
    type: EditableType
    /** 当前值 */
    value: string
    /** select 的候选项 */
    options: EditableOption[]
    /** 空值占位 */
    placeholder: string
    /** 前缀（如 ¥） */
    prefix: string
    /** 后缀（如 元 / %） */
    suffix: string
    /** number / money 步进 */
    step: number
    /** 最小值 */
    min?: number
    /** 最大值 */
    max?: number
    /** 只读 */
    disabled: boolean
    /** 提交回调 */
    onCommit?: (value: string) => void
}

/**
 * 行内可编辑。
 * 金额、日期、数字、单选、邮箱、手机号等固定格式输入统一收敛到一个交互模型：
 * 点击进编辑、回车提交、Esc 还原，提交后回到稳定尺寸的文本态。
 */
export class Editable extends Component<EditableOptions> {
    static readonly componentName = 'editable'
    static readonly selector = '[data-kui-editable]'
    static readonly defaults: EditableOptions = {
        type: 'text',
        value: '',
        options: [],
        placeholder: '点击输入',
        prefix: '',
        suffix: '',
        step: 1,
        disabled: false,
    }

    private editing = false

    private constructor(element: HTMLElement, options: Partial<EditableOptions> = {}) {
        super(element, Editable.componentName, mergeOptions(Editable.defaults, normalizeEditableOptions(options)))
        if (!this.options.value) {
            this.options.value = element.textContent?.trim() ?? ''
        }
        element.classList.add('kui-editable')
        element.tabIndex = this.options.disabled ? -1 : 0
        element.setAttribute('role', 'button')

        this.listen(element, 'click', () => this.start())
        this.listen(element, 'keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                this.start()
            }
        })
        this.render()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<EditableOptions> = {}): Editable {
        const element = Editable.resolveElement(target)
        return (
            getInstance<Editable>(element, Editable.componentName) ??
            new Editable(element, { ...readDataOptions<EditableOptions>(element), ...options })
        )
    }

    /** 当前值 */
    get value(): string {
        return this.options.value
    }

    setValue(value: string): void {
        this.options.value = value
        this.render()
    }

    /** 进入编辑态 */
    start(): void {
        if (this.editing || this.options.disabled) {
            return
        }
        this.editing = true
        this.element.classList.add('is-editing')

        const editor = this.createEditor()
        this.element.replaceChildren(editor)
        const focusable = editor as HTMLInputElement | HTMLSelectElement
        window.requestAnimationFrame(() => focusable.focus())
        if (focusable instanceof HTMLInputElement) {
            focusable.select()
        }

        const commit = (): void => this.commit(focusable.value)
        const cancel = (): void => {
            this.editing = false
            this.element.classList.remove('is-editing')
            this.render()
        }

        editor.addEventListener('blur', commit)
        editor.addEventListener('keydown', (event) => {
            const { key } = event as KeyboardEvent
            if (key === 'Enter') {
                event.preventDefault()
                editor.blur()
            } else if (key === 'Escape') {
                event.preventDefault()
                editor.removeEventListener('blur', commit)
                cancel()
            }
        })
        if (editor instanceof HTMLSelectElement) {
            editor.addEventListener('change', () => editor.blur())
        }
    }

    private commit(value: string): void {
        if (!this.editing) {
            return
        }
        this.editing = false
        this.element.classList.remove('is-editing')
        if (value !== this.options.value) {
            this.options.value = value
            this.options.onCommit?.(value)
            this.emit('kui:editable:commit', { value })
        }
        this.render()
    }

    private createEditor(): HTMLInputElement | HTMLSelectElement {
        const { type, value, options, placeholder, step, min, max } = this.options

        if (type === 'select') {
            const select = document.createElement('select')
            select.className = 'kui-editable__input'
            options.forEach((option) => {
                const node = document.createElement('option')
                node.value = option.value
                node.textContent = option.label
                node.selected = option.value === value
                select.append(node)
            })
            return select
        }

        const input = document.createElement('input')
        input.className = 'kui-editable__input'
        input.value = value
        input.placeholder = placeholder
        if (type === 'date') {
            input.type = 'date'
        } else if (type === 'number' || type === 'money') {
            input.type = 'number'
            input.step = String(step)
            if (typeof min === 'number') input.min = String(min)
            if (typeof max === 'number') input.max = String(max)
        } else if (type === 'email') {
            input.type = 'email'
        } else if (type === 'tel') {
            input.type = 'tel'
        } else {
            input.type = 'text'
        }
        return input
    }

    private render(): void {
        if (this.editing) {
            return
        }
        const { type, value, placeholder, prefix, suffix } = this.options
        this.element.replaceChildren()

        if (!value) {
            const empty = document.createElement('span')
            empty.className = 'kui-editable__placeholder'
            empty.textContent = placeholder
            this.element.append(empty)
            return
        }

        if (type === 'money') {
            const symbol = document.createElement('span')
            symbol.className = 'kui-editable__affix'
            symbol.textContent = prefix || '¥'
            this.element.append(symbol)
        } else if (prefix) {
            const symbol = document.createElement('span')
            symbol.className = 'kui-editable__affix'
            symbol.textContent = prefix
            this.element.append(symbol)
        }

        const text = document.createElement('span')
        text.className = 'kui-editable__value'
        text.textContent = type === 'money' ? formatMoney(value) : value
        this.element.append(text)

        if (suffix) {
            const symbol = document.createElement('span')
            symbol.className = 'kui-editable__affix'
            symbol.textContent = suffix
            this.element.append(symbol)
        }

        const pen = document.createElement('i')
        pen.className = 'fa fa-pencil kui-editable__pen'
        pen.setAttribute('aria-hidden', 'true')
        this.element.append(pen)
    }
}

function formatMoney(value: string): string {
    const amount = Number(value)
    if (Number.isNaN(amount)) {
        return value
    }
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function normalizeEditableOptions(options: Partial<EditableOptions>): Partial<EditableOptions> {
    const items = options.options as unknown
    return typeof items === 'string' ? { ...options, options: JSON.parse(items) as EditableOption[] } : options
}
