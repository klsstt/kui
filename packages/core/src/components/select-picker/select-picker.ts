import { Component } from "../../core/component";
import { getRovingFocusTarget } from "../../core/dom/focus";
import { getInstance } from "../../core/instances";
import { mergeOptions, readDataOptions, type PlainObject } from "../../core/options";

export interface SelectPickerOptions extends PlainObject {
    noneSelectedText: string
    countSelectedText: string
    style: string
}

export type SelectPickerProps = SelectPickerOptions

let selectPickerId = 0

export class SelectPicker extends Component<SelectPickerOptions> {
    static readonly componentName = 'selectpicker'
    static readonly selector = 'select[data-plugin="selectpicker"], select[data-plugin="selectpicker-outline"], select[data-kui-selectpicker]'
    static readonly defaults: SelectPickerOptions = {
        noneSelectedText: '没有选中任何选项',
        countSelectedText: '已选中{1}项中的{0}项',
        style: 'btn-select',
    }

    private readonly select: HTMLSelectElement
    private button: HTMLButtonElement
    private menu: HTMLUListElement
    private activeOptionIndex = -1
    private readonly accessibilityId = ++selectPickerId

    private constructor(element: HTMLSelectElement, options: Partial<SelectPickerOptions> = {}) {
        super(element, SelectPicker.componentName, mergeOptions(SelectPicker.defaults, options))
        this.select = element
        this.button = this.createButton()
        this.menu = this.createMenu()
        this.listen(this.select, 'change', () => this.render())
        this.listen(this.button, 'click', (event) => this.handleButtonClick(event))
        this.listen(this.button, 'keydown', (event) => this.handleButtonKeydown(event))
        this.listen(this.menu, 'click', (event) => this.handleMenuClick(event))
        this.listen(document, 'click', (event) => {
            if (!(event.target instanceof Node)) {
                return
            }
            if(!this.button.contains(event.target) && !this.menu.contains(event.target)) {
                this.hideMenu()
            }
        })
        this.render()
        this.hideMenu()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<SelectPickerOptions> = {}): SelectPicker {
        const element = SelectPicker.resolveElement(target)
        if (!(element instanceof HTMLSelectElement)) {
            throw new Error('KUI select picker requires a select element.')
        }
        return (
            getInstance<SelectPicker>(element, SelectPicker.componentName) ?? new SelectPicker(element, {...readDataOptions<SelectPickerOptions>(element), ...options})
        )
    }

    val(value?: string | string[]): string | string[] | null | void {
        if (typeof value === 'undefined') {
            return this.select.multiple ? Array.from(this.select.selectedOptions).map((option) => option.value) : this.select.value
        }
        const values = Array.isArray(value) ? value : [value]
        Array.from(this.select.options).forEach((option) => {
            option.selected = values.includes(option.value)
        })
        this.triggerChange()
    }

    refresh(): void {
        this.render()
    }

    render(): void {
        const selected = Array.from(this.select.selectedOptions)
        const isPlaceholder = this.isPlaceholderSelection(selected)
        const hasSelection = selected.length > 0 && !isPlaceholder
        this.button.replaceChildren(...this.createButtonContent(selected, isPlaceholder))
        this.button.disabled = this.select.disabled
        this.button.className = `btn dropdown-toggle ${this.options.style}`.trim()
        this.button.dataset.selectpickerButton = 'true'
        this.button.classList.toggle('is-placeholder', isPlaceholder)
        this.button.classList.toggle('has-selection', hasSelection)
        this.button.classList.toggle('has-multiple-selection', this.select.multiple && hasSelection)
        this.renderMenu()
        this.emit('changed.bs.select', { value: this.val() })
        this.emit('kui:selectpicker:change', { value: this.val() })
    }

    selectAll(): void {
        Array.from(this.select.options).forEach((option) => {
            option.selected = true
        })
        this.triggerChange()
    }

    deselectAll(): void {
        Array.from(this.select.options).forEach((option) => {
            option.selected = false
        })
        this.triggerChange()
    }

    destroy(): void {
        this.button.remove()
        this.menu.remove()
        this.select.classList.remove('bs-select-hidden')
        this.dispose()
    }

    private createButton(): HTMLButtonElement {
        const existing = this.select.nextElementSibling
        if (existing instanceof HTMLButtonElement && existing.classList.contains('dropdown-toggle')) {
            return existing
        }
        const button = document.createElement('button')
        button.type = 'button'
        button.className = `btn dropdown-toggle ${this.options.style}`.trim()
        button.dataset.selectpickerButton = 'true'
        button.setAttribute('role', 'combobox')
        button.setAttribute('aria-haspopup', 'listbox')
        button.setAttribute('aria-expanded', 'false')
        this.applyAccessibleName(button)
        this.select.classList.add('bs-select-hidden')
        this.select.after(button)
        return button
    }

