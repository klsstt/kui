import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export interface IconPickerOptions extends PlainObject {
    /** 可选的图标 class 列表，如 'fa fa-user' */
    icons: string[]
    /** 当前选中的图标 class */
    value: string
    /** 弹层每行列数 */
    columns: number
    /** 是否显示搜索框 */
    search: boolean
    /** 未选择时的占位文案 */
    placeholder: string
    /** 选择回调 */
    onChange?: (icon: string) => void
}

/**
 * 图标选择器。
 * 触发按钮 + 可搜索的图标网格，图标清单由调用方传入（文档站传入 FA 4.7 目录）。
 */
export class IconPicker extends Component<IconPickerOptions> {
    static readonly componentName = 'icon-picker'
    static readonly selector = '[data-kui-icon-picker]'
    static readonly defaults: IconPickerOptions = {
        icons: [],
        value: '',
        columns: 8,
        search: true,
        placeholder: '选择图标',
    }

    private trigger!: HTMLButtonElement
    private popup!: HTMLElement
    private grid!: HTMLElement
    private searchInput: HTMLInputElement | null = null
    private selected = ''

    private constructor(element: HTMLElement, options: Partial<IconPickerOptions> = {}) {
        super(element, IconPicker.componentName, mergeOptions(IconPicker.defaults, options))
        this.selected = this.options.value
        this.mount()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<IconPickerOptions> = {}): IconPicker {
        const element = IconPicker.resolveElement(target)
        return (
            getInstance<IconPicker>(element, IconPicker.componentName) ??
            new IconPicker(element, { ...readDataOptions<IconPickerOptions>(element), ...options })
        )
    }

    getValue(): string {
        return this.selected
    }

    setValue(icon: string): void {
        this.selected = icon
        this.options.value = icon
        this.syncTrigger()
        this.syncGrid()
    }

    open(): void {
        this.popup.hidden = false
        this.trigger.setAttribute('aria-expanded', 'true')
        this.element.classList.add('is-open')
        this.searchInput?.focus()
    }

    close(): void {
        this.popup.hidden = true
        this.trigger.setAttribute('aria-expanded', 'false')
        this.element.classList.remove('is-open')
    }

    private mount(): void {
        this.element.classList.add('kui-icon-picker')
        this.element.replaceChildren()
        this.element.style.setProperty('--kui-icon-picker-columns', String(Math.max(4, this.options.columns)))

        this.trigger = document.createElement('button')
        this.trigger.type = 'button'
        this.trigger.className = 'kui-icon-picker__trigger'
        this.trigger.setAttribute('aria-haspopup', 'dialog')
        this.trigger.setAttribute('aria-expanded', 'false')
        this.element.append(this.trigger)

        this.popup = document.createElement('div')
        this.popup.className = 'kui-icon-picker__popup'
        this.popup.setAttribute('role', 'dialog')
        this.popup.setAttribute('aria-label', '选择图标')
        this.popup.hidden = true

        if (this.options.search) {
            const searchWrap = document.createElement('div')
            searchWrap.className = 'kui-icon-picker__search'
            const icon = document.createElement('i')
            icon.className = 'fa fa-search'
            icon.setAttribute('aria-hidden', 'true')
            this.searchInput = document.createElement('input')
            this.searchInput.type = 'search'
            this.searchInput.className = 'form-control form-control-sm'
            this.searchInput.placeholder = '搜索图标名称'
            this.searchInput.setAttribute('aria-label', '搜索图标')
            searchWrap.append(icon, this.searchInput)
            this.popup.append(searchWrap)
            this.listen(this.searchInput, 'input', () => this.renderGrid(this.searchInput?.value ?? ''))
        }

        this.grid = document.createElement('div')
        this.grid.className = 'kui-icon-picker__grid'
        this.grid.setAttribute('role', 'listbox')
        this.grid.setAttribute('aria-label', '图标列表')
        this.popup.append(this.grid)
        this.element.append(this.popup)

        this.listen(this.trigger, 'click', () => {
            if (this.popup.hidden) this.open()
            else this.close()
        })
        this.listen(this.element, 'keydown', (event) => {
            if (event.key === 'Escape' && !this.popup.hidden) {
                event.preventDefault()
                this.close()
                this.trigger.focus()
            }
        })
        this.listen(document, 'pointerdown', (event) => {
            if (!this.popup.hidden && event.target instanceof Node && !this.element.contains(event.target)) {
                this.close()
            }
        })

        this.renderGrid('')
        this.syncTrigger()
    }

    private syncTrigger(): void {
        const icon = this.selected || 'fa fa-smile-o'
        const label = this.selected ? this.selected.replace(/^fa\s+/, '') : this.options.placeholder
        this.trigger.innerHTML = `<i class="${icon}" aria-hidden="true"></i><span>${label}</span><i class="fa fa-angle-down" aria-hidden="true"></i>`
        this.trigger.setAttribute('aria-label', `选择图标，当前 ${label}`)
    }

    private syncGrid(): void {
        this.grid.querySelectorAll<HTMLElement>('[data-icon-value]').forEach((button) => {
            button.classList.toggle('is-active', button.dataset.iconValue === this.selected)
            button.setAttribute('aria-selected', String(button.dataset.iconValue === this.selected))
        })
    }

    private renderGrid(keyword: string): void {
        const query = keyword.trim().toLowerCase()
        const icons = this.options.icons.filter((icon) => !query || icon.toLowerCase().includes(query))
        this.grid.replaceChildren()
        icons.forEach((icon) => {
            const button = document.createElement('button')
            button.type = 'button'
            button.className = 'kui-icon-picker__option'
            button.dataset.iconValue = icon
            button.setAttribute('role', 'option')
            button.setAttribute('aria-label', icon.replace(/^fa\s+/, ''))
            button.setAttribute('title', icon.replace(/^fa\s+/, ''))
            button.innerHTML = `<i class="${icon}" aria-hidden="true"></i>`
            this.listen(button, 'click', () => {
                this.setValue(icon)
                this.options.onChange?.(icon)
                this.emit('kui:iconpicker:change', { icon })
                this.close()
                this.trigger.focus()
            })
            this.grid.append(button)
        })
        if (!icons.length) {
            const empty = document.createElement('p')
            empty.className = 'kui-icon-picker__empty'
            empty.textContent = '没有匹配的图标'
            this.grid.append(empty)
        }
        this.syncGrid()
    }
}
