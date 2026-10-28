import { Component } from "../../core/component"
import { delegate, type EventDisposer } from '../../core/events'
import { getInstance } from "../../core/instances"
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

/**
 * 选择粒度：
 * - datetime / date / month / time 对应同名原生输入类型；
 * - week 是星期选择（周一…周日），不再使用原生 week 的 yyyy-Www；
 * - year 没有原生控件，浮层里用 select 列出近 30 年及未来 5 年。
 * 不同模式只改变「读写什么」，getDate() 始终返回 Date。
 */
export type DateTimePickerMode = 'datetime' | 'date' | 'month' | 'week' | 'time' | 'year'

export interface DateTimePickerOptions extends PlainObject {
    autoclose: boolean,
    format: string,
    todayBtn: boolean,
    mode: DateTimePickerMode
}

export type DateTimePickerProps = DateTimePickerOptions
let pickerId = 0

const MODE_FORMATS: Record<DateTimePickerMode, string> = {
    datetime: 'yyyy-mm-dd hh:ii',
    date: 'yyyy-mm-dd',
    month: 'yyyy-mm',
    week: '周w',
    time: 'hh:ii:ss',
    year: 'yyyy',
}

const MODE_LABELS: Record<DateTimePickerMode, string> = {
    datetime: '日期和时间',
    date: '日期',
    month: '年月',
    week: '星期',
    time: '时间',
    year: '年份',
}

/** 星期选择的展示名，周一为第 1 项 */
const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

type NativePickerMode = Exclude<DateTimePickerMode, 'year' | 'week'>

const NATIVE_TYPES: Record<NativePickerMode, string> = {
    datetime: 'datetime-local',
    date: 'date',
    month: 'month',
    time: 'time',
}

const NATIVE_INPUT_TYPES = Object.values(NATIVE_TYPES)

export class DateTimePicker extends Component<DateTimePickerOptions> {
    static readonly componentName = 'datetimepicker'
    static readonly selector = '[data-provide="datetimepicker"], [data-provide="datetimepicker-inline"], [date-kui-datetimepicker]'
    static readonly defaults: DateTimePickerOptions = { autoclose: true, format: '', todayBtn: true, mode: 'datetime' }

    private pickerElement: HTMLElement | null = null
    private previousDate: Date | null = null
    private pickerControl: HTMLInputElement | HTMLSelectElement | null = null
    private date: Date | null = null
    private readonly inline: boolean
    private readonly mode: DateTimePickerMode

    private constructor(element: HTMLElement, options: Partial<DateTimePickerOptions> = {}) {
        super(element, DateTimePicker.componentName, mergeOptions(DateTimePicker.defaults, options))
        this.mode = resolveMode(element, this.options.mode)
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
        this.previousDate = this.date ? new Date(this.date) : null
        this.syncPickerControl()
        this.syncConstraints()
        this.pickerElement?.classList.add('open')
        this.element.setAttribute('aria-expanded', 'true')
        if (focusPicker) this.pickerControl?.focus()
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
        this.pickerControl = null
        this.element.removeAttribute('aria-controls')
        this.element.removeAttribute('aria-expanded')
        this.element.removeAttribute('aria-haspopup')
        super.dispose()
    }

    getDate(): Date | null { return this.date ? new Date(this.date): null}

    setDate(value: Date | string | null) : void {
        const date = value === null ? null : value instanceof Date ? new Date(value): parseModeValue(value, this.mode)
        if (date && Number.isNaN(date.getTime())) throw new TypeError('KUI DateTimePicker received an invalid date.')
        this.date = date ? normalizeForMode(date, this.mode) : null
        this.writeElementDate()
        this.syncPickerControl()
        this.emit('changeDate', { date: this.getDate() })
        this.emit('kui:datetimepicker:change', { date: this.getDate() })
    }

    update(date?: Date | string): void {this.setDate(date ?? this.readElementDate()) }
    reset(): void { this.setDate(null) }

    private get displayFormat(): string {
        return this.options.format || MODE_FORMATS[this.mode]
    }

