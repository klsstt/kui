import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export interface SliderOptions extends PlainObject {
    enabled: boolean
    max: number
    min: number
    step: number
    ticks?: number[]
    ticks_labels?: string[]
    value: number
}

export class Slider extends Component<SliderOptions> {
    static readonly componentName = 'slider'
    static readonly selector = 'input[data-plugin="bootstrapSlider"], input[data-kui-slider]'
    static readonly defaults: SliderOptions = {
        enabled: true,
        max: 100,
        min: 0,
        step: 1,
        value: 0
    }

    private readonly input: HTMLInputElement
    private wrapper: HTMLElement

    private constructor(element: HTMLInputElement, options: Partial<SliderOptions> = {}) {
        super(element, Slider.componentName, mergeOptions(Slider.defaults, options))
        this.input = element
        this.wrapper = this.createWrapper()
        this.setupInput()
        this.listen(this.input, 'input', () => this.emit('slide', { value: this.getValue() }))
        this.listen(this.input, 'change', () => this.emit('kui:slider:change', { value: this.getValue() }))
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<SliderOptions> = {}): Slider {
        const element = Slider.resolveElement(target)
        if (!(element instanceof HTMLInputElement)) {
            throw new Error('KUI slider requires an input element.')
        }
        return (getInstance<Slider>(element, Slider.componentName) ?? new Slider(element, {...readDataOptions<SliderOptions>(element), ...options }))
    }

    getValue(): number {
        return Number(this.input.value)
    }

    setValue(value: number): void {
        this.input.value = String(value)
        this.emit('slide', { value })
        this.input.dispatchEvent(new Event('change', { bubbles: true }))
    }

    enable(): void {
        this.input.disabled = false
        this.wrapper.classList.remove('slider-disabled')
    }

    disable(): void {
        this.input.disabled = true
        this.wrapper.classList.add('slider-disabled')
    }

    destroy(): void {
        this.wrapper.replaceWith(this.input)
        this.input.classList.remove('slider-input')
        this.dispose()
    }

    private createWrapper(): HTMLElement {
        const wrapper = document.createElement('span')
        wrapper.className = 'slider slider-horizontal'
        this.input.before(wrapper)
        wrapper.append(this.input)
        this.renderTicks(wrapper)
        return wrapper
    }

    private setupInput(): void {
        this.input.type = 'range'
        this.input.classList.add('slider-input')
        this.input.min = String(this.options.min)
        this.input.max = String(this.options.max)
        this.input.step = String(this.options.step)
        this.input.value = String(this.options.value || Number(this.input.value) || this.options.min)
        this.input.disabled = !this.options.enabled
        this.wrapper.classList.toggle('slider-disabled', this.input.disabled)
    }

    private renderTicks(wrapper: HTMLElement): void {
        if (!this.options.ticks?.length) {
            return
        }
        const ticks = document.createElement('span')
        ticks.className = 'slider-ticks'
        this.options.ticks.forEach((tick, index) => {
            const item = document.createElement('span')
            item.className = 'slider-tick'
            item.dataset.value = String(tick)
            item.textContent = this.options.ticks_labels?.[index] ?? ''
            ticks.append(item)
        })
        wrapper.append(ticks)
    }
}
