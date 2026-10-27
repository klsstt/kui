import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export interface SpinnerOptions extends PlainObject {
    dis: number
    maxValue: number
    minValue: number
    value: number
    callback?: (value: number) => void
}

export class Spinner extends Component<SpinnerOptions> {
    static readonly componentName = 'spinner'
    static readonly selector = '[data-kui-spinner], [data-toggle="spinner"], .kspinner'
    static readonly defaults: SpinnerOptions = {
        dis: 1,
        maxValue: 999,
        minValue: 1,
        value: 1,
    }

    private input!: HTMLInputElement
    private subtract!: HTMLElement
    private add!: HTMLElement

    private constructor(element: HTMLElement, options: Partial<SpinnerOptions> = {}) {
        super(element, Spinner.componentName, mergeOptions(Spinner.defaults, options))
        this.render()
        this.bindEvents()
        this.syncDisabledState()
    }

    static getOrCreate(target: HTMLElement|string, options: Partial<SpinnerOptions> = {}): Spinner {
        const element = Spinner.resolveElement(target)
        return (
            getInstance<Spinner>(element, Spinner.componentName) ?? new Spinner(element, {...readDataOptions<SpinnerOptions>(element), ...options})
        )
    }

    getValue(): number {
        return this.normalizeValue(this.input.value)
    }

    setValue(value: number | string): void {
        const nextValue = this.normalizeValue(value)
        this.input.value = String(nextValue)
        this.syncDisabledState()
        this.options.callback?.(nextValue)
        this.emit('change.kui.spinner', { value: nextValue })
        this.emit('kui:spinner:change', { value: nextValue })
    }

    increment(): void {
        this.setValue(this.getValue() + this.options.dis)
    }

    decrement(): void {
        this.setValue(this.getValue() - this.options.dis)
    }

    private render(): void {
        this.element.innerHTML = `
            <div class="spinner">
                <a class="subtract" href="javascript:void(0)"><i>-</i></a>
                <input class="amount input-text" value="${this.options.value}" autocomplete="off">
                <a class="add" href="javascript:void(0)"><i>+</i></a>
            </div>
        `
        this.input = this.element.querySelector<HTMLInputElement>('.input-text') ?? document.createElement('input')
        this.subtract = this.element.querySelector<HTMLElement>('.subtract') ?? document.createElement('a')
        this.add = this.element.querySelector<HTMLElement>('.add') ?? document.createElement('a')
    }

    private bindEvents(): void {
        this.listen(this.input, 'blur', () => this.setValue(this.input.value))
        this.listen(this.input, 'keydown', (event) => {
            const keyboardEvent = event as KeyboardEvent
            if (keyboardEvent.key === 'ArrowUp' || keyboardEvent.keyCode === 38) {
                keyboardEvent.preventDefault()
                this.decrement()
            } else if (keyboardEvent.key === 'ArrowDown' || keyboardEvent.keyCode === 40) {
                keyboardEvent.preventDefault()
                this.increment()
            }
        })
        this.listen(this.subtract, 'click', (event) => {
            event.preventDefault()
            this.decrement()
        })
        this.listen(this.add, 'click', (event) =>  {
            event.preventDefault()
            this.increment()
        })
    }

    private normalizeValue(value: number | string): number {
        const parsed = typeof value === 'number' ? value : Number.parseInt(value.replace(/[^\d]/g, '').replace(/^0+/, ''), 10)
        if (Number.isNaN(parsed)) {
            return this.options.minValue
        }

        return Math.min(Math.max(parsed, this.options.minValue), this.options.maxValue)
    }

    private syncDisabledState(): void {
        const value = this.getValue()
        this.subtract.classList.toggle('disabled', value <= this.options.minValue)
        this.add.classList.toggle('disabled', value >= this.options.maxValue)
    }
}
