import { Component } from "../../core/component"
import { delegate, type EventDisposer } from '../../core/events'
import { getInstance } from "../../core/instances"
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export interface DateTimePickerOptions extends PlainObject {
    autoclose: boolean,
    format: string,
    todayBtn: boolean
}

export type DateTimePickerProps = DateTimePickerOptions
let pickerId = 0

export class DateTimePicker extends Component<DateTimePickerOptions> {
    static readonly componentName = 'datetimepicker'
    static readonly selector = '[data-provide="datetimepicker"], [data-provide="datetimepicker-inline"], [date-kui-datetimepicker]'
    static readonly defaults: DateTimePickerOptions = { autoclose: true, format: 'yyyy-mm-dd hh:ii', todayBtn: true}

    private pickerElement: HTMLElement | null = null
    private nativeInput: HTMLInputElement | null = null
    private date: Date | null = null
    private readonly inline: boolean

    private constructor(element: HTMLElement, options: Partial<DateTimePickerOptions> = {}) {
        super(element, DateTimePicker.componentName, mergeOptions(DateTimePicker.defaults, options))
        this.inline = element.getAttribute('data-provide') === 'datetimepicker-inline'
        this.date = this.readElementDate()
        this.bindOverlayEvents()
        if (this.inline) this.show(false)
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<DateTimePickerOptions> = {}): DateTimePicker {
        const element = DateTimePicker.resolveElement(target)
        return getInstance<DateTimePicker>(element, DateTimePicker.componentName) ?? new DateTimePicker(element, {
            ...readDataOptions<DateTimePickerOptions>(element), ...options,
        })
    }

    show(focusPicker = true): void {
        if (this.isNativeHost()) {
            this.element.focus()
            try { (this.element as HTMLInputElement & { showPicker?: () => void }).showPicker?.() } catch {}
            return
        }
        if (!this.pickerElement) this.createPicker()
        if (this.pickerElement?.classList.contains('open')) return
        this.pickerElement?.classList.add('open')
        this.element.setAttribute('aria-expanded', 'true')
        if (focusPicker) this.nativeInput?.focus()
        this.emit('show', { date: this.date })
        this.emit('kui:datetimepicker:show', { date: this.date })
    }

    hide(): void {
        if (this.inline || !this.pickerElement?.classList.contains('open')) return
        if (this.pickerElement?.contains(document.activeElement) && this.element.isConnected) this.element.focus()
        this.pickerElement?.classList.remove('open')
        this.element.setAttribute('aria-expanded', 'false')
        this.emit('hide', { date: this.date })
        this.emit('kui:datetimepicker:hide', { date: this.date })
    }

    remove(): void {
        this.dispose()
    }

    destroy(): void { this.dispose() }

    override dispose(): void {
        if (this.pickerElement?.contains(document.activeElement) && this.element.isConnected) {
            this.element.focus()
        }
        this.pickerElement?.remove()
        this.pickerElement = null
        this.nativeInput = null
        this.element.removeAttribute('aria-controls')
        this.element.removeAttribute('aria-expanded')
        this.element.removeAttribute('aria-haspopup')
        super.dispose()
    }

    getDate(): Date | null { return this.date ? new Date(this.date): null}

    setDate(value: Date | string | null) : void {
        const date = value === null ? null : value instanceof Date ? new Date(value): parseLocalDate(value)
        if (date && Number.isNaN(date.getTime())) throw new TypeError('KUI DateTimePicker received an invalid date.')
        this.date = date
        this.writeElementDate()
        if (this.nativeInput) this.nativeInput.value = date ? toNativeDateTime(date) : ''
        this.emit('changeDate', { date: this.getDate() })
        this.emit('kui:datetimepicker:change', { date: this.getDate() })
    }

    update(date?: Date | string): void {this.setDate(date ?? this.readElementDate()) }
    reset(): void { this.setDate(null) }