    private createPicker(): void {
        const picker = document.createElement('div')
        picker.className = 'datetimepicker'
        picker.dataset.mode = this.mode
        picker.id = `kui-datetimepicker-${++pickerId}`
        picker.setAttribute('role', this.inline ? 'group': 'dialog')
        picker.setAttribute('aria-label', `选择${MODE_LABELS[this.mode]}`)

        const control = this.createPickerControl()
        this.pickerControl = control

        const actions = document.createElement('div')
        actions.className = 'datetimepicker-actions'
        if (this.options.todayBtn) actions.append(this.createAction(this.mode === 'time' ? '现在' : '今天', 'today'))
        actions.append(this.createAction('清空', 'clear'))
        actions.append(this.createAction('取消', 'cancel'))
        const confirm = this.createAction('确定', 'confirm')
        confirm.classList.add('is-primary')
        actions.append(confirm)
        picker.append(control, actions)

        if (!this.inline) {
            this.element.setAttribute('aria-haspopup', 'dialog')
            this.element.setAttribute('aria-controls', picker.id)
            this.element.setAttribute('aria-expanded', 'false')
        }
        this.listen(picker, 'change', (event) => {
            if (event.target !== control) return
            this.setDate(control.value ? parseModeValue(control.value, this.mode) : null)
            if (this.options.autoclose) this.hide()
        })
        this.listen(picker, 'click', (event) => {
            const action = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-kui-datetime-action]')?.dataset.kuiDatetimeAction : undefined
            if (action === 'today') this.setDate(new Date())
            else if (action === 'clear') this.reset()
            else if (action === 'cancel') {
                this.setDate(this.previousDate)
                this.hide()
            } else if (action === 'confirm') {
                if (control.value) this.setDate(parseModeValue(control.value, this.mode))
                this.hide()
            }
        })
        this.element.after(picker)
        this.pickerElement = picker
    }

    private createPickerControl(): HTMLInputElement | HTMLSelectElement {
        if (this.mode === 'year') return this.createYearSelect()
        if (this.mode === 'week') return this.createWeekSelect()
        return this.createNativeControl()
    }

    private createWeekSelect(): HTMLSelectElement {
        const select = document.createElement('select')
        select.className = 'form-control datetimepicker-input'
        select.dataset.kuiDatetimeWeek = ''
        select.setAttribute('aria-label', '选择星期')
        const placeholder = new Option('请选择星期', '')
        placeholder.disabled = true
        select.replaceChildren(
            placeholder,
            ...WEEKDAY_LABELS.map((label, index) => new Option(label, String(index + 1))),
        )
        select.value = this.date ? String(weekdayNumber(this.date)) : ''
        return select
    }

    private createNativeControl(): HTMLInputElement {
        const input = document.createElement('input')
        input.className = 'datetimepicker-input'
        input.type = nativeTypeForMode(this.mode)
        input.setAttribute('aria-label', MODE_LABELS[this.mode])
        if (this.date) input.value = toNativeValue(this.date, this.mode)
        this.syncConstraints(input)
        return input
    }

    private createYearSelect(): HTMLSelectElement {
        const select = document.createElement('select')
        select.className = 'form-control datetimepicker-input'
        select.dataset.kuiDatetimeYear = ''
        select.setAttribute('aria-label', '选择年份')
        this.fillYearOptions(select)
        select.value = this.date ? String(this.date.getFullYear()) : ''
        return select
    }

    private fillYearOptions(select: HTMLSelectElement): void {
        const currentYear = new Date().getFullYear()
        const years = new Set<number>()
        for (let year = currentYear - 29; year <= currentYear + 5; year += 1) years.add(year)
        if (this.date) years.add(this.date.getFullYear())
        const options = Array.from(years)
            .sort((left, right) => right - left)
            .map((year) => new Option(`${year} 年`, String(year)))
        select.replaceChildren(new Option('请选择年份', ''), ...options)
    }

    private syncPickerControl(): void {
        const control = this.pickerControl
        if (!control) return
        if (control instanceof HTMLSelectElement) {
            if (control.dataset.kuiDatetimeWeek !== undefined) {
                control.value = this.date ? String(weekdayNumber(this.date)) : ''
                return
            }
            if (!this.date) {
                control.value = ''
                return
            }
            const year = String(this.date.getFullYear())
            if (!Array.from(control.options).some((option) => option.value === year)) this.fillYearOptions(control)
            control.value = year
            return
        }
        control.value = this.date ? toNativeValue(this.date, this.mode) : ''
    }

    /** min / max / step 可能被范围示例动态改写，每次打开浮层都重新同步一次 */
    private syncConstraints(input?: HTMLInputElement): void {
        const target = input ?? (this.pickerControl instanceof HTMLInputElement ? this.pickerControl : null)
        if (!target || !(this.element instanceof HTMLInputElement)) return
        for (const attribute of ['min', 'max', 'step']) {
            const value = this.element.getAttribute(attribute)
            if (value === null) target.removeAttribute(attribute)
            else target.setAttribute(attribute, value.replace(' ', 'T'))
        }
        if (this.mode === 'time' && !this.element.hasAttribute('step')) target.step = '1'
        target.disabled = this.element.disabled
        target.readOnly = this.element.readOnly
        target.lang = this.element.lang
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
        return this.element instanceof HTMLInputElement
            && NATIVE_INPUT_TYPES.includes(this.element.type)
            && this.element.type === nativeTypeForMode(this.mode)
    }

    private readElementDate(): Date | null {
        if (!(this.element instanceof HTMLInputElement) || !this.element.value) return null
        const date = parseModeValue(this.element.value, this.mode)
        return Number.isNaN(date.getTime()) ? null : normalizeForMode(date, this.mode)
    }

    private writeElementDate(): void {
        if (!(this.element instanceof HTMLInputElement)) return
        if (!this.date) {
            this.element.value = ''
        } else if (this.isNativeHost()) {
            this.element.value = toNativeValue(this.date, this.mode)
        } else if (this.mode === 'week' && this.element.type === 'week') {
            // 原生 week 宿主没有「星期」概念：外部沿用 ISO 周字符串，浮层仍是星期选择
            const week = isoWeekInfo(this.date)
            this.element.value = `${week.year}-W${pad(week.week)}`
        } else {
            this.element.value = formatDisplayDate(this.date, this.displayFormat, this.mode)
        }
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
    return element instanceof HTMLInputElement && NATIVE_INPUT_TYPES.includes(element.type)
}