    private createButtonContent(selected: HTMLOptionElement[], isPlaceholder: boolean): HTMLElement[] {
        if (this.select.multiple && selected.length > 0) {
            return selected.map((option) => this.createSelectionChip(option))
        }
        const hasSelection = selected.length > 0 && !isPlaceholder
        return [this.createButtonLabel(this.getLabel(selected), hasSelection)]
    }

    private createButtonLabel(label: string, hasSelection: boolean): HTMLSpanElement {
        const labelElement = document.createElement('span')
        labelElement.className = hasSelection ? 'selectpicker-selection' : 'selectpicker-label'
        labelElement.textContent = label
        return labelElement
    }

    private createSelectionChip(option: HTMLOptionElement): HTMLSpanElement {
        const label = option.textContent?.trim() || option.value
        const chip = document.createElement('span')
        chip.className = 'selectpicker-selection selectpicker-selection--removable'

        const text = document.createElement('span')
        text.className = 'selectpicker-selection-text'
        text.textContent = label

        const remove = document.createElement('span')
        remove.className = 'selectpicker-selection-remove'
        remove.dataset.selectpickerRemove = String(option.index)
        remove.setAttribute('aria-hidden', 'true')
        remove.title = `取消${label}`
        remove.setAttribute('aria-label', `取消${label}`)
        remove.textContent = 'x'

        chip.append(text, remove)
        return chip
    }

    private createMenu(): HTMLUListElement {
        const existing = this.button.nextElementSibling
        if (existing instanceof HTMLUListElement && existing.classList.contains('selectpicker-menu')) {
            this.configureAccessibility(existing)
            return existing
        }
        const menu = document.createElement('ul')
        menu.className = 'dropdown-menu selectpicker-menu'
        menu.id = `kui-selectpicker-${this.accessibilityId}-listbox`
        menu.role = 'listbox'
        menu.hidden = true
        this.button.after(menu)
        this.configureAccessibility(menu)
        return menu
    }

    private renderMenu(): void {
        this.menu.replaceChildren(...Array.from(this.select.options, (option, index) => {
            const item = document.createElement('li')
            const button = document.createElement('button')
            button.type = 'button'
            button.id = `${this.menu.id}-option-${index}`
            button.dataset.selectpickerOption = String(index)
            button.role = 'option'
            button.tabIndex = -1
            button.textContent = option.textContent?.trim() || option.value
            button.disabled = option.disabled
            button.classList.toggle('active', option.selected)
            button.setAttribute('aria-selected', String(option.selected))
            item.append(button)
            return item
        }))
        this.restoreActiveOption()
    }

    private configureAccessibility(menu: HTMLUListElement): void {
        menu.id ||= `kui-selectpicker-${this.accessibilityId}-listbox`
        menu.setAttribute('role', 'listbox')
        if (this.select.multiple) {
            menu.setAttribute('aria-multiselectable', 'true')
        } else {
            menu.removeAttribute('aria-multiselectable')
        }
        this.button.setAttribute('role', 'combobox')
        this.button.setAttribute('aria-haspopup', 'listbox')
        this.button.setAttribute('aria-controls', menu.id)
        this.button.setAttribute('aria-expanded', String(!menu.hidden))
        this.applyAccessibleName(this.button)
    }

    private applyAccessibleName(button: HTMLButtonElement): void {
        const ariaLabel = this.select.getAttribute('aria-label')
        const ariaLabelledBy = this.select.getAttribute('aria-labelledby')
        if (ariaLabel) {
            button.setAttribute('aria-label', ariaLabel)
            return
        }
        if (ariaLabelledBy) {
            button.setAttribute('aria-labelledby', ariaLabelledBy)
            return
        }
        if(this.select.id){
            const label = Array.from(document.querySelectorAll<HTMLLabelElement>('label[for]'))
            .find((candidate) => candidate.htmlFor === this.select.id)
            if (label) {
                label.id ||= `kui-selectpicker-${this.accessibilityId}-label`
                button.setAttribute('aria-labelledby', label.id)
            }
        }
    }

    private restoreActiveOption(): void {
        const optionButtons = this.getOptionButtons()
        const current = optionButtons.find((button) => Number(button.dataset.selectpickerOption) === this.activeOptionIndex && !button.disabled)
        const selected = optionButtons.find((button) => button.getAttribute('aria-selected') === 'true' && !button.disabled)
        const fallback = current ?? selected ?? optionButtons.find((button) => !button.disabled) ?? null
        this.setActiveOption(fallback ? Number(fallback.dataset.selectpickerOption) : -1)
        if (this.menu.hidden) {
            this.button.removeAttribute('aria-activedescendant')
        }
    }

