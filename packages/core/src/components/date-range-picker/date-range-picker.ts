import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

/**
 * 日期范围选择器。
 * 触发区是一个只读输入框，浮层里用真实按钮画日历：
 * 第一次点日期定开始，第二次点日期定结束；开始与结束之间高亮。
 * 选完点「确定」才写回输入框，并派发 kui:daterange:change。
 */

export interface DateRangeValue {
    /** 开始日期，yyyy-mm-dd；未选择时为空字符串 */
    start: string
    /** 结束日期，yyyy-mm-dd；未选择时为空字符串 */
    end: string
    /** 开始日期对象；未选择时为 null */
    startDate: Date | null
    /** 结束日期对象；未选择时为 null */
    endDate: Date | null
}

export interface DateRangePickerOptions extends PlainObject {
    /** 最早可选日期，yyyy-mm-dd 或 Date；也可直接写在输入框的 min 属性上 */
    min?: string | Date
    /** 最晚可选日期，yyyy-mm-dd 或 Date；也可直接写在输入框的 max 属性上 */
    max?: string | Date
    /** 未选择时输入框里的占位文案 */
    placeholder: string
    /** 开始与结束之间的分隔符 */
    separator: string
    /** 值写回后的回调，参数与 kui:daterange:change 的 payload 一致 */
    onChange?: (value: DateRangeValue) => void
}

export type DateRangePickerProps = DateRangePickerOptions

const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const RANGE_SEPARATOR = /\s*(?:→|->|~|～|至|,|，)\s*/

let rangePickerId = 0

interface DateRangeBounds {
    min: Date | null
    max: Date | null
}

export class DateRangePicker extends Component<DateRangePickerOptions> {
    static readonly componentName = 'daterangepicker'
    static readonly selector = '[data-provide="daterangepicker"], [data-kui-date-range-picker]'
    static readonly defaults: DateRangePickerOptions = {
        placeholder: '',
        separator: ' → ',
    }

    private start: Date | null = null
    private end: Date | null = null
    private draftStart: Date | null = null
    private draftEnd: Date | null = null
    private previousStart: Date | null = null
    private previousEnd: Date | null = null
    private viewMonth: Date = startOfMonth(new Date())
    private bounds: DateRangeBounds = { min: null, max: null }
    private picker: HTMLElement | null = null
    private grid: HTMLElement | null = null
    private title: HTMLElement | null = null
    private previousButton: HTMLButtonElement | null = null
    private nextButton: HTMLButtonElement | null = null

    private constructor(element: HTMLElement, options: Partial<DateRangePickerOptions> = {}) {
        super(element, DateRangePicker.componentName, mergeOptions(DateRangePicker.defaults, options))
        if (!(element instanceof HTMLInputElement)) {
            throw new TypeError('KUI DateRangePicker requires an <input> element.')
        }

        const placeholder = this.options.placeholder || element.getAttribute('placeholder') || '选择日期范围'
        this.options.placeholder = placeholder
        element.classList.add('daterange-input')
        element.readOnly = true
        element.setAttribute('autocomplete', 'off')
        element.setAttribute('aria-haspopup', 'dialog')
        element.setAttribute('aria-expanded', 'false')
        element.placeholder = placeholder

        this.readInitialValue()
        this.viewMonth = startOfMonth(this.start ?? this.end ?? new Date())
        this.bindTriggerEvents()
        this.renderInput()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<DateRangePickerOptions> = {}): DateRangePicker {
        const element = DateRangePicker.resolveElement(target)
        if (!(element instanceof HTMLInputElement)) {
            throw new TypeError('KUI DateRangePicker requires an <input> element.')
        }
        return getInstance<DateRangePicker>(element, DateRangePicker.componentName) ?? new DateRangePicker(element, {
            ...readDataOptions<DateRangePickerOptions>(element), ...options,
        })
    }

