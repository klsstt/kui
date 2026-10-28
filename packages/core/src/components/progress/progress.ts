import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export interface ProgressOptions extends PlainObject {
    max: number,
    min: number,
    showText: boolean,
    label: string,
    value?: number,
    vertical: boolean
}

export interface ProgressChangePayload extends PlainObject {
    percent: number
    value: number
}

export class Progress extends Component<ProgressOptions> {
    static readonly componentName = 'progress'
    static readonly selector = '.progress[data-kui-progress], .progress[data-ride="progress"], .progress[data-toggle="progress"]'
    static readonly defaults: ProgressOptions = {
        max: 100,
        min: 0,
        showText: false,
        label: '进度',
        vertical: false,
    }

    private readonly bar: HTMLElement
    private value: number

    private constructor(element: HTMLElement, options: Partial<ProgressOptions> = {}) {
        super(element, Progress.componentName, mergeOptions(Progress.defaults, options))
        this.element.classList.add('progress')
        this.bar = this.resolveBar()
        this.value = this.resolveInitialValue()
        this.render()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<ProgressOptions> = {}): Progress {
        const element = Progress.resolveElement(target)
        return (
            getInstance<Progress>(element, Progress.componentName) ?? new Progress(element, {...readDataOptions<ProgressOptions>(element), ...options})
        )
    }

    getValue(): number {
        return this.value
    }

    getPercent(): number {
        const range = this.options.max - this.options.min
        if (range <= 0) {
            return 0
        }

        return ((this.value - this.options.min) / range) * 100
    }

    setValue(value: number): void {
        this.value = this.clampValue(Number(value))
        this.render()
        this.emit<ProgressChangePayload>('kui:progress:change', {
            percent: this.getPercent(),
            value: this.value,
        })
    }

    reset(): void {
        this.setValue(this.options.min)
    }

    private resolveBar(): HTMLElement {
        const existing = this.element.querySelector<HTMLElement>(':scope > .progress-bar, .progress-bar')
        if (existing) {
            return existing
        }

        const bar = document.createElement('div')
        bar.className = 'progress-bar'
        this.element.append(bar)
        return bar
    }

    private resolveInitialValue(): number {
        if (typeof this.options.value === 'number') {
            return this.clampValue(this.options.value)
        }

        const ariaValue = Number(this.bar.getAttribute('aria-valuenow'))
        if (Number.isFinite(ariaValue)) {
            return this.clampValue(ariaValue)
        }

        const percent = this.readInlinePercent()
        if (Number.isFinite(percent)) {
            const value = this.options.min + ((this.options.max - this.options.min) * percent) / 100
            return this.clampValue(value)
        }

        return this.options.min
    }

    private readInlinePercent(): number {
        const property = this.isVertical() ? this.bar.style.height : this.bar.style.width
        const match = property.match(/^([\d.]+)%$/)
        return match ? Number(match[1]) : Number.NaN
    }

    private render(): void {
        const percent = Math.max(0, Math.min(100, this.getPercent()))
        const percentText = `${Math.round(percent)}%`
        const dimension = this.isVertical() ? 'height' : 'width'
        const oppositeDimension = this.isVertical() ? 'width' : 'height'

        this.bar.style.setProperty(dimension, percentText)
        if (this.bar.style.getPropertyValue(oppositeDimension) === '0%') {
            this.bar.style.removeProperty(oppositeDimension)
        }
        this.bar.setAttribute('role', 'progressbar')
        this.bar.setAttribute('aria-label', this.options.label)
        this.bar.setAttribute('aria-valuemin', String(this.options.min))
        this.bar.setAttribute('aria-valuemax', String(this.options.max))
        this.bar.setAttribute('aria-valuenow', String(this.value))

        if (this.shouldShowText()) {
            this.bar.textContent = percentText
        }
    }

    private shouldShowText(): boolean {
        return this.options.showText || (this.bar.textContent?.trim().length ?? 0) > 0
    }

    private isVertical(): boolean {
        return this.options.vertical || this.element.classList.contains('progress-vertical')
    }

    private clampValue(value: number): number {
        if(!Number.isFinite(value)) {
            return this.options.min
        }

        return Math.max(this.options.min, Math.min(this.options.max, value))
    }

}
