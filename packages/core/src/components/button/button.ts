import { Component } from "../../core/component"
import { delegate, type EventDisposer } from "../../core/events"
import { getInstance } from "../../core/instances"
import { mergeOptions, readDataOptions, type PlainObject } from "../../core/options"

export interface ButtonOptions extends PlainObject {
    loadingText: string
}

export class Button extends Component<ButtonOptions> {
    static readonly componentName = 'button'
    static readonly selector = 'button'
    static readonly defaults: ButtonOptions = {
        loadingText: 'Loading...',
    }

    private resetText: string | null = null
    private isLoading = false

    private constructor(element: HTMLElement, options: Partial<ButtonOptions> = {}) {
        super(element, Button.componentName, mergeOptions(Button.defaults, options))
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<ButtonOptions> = {}): Button {
        const element = Button.resolveElement(target)
        return (
            getInstance<Button>(element, Button.componentName) ?? new Button(element, {...readDataOptions<ButtonOptions>(element), ...options})
        )
    }

    setState(state: string): void {
        const stateKey = `${state}Text`
        const nextText = this.element.dataset[stateKey] ?? this.options.loadingText
        if (this.resetText === null) {
            this.resetText = this.getText()
        }

        if (state === 'reset') {
            this.setText(this.resetText)
            this.element.classList.remove('disabled')
            this.element.removeAttribute('disabled')
            this.isLoading = false
        }

        this.setText(nextText)
        if (state === 'loading') {
            this.element.classList.add('disabled')
            this.element.setAttribute('disabled', 'disabled')
            this.isLoading = true
        } else if (this.isLoading) {
            this.element.classList.remove('disabled')
            this.element.removeAttribute('disabled')
            this.isLoading = false
        }
    }

    toggle(): void {
        const group = this.element.closest<HTMLElement>('[data-toggle="buttons"], [data-kui-toggle="buttons"]')
        const input = this.element.querySelector<HTMLInputElement>('input')

        if (!group || !input) {
            const isPressed = !this.element.classList.contains('active')
            this.element.classList.toggle('active', isPressed)
            this.element.setAttribute('aria-pressed', String(isPressed))
            this.emit('kui:button:toggled', { active: isPressed })
            return
        }

        if (input.type === 'radio') {
            if (input.checked && this.element.classList.contains('active')) {
                return
            }

            group.querySelectorAll<HTMLElement>('.btn.active').forEach((button) => {
                button.classList.remove('active')
                button.querySelector<HTMLInputElement>('input')?.removeAttribute('checked')
            })
            this.element.classList.add('active')
            input.checked = true
        } else if (input.type === 'checkbox') {
            this.element.classList.toggle('active', input.checked)
            input.checked = this.element.classList.contains('active')
        }

        input.dispatchEvent(new Event('change', { bubbles: true }))
        this.emit('kui:button:toggled', { active: this.element.classList.contains('active') })
    }

    private getText(): string {
        if (this.element instanceof HTMLInputElement) {
            return this.element.value
        }

        return this.element.innerHTML
    }

    private setText(text: string): void {
        if (this.element instanceof HTMLInputElement) {
            this.element.value = text
            return
        }

        this.element.innerHTML = text
    }
}

export function bindButtonDataApi(root: Document = document): EventDisposer {
    const clickDisposer = delegate(root, 'click', Button.selector, (event, trigger) => {
        const button = trigger.closest<HTMLElement>('.btn') ?? trigger
        Button.getOrCreate(button).toggle()

        if(!(event.target instanceof HTMLInputElement)) {
            event.preventDefault()
            button.focus()
        }
    })

    const focusDisposer = delegate(root, 'focusin', Button.selector, (_event, trigger) => {
        trigger.closest<HTMLElement>('.btn')?.classList.add('focus')
    })

    const blurDisposer = delegate(root, 'focusout', Button.selector, (_event, trigger) => {
        trigger.closest<HTMLElement>('.btn')?.classList.remove('focus')
    })

    return () => {
        clickDisposer()
        focusDisposer()
        blurDisposer()
    }
}