    /** 打开日历浮层 */
    show(focusCalendar = true): void {
        if (!this.picker) this.createPicker()
        if (this.isOpen) return

        this.previousStart = this.start ? new Date(this.start) : null
        this.previousEnd = this.end ? new Date(this.end) : null
        this.draftStart = this.start ? new Date(this.start) : null
        this.draftEnd = this.end ? new Date(this.end) : null
        this.viewMonth = startOfMonth(this.draftStart ?? this.start ?? new Date())
        this.bounds = this.readBounds()

        this.renderCalendar()
        this.picker?.classList.add('open')
        this.input.setAttribute('aria-expanded', 'true')
        this.position()
        if (focusCalendar) this.focusPreferredDay()
        this.emit('kui:daterange:show', this.getValue())
    }

    /** 关闭日历浮层，不改变已确认的值 */
    hide(restoreFocus = true): void {
        if (!this.isOpen) return
        const focusInside = Boolean(this.picker?.contains(document.activeElement))
        this.picker?.classList.remove('open')
        this.input.setAttribute('aria-expanded', 'false')
        if (restoreFocus && focusInside) this.input.focus()
        this.emit('kui:daterange:hide', this.getValue())
    }

    get isOpen(): boolean {
        return Boolean(this.picker?.classList.contains('open'))
    }

    getStart(): Date | null {
        return this.start ? new Date(this.start) : null
    }

    getEnd(): Date | null {
        return this.end ? new Date(this.end) : null
    }

    /** 当前已确认的值，start / end 为 yyyy-mm-dd 字符串 */
    getValue(): DateRangeValue {
        return {
            start: this.start ? formatIsoDate(this.start) : '',
            end: this.end ? formatIsoDate(this.end) : '',
            startDate: this.start ? new Date(this.start) : null,
            endDate: this.end ? new Date(this.end) : null,
        }
    }

    /** 写入范围；顺序不合法时自动对调，保证 start <= end */
    setValue(start: Date | string | null, end: Date | string | null = null): void {
        let first = toDate(start)
        let last = toDate(end)
        if (first && last && last.getTime() < first.getTime()) {
            [first, last] = [last, first]
        }
        this.draftStart = first ? new Date(first) : null
        this.draftEnd = last ? new Date(last) : null
        this.applyValue(first, last)
        if (this.isOpen) {
            this.viewMonth = startOfMonth(first ?? last ?? this.viewMonth)
            this.renderCalendar()
        }
    }

    /** 清空范围，等价于 setValue(null, null) */
    clear(): void {
        this.setValue(null, null)
    }

    remove(): void { this.dispose() }

    destroy(): void { this.dispose() }

    override dispose(): void {
        this.picker?.remove()
        this.picker = null
        this.grid = null
        this.title = null
        this.previousButton = null
        this.nextButton = null
        this.input.removeAttribute('aria-controls')
        this.input.removeAttribute('aria-expanded')
        this.input.removeAttribute('aria-haspopup')
        super.dispose()
    }

    private get input(): HTMLInputElement {
        return this.element as HTMLInputElement
    }

    private readInitialValue(): void {
        const raw = this.input.value.trim()
        if (!raw) return
        const parts = raw.split(RANGE_SEPARATOR)
        this.start = parseIsoDate(parts[0])
        this.end = parts.length > 1 ? parseIsoDate(parts[1]) : null
        if (this.start && this.end && this.end.getTime() < this.start.getTime()) {
            this.end = null
        }
    }

    private renderInput(): void {
        this.input.placeholder = this.options.placeholder
        if (!this.start && !this.end) {
            this.input.value = ''
            return
        }
        const start = this.start ? formatIsoDate(this.start) : '选择开始日期'
        const end = this.end ? formatIsoDate(this.end) : '…'
        this.input.value = `${start}${this.options.separator}${end}`
    }