    private createPicker(): void {
        const picker = document.createElement('div')
        picker.className = 'datetimepicker'
        picker.id = `kui-datetimepicker-${++pickerId}`
        picker.setAttribute('role', this.inline ? 'group': 'dialog')
        picker.setAttribute('aria-label', '选择日期和时间')

        const input = document.createElement('input')
        input.className = 'datetimepicker-input'
        input.type = 'datetime-local'
        input.setAttribute('aria-label', '日期和时间')
        if (this.date) input.value = toNativeDateTime(this.date)
        this.copyConstraints(input)

        const actions = document.createElement('div')
        actions.className = 'datetimepicker-actions'
        if (this.options.todayBtn) actions.append(this.createAction('今天', 'today'))
        actions.append(this.createAction('清空', 'clear'))
        picker.append(input, actions)
        this.nativeInput = input

        if (!this.inline) {
            this.element.setAttribute('aria-haspopup', 'dialog')
            this.element.setAttribute('aria-controls', picker.id)
            this.element.setAttribute('aria-expanded', 'false')
        }
        this.listen(picker, 'change', (event) => {
            if (event.target === input) {
                this.setDate(input.value ? parseLocalDate(input.value) : null)
                if (this.options.autoclose) this.hide()
            }
        })
        this.listen(picker, 'click', (event) => {
            const action = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-kui-datetime-action]')?.dataset.kuiDatetimeAction : undefined
            if (action === 'today') this.setDate(new Date())
            else if (action === 'clear') this.reset()
        })
        this.element.after(picker)
        this.pickerElement = picker
    }

    private createAction(label: string, action: string): HTMLButtonElement {
        const button = document.createElement('button')
        button.type = 'button'
        button.textContent = label
        button.dataset.kuiDatetimeAction = action
        if (action === 'today') button.dataset.kuiDatetimeToday = ''
        if (action === 'clear') button.dataset.kuiDatetimeClear = ''
        return button
    }

    private copyConstraints(input: HTMLInputElement): void {
        if (!(this.element instanceof HTMLInputElement)) return
        for (const attribute of ['min', 'max', 'step']) {
            const value = this.element.getAttribute(attribute)
            if (value !== null) input.setAttribute(attribute, value.replace(' ', 'T'))
        }
        input.disabled = this.element.disabled
        input.readOnly = this.element.readOnly
        input.lang = this.element.lang
    }

    private bindOverlayEvents(): void {
        this.listen(this.element, 'keydown', (event) => {
            if (event.key === 'ArrowDown' && event.altKey) { event.preventDefault(); this.show(true) }
        })
        this.listen(document, 'keydown', (event) => {
            if (event.key === 'Escape' && this.pickerElement?.classList.contains('open')) { event.preventDefault(); this.hide() }
        })
        this.listen(document, 'pointerdown', (event) => {
            if (event.target instanceof Node && this.pickerElement?.classList.contains('open') && !this.pickerElement.contains(event.target) && !this.element.contains(event.target)) this.hide()
        })
    }

    private isNativeHost(): boolean {
        return this.element instanceof HTMLInputElement && ['date', 'time', 'datetime-local'].includes(this.element.type)
    }

    private readElementDate(): Date | null {
        if (!(this.element instanceof HTMLInputElement) || !this.element.value) return null
        const date = parseLocalDate(this.element.value)
        return Number.isNaN(date.getTime()) ? null : date
    }

    private writeElementDate(): void {
        if (!(this.element instanceof HTMLInputElement)) return
        this.element.value = this.date ? (this.isNativeHost() ? toNativeDateTime(this.date) : formatDisplayDate(this.date, this.options.format)) : ''
        this.element.dispatchEvent(new Event('change', { bubbles: true}))
    }
}

export function bindDateTimePickerDataApi(root: Document = document): EventDisposer {
    const focus = delegate(root, 'focusin', DateTimePicker.selector, (_event, trigger) => {
        const instance = DateTimePicker.getOrCreate(trigger)
        if (!isNativeDateInput(trigger)) instance.show(false)
    })
    const click = delegate(root, 'click', DateTimePicker.selector, (event, trigger) => {
        if (!isNativeDateInput(trigger)) event.preventDefault()
        DateTimePicker.getOrCreate(trigger).show(false)
    })
    return () => {focus(); click()}
}

function isNativeDateInput(element: HTMLElement): element is HTMLInputElement {
    return element instanceof HTMLInputElement && ['date', 'time', 'datetime-local'].includes(element.type)
}

function toNativeDateTime(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDisplayDate(date: Date, format: string): string {
    const values: Record<string, string> = { yyyy: String(date.getFullYear()), mm: pad(date.getMonth() + 1), dd: pad(date.getDate()), hh:pad(date.getHours()), ii: pad(date.getMinutes())}
    return format.replace(/yyyy|mm|dd|hh|ii/g, (token) => values[token] ?? token)
}

function parseLocalDate(value: string): Date {
    const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d{1,3})?)?)?$/)
    if (!match) return new Date(Number.NaN)
    const [, year, month, day, hour = '0', minute = '0'] = match
    const date = new Date(Number(year), Number(month) -1, Number(day), Number(hour), Number(minute))
    return date.getFullYear() === Number(year) && date.getMonth() === Number(month) -1 && date.getDate() === Number(day) && date.getHours() === Number(hour) && date.getMinutes() === Number(minute) ? date : new Date(Number.NaN)
}

function pad(value: number): string { return String(value).padStart(2, '0') }
