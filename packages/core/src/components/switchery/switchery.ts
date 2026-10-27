import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export interface SwitcheryOptions extends PlainObject {
    className: string
    color: string
    disabled: boolean
    disabledOpacity: number
    jackColor: string
    secondaryColor: string
    size: 'default' | 'small' | 'large'
}

export class Switchery extends Component<SwitcheryOptions> {
    static readonly componentName = 'switchery'
    static readonly selector = 'input[type="checkbox"][data-plugin="switchery"], input[type="checkbox"][data-kui-switchery]'
    static readonly defaults: SwitcheryOptions = {
        className: 'switchery',
        color: '#64b5f6',
        disabled: false,
        disabledOpacity: 0.5,
        jackColor: '#fff',
        secondaryColor: '#dfdfdf',
        size: 'default',
    }

    private readonly input: HTMLInputElement
    private switchElement: HTMLElement

    constructor(element: HTMLInputElement, options: Partial<SwitcheryOptions> = {}) {
        super(element, Switchery.componentName, mergeOptions(Switchery.defaults, readDataOptions<SwitcheryOptions>(element), options))
        this.input = element
        this.input.disabled = this.options.disabled || this.input.disabled
        this.switchElement = this.createSwitch()
        this.listen(this.input, 'change',() => this.setPosition())
        this.listen(this.switchElement, 'click', (event) => {
            event.preventDefault()
            if (!this.input.disabled) {
                this.input.checked = !this.input.checked
                this.input.dispatchEvent(new Event('change', { bubbles: true }))
            }
        })
        this.setPosition()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<SwitcheryOptions> = {}): Switchery {
        const element = Switchery.resolveElement(target)
        if (!(element instanceof HTMLInputElement)) {
            throw new Error('KUI Switchery requires a checkbox input.')
        }
        return getInstance<Switchery>(element, Switchery.componentName) ?? new Switchery(element, options)
    }

    setPosition(): void {
        this.switchElement.classList.toggle('checked', this.input.checked)
        this.switchElement.classList.toggle('disabled', this.input.disabled)
        this.switchElement.style.backgroundColor = this.input.checked ? this.options.color : this.options.secondaryColor
        this.switchElement.style.opacity = this.input.disabled ? String(this.options.disabledOpacity) : ''
        this.emit('kui:switchery:change', { checked: this.input.checked })
    }

    enable(): void {
        this.input.disabled = false
        this.setPosition()
    }
    disable(): void {
        this.input.disabled = true
        this.setPosition()
    }

    destroy(): void {
        this.switchElement.remove()
        this.input.classList.remove('switchery-input')
        this.input.hidden = false
        this.dispose()
    }

    private createSwitch(): HTMLElement {
        const existing = this.input.nextElementSibling
        if (existing instanceof HTMLElement && existing.classList.contains(this.options.className)) {
            return existing
        }
        const switchElement = document.createElement('span')
        switchElement.className = `${this.options.className} switchery-${this.options.size}`
        const jack = document.createElement('small')
        jack.style.backgroundColor = this.options.jackColor
        switchElement.append(jack)
        this.input.classList.add('switchery-input')
        this.input.hidden = true
        this.input.after(switchElement)
        return switchElement

    }

}