    private bindTriggerEvents(): void {
        this.listen(this.input, 'click', () => {
            if (this.isOpen) this.hide(false)
            else this.show(true)
        })
        this.listen(this.input, 'keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
                event.preventDefault()
                this.show(true)
            }
        })
        this.listen(document, 'keydown', (event) => {
            if (event.key === 'Escape' && this.isOpen) {
                event.preventDefault()
                this.hide(true)
            }
        })
        this.listen(document, 'pointerdown', (event) => {
            if (!this.isOpen) return
            const target = event.target
            if (!(target instanceof Node)) return
            if (this.picker?.contains(target) || this.element.contains(target)) return
            this.hide(false)
        })

        const reposition = (): void => {
            if (this.isOpen) this.position()
        }
        window.addEventListener('resize', reposition)
        window.addEventListener('scroll', reposition, true)
        this.disposers.push(() => {
            window.removeEventListener('resize', reposition)
            window.removeEventListener('scroll', reposition, true)
        })
    }

    private createPicker(): void {
        const picker = document.createElement('div')
        picker.className = 'daterange'
        picker.id = `kui-daterange-${++rangePickerId}`
        picker.setAttribute('role', 'dialog')
        picker.setAttribute('aria-modal', 'false')
        picker.setAttribute('aria-label', '选择日期范围')
        picker.innerHTML = `
            <div class="daterange__header">
                <button type="button" class="daterange__nav" data-daterange-nav="prev" aria-label="上个月">‹</button>
                <span class="daterange__title" data-daterange-title aria-live="polite"></span>
                <button type="button" class="daterange__nav" data-daterange-nav="next" aria-label="下个月">›</button>
            </div>
            <div class="daterange__weekdays" aria-hidden="true">
                ${WEEKDAY_LABELS.map((label) => `<span>${label}</span>`).join('')}
            </div>
            <div class="daterange__grid" data-daterange-grid role="group" aria-label="日期"></div>
            <div class="daterange__footer">
                <button type="button" class="daterange__action" data-daterange-action="clear">清空</button>
                <button type="button" class="daterange__action" data-daterange-action="cancel">取消</button>
                <button type="button" class="daterange__action is-primary" data-daterange-action="confirm">确定</button>
            </div>`

        this.picker = picker
        this.grid = picker.querySelector<HTMLElement>('[data-daterange-grid]')
        this.title = picker.querySelector<HTMLElement>('[data-daterange-title]')
        this.previousButton = picker.querySelector<HTMLButtonElement>('[data-daterange-nav="prev"]')
        this.nextButton = picker.querySelector<HTMLButtonElement>('[data-daterange-nav="next"]')

        this.input.setAttribute('aria-controls', picker.id)
        document.body.append(picker)

        if (this.grid) {
            this.listen(this.grid, 'click', (event) => {
                const target = event.target
                if (!(target instanceof Element)) return
                const day = target.closest<HTMLButtonElement>('[data-daterange-day]')
                if (!day || day.disabled) return
                event.preventDefault()
                const date = parseIsoDate(day.dataset.date ?? '')
                if (date) this.pickDay(date)
            })
            this.listen(this.grid, 'keydown', (event) => this.handleGridKeydown(event))
        }

        this.listen(picker, 'click', (event) => {
            const target = event.target
            if (!(target instanceof Element)) return
            const nav = target.closest<HTMLElement>('[data-daterange-nav]')
            if (nav) {
                event.preventDefault()
                this.shiftMonth(nav.dataset.daterangeNav === 'next' ? 1 : -1)
                return
            }
            const action = target.closest<HTMLElement>('[data-daterange-action]')?.dataset.daterangeAction
            if (!action) return
            event.preventDefault()
            if (action === 'clear') this.clearDraft()
            else if (action === 'cancel') this.cancel()
            else if (action === 'confirm') this.confirm()
        })
    }

    private readBounds(): DateRangeBounds {
        const max = this.options.max ?? this.element.getAttribute('max')
        const min = this.options.min ?? this.element.getAttribute('min')
        return { min: toDate(min), max: toDate(max) }
    }

    private isDisabled(date: Date): boolean {
        const { min, max } = this.bounds
        if (min && date.getTime() < min.getTime()) return true
        if (max && date.getTime() > max.getTime()) return true
        // 第二次点击选结束时，早于开始日期的天不可选；同一天允许作为单日范围
        if (this.draftStart && !this.draftEnd && date.getTime() < this.draftStart.getTime()) return true
        return false
    }

    private renderCalendar(): void {
        const grid = this.grid
        if (!grid) return
        const year = this.viewMonth.getFullYear()
        const month = this.viewMonth.getMonth()
        if (this.title) this.title.textContent = `${year} 年 ${month + 1} 月`

        const first = new Date(year, month, 1)
        const offset = weekdayIndex(first)
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const fragment = document.createDocumentFragment()

        for (let cell = 0; cell < 42; cell += 1) {
            const dayNumber = cell - offset + 1
            if (dayNumber < 1 || dayNumber > daysInMonth) {
                const empty = document.createElement('span')
                empty.className = 'daterange__day is-empty'
                empty.setAttribute('aria-hidden', 'true')
                fragment.append(empty)
                continue
            }
            fragment.append(this.createDayButton(new Date(year, month, dayNumber)))
        }
        grid.replaceChildren(fragment)

        if (this.previousButton) this.previousButton.disabled = !this.canShowMonth(-1)
        if (this.nextButton) this.nextButton.disabled = !this.canShowMonth(1)
    }

    private createDayButton(date: Date): HTMLButtonElement {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'daterange__day'
        button.dataset.daterangeDay = ''
        button.dataset.date = formatIsoDate(date)
        button.textContent = String(date.getDate())

        const isStart = sameDay(date, this.draftStart)
        const isEnd = sameDay(date, this.draftEnd)
        const inRange = Boolean(this.draftStart && this.draftEnd
            && date.getTime() > this.draftStart.getTime()
            && date.getTime() < this.draftEnd.getTime())
        const disabled = this.isDisabled(date)
        const today = sameDay(date, new Date())

        button.classList.toggle('is-start', isStart)
        button.classList.toggle('is-end', isEnd)
        button.classList.toggle('is-in-range', inRange)
        button.classList.toggle('is-today', today)
        button.disabled = disabled
        button.setAttribute('aria-pressed', String(isStart || isEnd))
        button.setAttribute('aria-label', `${formatIsoDate(date)} ${WEEKDAY_LABELS[weekdayIndex(date)]}${disabled ? '，不可选' : ''}`)
        if (disabled) button.setAttribute('aria-disabled', 'true')
        return button
    }

    private pickDay(date: Date): void {
        const day = startOfDay(date)
        if (!this.draftStart || (this.draftStart && this.draftEnd)) {
            // 第一次点击，或上一段范围已选完：重新从开始日期选起
            this.draftStart = day
            this.draftEnd = null
        } else if (day.getTime() < this.draftStart.getTime()) {
            // 早于开始的天在界面上已禁用，这里再兜底一次
            this.draftStart = day
            this.draftEnd = null
        } else if (day.getTime() === this.draftStart.getTime()) {
            // 同一天允许成为单日范围
            this.draftEnd = new Date(day)
        } else {
            this.draftEnd = day
        }
        this.renderCalendar()
        this.focusDay(day)
    }

    private handleGridKeydown(event: KeyboardEvent): void {
        const target = event.target
        if (!(target instanceof HTMLElement)) return
        const day = target.closest<HTMLButtonElement>('[data-daterange-day]')
        if (!day) return
        const date = parseIsoDate(day.dataset.date ?? '')
        if (!date) return
        const delta: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
        const offset = delta[event.key]
        if (offset === undefined) return
        event.preventDefault()
        this.focusClosestDay(addDays(date, offset))
    }

    private focusClosestDay(date: Date): void {
        if (date.getMonth() !== this.viewMonth.getMonth() || date.getFullYear() !== this.viewMonth.getFullYear()) {
            this.viewMonth = startOfMonth(date)
            this.renderCalendar()
        }
        const iso = formatIsoDate(date)
        const exact = this.grid?.querySelector<HTMLButtonElement>(`[data-daterange-day][data-date="${iso}"]`)
        if (exact && !exact.disabled) {
            exact.focus({ preventScroll: true })
            return
        }
        const enabled = Array.from(this.grid?.querySelectorAll<HTMLButtonElement>('.daterange__day:not(:disabled)') ?? [])
        const next = enabled.find((button) => {
            const value = parseIsoDate(button.dataset.date ?? '')
            return value ? value.getTime() >= date.getTime() : false
        })
        ;(next ?? enabled[enabled.length - 1])?.focus({ preventScroll: true })
    }

    private focusDay(date: Date): void {
        const iso = formatIsoDate(date)
        this.grid
            ?.querySelector<HTMLButtonElement>(`[data-daterange-day][data-date="${iso}"]`)
            ?.focus({ preventScroll: true })
    }

    private focusPreferredDay(): void {
        const grid = this.grid
        const preferred = grid?.querySelector<HTMLButtonElement>('.daterange__day.is-start:not(:disabled)')
            ?? grid?.querySelector<HTMLButtonElement>('.daterange__day.is-today:not(:disabled)')
            ?? grid?.querySelector<HTMLButtonElement>('.daterange__day:not(:disabled)')
        preferred?.focus({ preventScroll: true })
    }

    /** 当前月份前后移动后是否仍有可选日期 */
    private canShowMonth(delta: number): boolean {
        const first = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() + delta, 1)
        const last = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() + delta + 1, 0)
        const { min, max } = this.bounds
        if (min && last.getTime() < min.getTime()) return false
        if (max && first.getTime() > max.getTime()) return false
        return true
    }

    private shiftMonth(delta: number): void {
        if (!this.canShowMonth(delta)) return
        this.viewMonth = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() + delta, 1)
        this.renderCalendar()
        this.position()
    }

    private position(): void {
        const picker = this.picker
        if (!picker) return
        const rect = this.element.getBoundingClientRect()
        const width = picker.offsetWidth
        const height = picker.offsetHeight
        const gap = 6
        const margin = 8

        let left = rect.left
        if (left + width > window.innerWidth - margin) left = window.innerWidth - width - margin
        left = Math.max(margin, left)

        let top = rect.bottom + gap
        let above = false
        if (top + height > window.innerHeight - margin) {
            const candidate = rect.top - gap - height
            if (candidate >= margin) {
                top = candidate
                above = true
            } else {
                top = Math.max(margin, window.innerHeight - height - margin)
            }
        }

        picker.style.left = `${Math.round(left)}px`
        picker.style.top = `${Math.round(top)}px`
        picker.classList.toggle('is-above', above)
    }

    private clearDraft(): void {
        this.draftStart = null
        this.draftEnd = null
        this.applyValue(null, null)
        this.renderCalendar()
        this.focusPreferredDay()
    }

    private cancel(): void {
        this.draftStart = null
        this.draftEnd = null
        this.applyValue(this.previousStart, this.previousEnd)
        this.hide()
    }

    private confirm(): void {
        this.applyValue(this.draftStart, this.draftEnd)
        this.hide()
    }

    private applyValue(start: Date | null, end: Date | null): void {
        this.start = start ? startOfDay(start) : null
        this.end = end ? startOfDay(end) : null
        this.renderInput()
        const value = this.getValue()
        this.emit('kui:daterange:change', value)
        this.options.onChange?.(value)
        this.element.dispatchEvent(new Event('change', { bubbles: true }))
    }
}