    private handleButtonKeydown(event: KeyboardEvent): void {
        if (this.select.disabled) {
            return
        }

        if((event.key === 'Backspace' || event.key === 'Delete') && this.menu.hidden && this.select.multiple) {
            const lastSelected = Array.from(this.select.selectedOptions).filter((option) => !option.disabled).at(-1)
            if(lastSelected) {
                event.preventDefault()
                this.removeSelectedOption(lastSelected.index)
            }
            return
        }

        if (event.key === 'Escape') {
            if(!this.menu.hidden) {
                event.preventDefault()
                this.hideMenu()
            }
            return
        }
        if(event.key === 'Tab'){
            this.hideMenu()
            return
        }

        if(event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            if (this.menu.hidden) {
                this.showMenu(event.key === 'ArrowUp')
            } else {
                this.moveActiveOption(event)
            }
            return
        }

        if(!this.menu.hidden && (event.key === 'Home' || event.key === 'End')) {
            event.preventDefault()
            this.moveActiveOption(event)
            return
        }

        if (event.key === 'Enter' || event.key === ' '){
            event.preventDefault()
            if (this.menu.hidden) {
                this.showMenu(false)
            } else {
                this.selectActiveOption()
            }
        }
    }

    private moveActiveOption(event: KeyboardEvent): void {
        const buttons = this.getOptionButtons()
        const current = buttons.find((button) => Number(button.dataset.selectpickerOption) === this.activeOptionIndex) ?? buttons.find((button) => !button.disabled)
        if(!current) {
            return
        }
        const target = getRovingFocusTarget(event, buttons, current, { orientation: 'vertical', loop: true })
        if( target instanceof HTMLButtonElement) {
            this.setActiveOption(Number(target.dataset.selectpickerOption))
        }
    }

    private selectActiveOption(): void {
        const option = this.select.options[this.activeOptionIndex]
        if (!option || option.disabled) {
            return
        }
        option.selected = this.select.multiple ? !option.selected : true
        if (!this.select.multiple) {
            this.hideMenu()
        }
        this.triggerChange()
    }

    private getOptionButtons(): HTMLButtonElement[] {
        return Array.from(this.menu.querySelectorAll<HTMLButtonElement>('[data-selectpicker-option]'))
    }

    private setActiveOption(index: number): void {
        this.activeOptionIndex = index
        const active = this.getOptionButtons().find((button) => Number(button.dataset.selectpickerOption) === index && !button.disabled) ?? null
        this.getOptionButtons().forEach((button) => button.classList.toggle('is-active', button === active))
        if (active) {
            this.button.setAttribute('aria-activedescendant', active.id)
            active.scrollIntoView({ block: 'nearest' })
        } else {
            this.button.removeAttribute('aria-activedescendant')
        }
    }

    private handleMenuClick(event: Event): void {
        const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-selectpicker-option]') : null
        if (!target || target.disabled) {
            return
        }
        const option = this.select.options[Number(target.dataset.selectpickerOption)]
        if(!option) {
            return
        }
        this.setActiveOption(option.index)
        if(this.select.multiple) {
            option.selected = !option.selected
        } else {
            option.selected = true
            this.hideMenu()
        }
        this.triggerChange()
    }

    private handleButtonClick(event: MouseEvent): void {
        const removeTarget = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-selectpicker-remove]') : null
        if(removeTarget && this.button.contains(removeTarget)) {
            event.preventDefault()
            event.stopPropagation()
            this.removeSelectedOption(Number(removeTarget.dataset.selectpickerRemove))
            return
        }
        event.preventDefault()
        this.toggleMenu()
    }

    private removeSelectedOption(index: number): void {
        const option = this.select.options[index]
        if(!option || option.disabled) {
            return
        }
        option.selected = false
        this.triggerChange()
    }

    private toggleMenu(): void {
        if(this.select.disabled){
            return
        }
        if(this.menu.hidden) {
            this.showMenu(false)
        } else {
            this.hideMenu()
        }
    }

    private showMenu(preferLast: boolean): void {
        this.menu.hidden = false
        this.menu.classList.add('show')
        this.button.setAttribute('aria-expanded', 'true')
        const available = this.getOptionButtons().filter((button) => !button.disabled)
        const selected = available.find((button) => button.getAttribute('aria-selected') === 'true')
        const target = preferLast ? available.at(-1) : selected ?? available[0]
        this.setActiveOption(target ? Number(target.dataset.selectpickerOption) : -1)
    }

    private hideMenu(): void {
        this.menu.hidden = true
        this.menu.classList.remove('show')
        this.button.setAttribute('aria-expanded', 'false')
        this.button.removeAttribute('aria-activedescendant')
    }

    private getLabel(selected: HTMLOptionElement[]): string {
        if (selected.length === 0) {
            return this.options.noneSelectedText
        }
        if (this.select.multiple && selected.length > 1) {
            return this.options.countSelectedText.replace('{0}', String(selected.length)).replace('{1}', String(this.select.options.length))
        }
        return selected[0]?.textContent?.trim() || selected[0]?.value || this.options.noneSelectedText
    }

    private isPlaceholderSelection(selected: HTMLOptionElement[]): boolean {
        return selected.length === 1 && selected[0].disabled && selected[0].value === ''
    }

    private triggerChange(): void {
        this.select.dispatchEvent(new Event('change', { bubbles: true }))
    }
}