function resolveMode(element: HTMLElement, mode: unknown): DateTimePickerMode {
    if (isMode(mode) && mode !== 'datetime') return mode
    if (element instanceof HTMLInputElement && isMode(element.type)) return element.type
    return isMode(mode) ? mode : 'datetime'
}

function isMode(value: unknown): value is DateTimePickerMode {
    return value === 'datetime' || value === 'date' || value === 'month'
        || value === 'week' || value === 'time' || value === 'year'
}

function nativeTypeForMode(mode: DateTimePickerMode): string {
    return mode === 'year' || mode === 'week' ? 'text' : NATIVE_TYPES[mode]
}

function toNativeValue(date: Date, mode: DateTimePickerMode): string {
    if (mode === 'date') return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    if (mode === 'month') return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
    if (mode === 'week') return WEEKDAY_LABELS[weekdayNumber(date) - 1] ?? ''
    if (mode === 'time') return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    if (mode === 'year') return String(date.getFullYear())
    return toNativeDateTime(date)
}

function formatDisplayDate(date: Date, format: string, mode: DateTimePickerMode): string {
    // week 模式写回星期名（周一…周日），不再拼 ISO 周序号
    if (mode === 'week') return WEEKDAY_LABELS[weekdayNumber(date) - 1] ?? ''
    const week = isoWeekInfo(date)
    const values: Record<string, string> = {
        yyyy: String(date.getFullYear()),
        mm: pad(date.getMonth() + 1),
        dd: pad(date.getDate()),
        hh: pad(date.getHours()),
        ii: pad(date.getMinutes()),
        ss: pad(date.getSeconds()),
        ww: pad(week.week),
    }
    return format.replace(/yyyy|mm|dd|hh|ii|ss|ww/g, (token) => values[token] ?? token)
}