/** data API：给 [data-provide="daterangepicker"] / [data-kui-date-range-picker] 自动挂实例 */
export function bindDateRangePickerDataApi(root: ParentNode = document): () => void {
    const created: DateRangePicker[] = []
    root.querySelectorAll<HTMLInputElement>(DateRangePicker.selector).forEach((element) => {
        if (element instanceof HTMLInputElement) created.push(DateRangePicker.getOrCreate(element))
    })
    return () => {
        created.splice(0).forEach((instance) => instance.dispose())
    }
}

function parseIsoDate(value: string): Date | null {
    const match = value.trim().match(ISO_DATE)
    if (!match) return null
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    const valid = date.getFullYear() === Number(match[1])
        && date.getMonth() === Number(match[2]) - 1
        && date.getDate() === Number(match[3])
    return valid ? date : null
}

function toDate(value: unknown): Date | null {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : startOfDay(value)
    if (typeof value === 'string') return parseIsoDate(value)
    return null
}

function formatIsoDate(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/** 周一为 0、周日为 6 的下标 */
function weekdayIndex(date: Date): number {
    return (date.getDay() + 6) % 7
}

function sameDay(left: Date | null, right: Date | null): boolean {
    if (!left || !right) return false
    return left.getFullYear() === right.getFullYear()
        && left.getMonth() === right.getMonth()
        && left.getDate() === right.getDate()
}

function pad(value: number): string {
    return String(value).padStart(2, '0')
}