function parseModeValue(value: string, mode: DateTimePickerMode): Date {
    const text = value.trim()
    const parsedDateTime = parseLocalDate(text)
    const hasDateTime = !Number.isNaN(parsedDateTime.getTime())

    if (mode === 'datetime') return hasDateTime ? parsedDateTime : invalidDate()

    if (mode === 'date') {
        return hasDateTime ? new Date(parsedDateTime.getFullYear(), parsedDateTime.getMonth(), parsedDateTime.getDate()) : invalidDate()
    }

    if (mode === 'month') {
        const match = text.match(/^(\d{4})-(\d{2})$/)
        if (match) {
            const month = Number(match[2])
            return month >= 1 && month <= 12 ? new Date(Number(match[1]), month - 1, 1) : invalidDate()
        }
        return hasDateTime ? new Date(parsedDateTime.getFullYear(), parsedDateTime.getMonth(), 1) : invalidDate()
    }

    if (mode === 'week') {
        const index = WEEKDAY_LABELS.indexOf(text)
        if (index >= 0) return weekdayOfCurrentWeek(index + 1)
        const numeric = text.match(/^([1-7])$/)
        if (numeric) return weekdayOfCurrentWeek(Number(numeric[1]))
        const alias = text.match(/^(?:周|星期)([一二三四五六日天])$/)
        if (alias) {
            const names = ['一', '二', '三', '四', '五', '六', '日']
            return weekdayOfCurrentWeek(names.indexOf(alias[1] === '天' ? '日' : alias[1]) + 1)
        }
        // 兼容旧值：yyyy-Www 落到该周的周一
        const iso = text.match(/^(\d{4})-W(\d{2})$/)
        if (iso) return dateFromIsoWeek(Number(iso[1]), Number(iso[2]))
        return hasDateTime ? new Date(parsedDateTime.getFullYear(), parsedDateTime.getMonth(), parsedDateTime.getDate()) : invalidDate()
    }

    if (mode === 'time') {
        const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
        if (!match) {
            return hasDateTime
                ? new Date(1970, 0, 1, parsedDateTime.getHours(), parsedDateTime.getMinutes(), parsedDateTime.getSeconds())
                : invalidDate()
        }
        const hour = Number(match[1])
        const minute = Number(match[2])
        const second = Number(match[3] ?? '0')
        return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && second >= 0 && second <= 59
            ? new Date(1970, 0, 1, hour, minute, second)
            : invalidDate()
    }

    const match = text.match(/^(\d{4})$/)
    if (match) {
        const year = Number(match[1])
        return year >= 1 && year <= 9999 ? new Date(year, 0, 1) : invalidDate()
    }
    return hasDateTime ? new Date(parsedDateTime.getFullYear(), 0, 1) : invalidDate()
}

function normalizeForMode(date: Date, mode: DateTimePickerMode): Date {
    if (mode === 'date') return new Date(date.getFullYear(), date.getMonth(), date.getDate())
    if (mode === 'month') return new Date(date.getFullYear(), date.getMonth(), 1)
    // 星期选择保留所选星期几，getDate() 即本周对应的那一天
    if (mode === 'week') return new Date(date.getFullYear(), date.getMonth(), date.getDate())
    if (mode === 'time') return new Date(1970, 0, 1, date.getHours(), date.getMinutes(), date.getSeconds())
    if (mode === 'year') return new Date(date.getFullYear(), 0, 1)
    return new Date(date)
}

function toNativeDateTime(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function parseLocalDate(value: string): Date {
    const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?)?$/)
    if (!match) return invalidDate()
    const [, year, month, day, hour = '0', minute = '0', second = '0'] = match
    const date = new Date(Number(year), Number(month) -1, Number(day), Number(hour), Number(minute), Number(second))
    const valid = date.getFullYear() === Number(year)
        && date.getMonth() === Number(month) -1
        && date.getDate() === Number(day)
        && date.getHours() === Number(hour)
        && date.getMinutes() === Number(minute)
        && date.getSeconds() === Number(second)
    return valid ? date : invalidDate()
}

function mondayOf(date: Date): Date {
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    return monday
}

/** 周一为 1、周日为 7 */
function weekdayNumber(date: Date): number {
    return ((date.getDay() + 6) % 7) + 1
}

/** 本周对应星期几的日期；number 取 1–7 */
function weekdayOfCurrentWeek(number: number): Date {
    const monday = mondayOf(new Date())
    return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + number - 1)
}

/** ISO 8601 周序号：周一为一周起点，包含周四的那一周属于跨年周 */
function isoWeekInfo(date: Date): { year: number, week: number } {
    const thursday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    thursday.setDate(thursday.getDate() - ((thursday.getDay() + 6) % 7) + 3)
    const year = thursday.getFullYear()
    const firstThursday = new Date(year, 0, 4)
    firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3)
    return { year, week: 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / 604800000) }
}

function dateFromIsoWeek(year: number, week: number): Date {
    if (week < 1 || week > 53) return invalidDate()
    const januaryFourth = new Date(year, 0, 4)
    const offset = (januaryFourth.getDay() + 6) % 7
    const monday = new Date(year, 0, 4 - offset + (week - 1) * 7)
    const info = isoWeekInfo(monday)
    return info.year === year && info.week === week ? monday : invalidDate()
}

function invalidDate(): Date {
    return new Date(Number.NaN)
}

function pad(value: number): string { return String(value).padStart(2, '0') }
