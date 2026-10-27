import { Component } from "../../core/component"
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from "../../core/options"

export interface ICheckOptions extends PlainObject {
    checkboxClass: string
    radioClass: string
}

export class ICheck extends Component<ICheckOptions> {
    static readonly componentName = 'iCheck'
    static readonly selector = 'input[type="checkbox"][data-plugin="iCheck"], input[type="radio"][data-plugin="iCheck"], input[data-kui-icheck]'
    static readonly defaults: ICheckOptions = {
        checkboxClass: 'icheckbox',
        radioClass: 'iradio'
    }

    private readonly input: HTMLInputElement
    private helper: HTMLElement

    private constructor(element: HTMLInputElement, options: Partial<ICheckOptions> = {}) {
        super(element, ICheck.componentName, mergeOptions(ICheck.defaults, options))
        this.input = element
        this.helper = this.wrap()
        this.listen(this.input, 'change', () => {
            if(this.input.type === 'radio' && this.input.checked) {
                this.syncRadioGroup()
            }
            this.update()
        })
        this.listen(this.helper, 'click', (event) => {
            if (event.target !== this.input) {
                event.preventDefault()
                this.toggle()
            }
        })
        this.update()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<ICheckOptions> = {}): ICheck {
        const element = ICheck.resolveElement(target)
        if (!(element instanceof HTMLInputElement)) {
            throw new Error('KUI iCheck requires an input element.')
        }
        return (
            getInstance<ICheck>(element, ICheck.componentName) ?? new ICheck(element, {...readDataOptions<ICheckOptions>(element), ...options})
        )
    }

    check(): void {
        if (this.input.disabled || this.input.checked) {
            return
        }

        if (this.input.type === 'radio' && this.input.name) {
            document.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((radio) => {
                if (radio !== this.input && radio.name === this.input.name) {
                    const instance = getInstance<ICheck>(radio, ICheck.componentName)
                    if(instance){
                        instance.uncheck()
                    }else{
                        radio.checked = false
                    }
                }
            })
        }
        this.input.checked = true
        this.update()
        this.emit('ifChecked')
        this.emit('ifChanged')
    }

    uncheck(): void {
        if (this.input.disabled || !this.input.checked) {
            return
        }
        this.input.checked = false
        this.update()
        this.emit('ifUnchecked')
        this.emit('ifChanged')
    }

    toggle(): void {
        if (this.input.type === 'radio') {
            this.check()
            return
        }
        if (this.input.checked) {
            this.uncheck()
        }else {
            this.check()
        }
    }

    disable() : void {
        this.input.disabled = true
        this.update()
        this.emit('ifDisabled')
    }

    enable(): void {
        this.input.disabled =false
        this.update()
        this.emit('ifEnabled')
    }

    update(): void {
        this.helper.classList.toggle('checked', this.input.checked)
        this.helper.classList.toggle('disable', this.input.disabled)
        this.helper.setAttribute('aria-checked', String(this.input.checked))
        this.helper.setAttribute('aria-disabled', String(this.input.disabled))
    }

    private syncRadioGroup():void {
        if(!this.input.name){
            return
        }
        document.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((radio) => {
            if (radio === this.input || radio.name !== this.input.name) {
                return
            }
            radio.checked = false
            getInstance<ICheck>(radio, ICheck.componentName)?.update()
        })
    }

    destroy():void {
        this.helper.replaceWith(this.input)
        this.input.classList.remove('iCheck-input')
        this.dispose()
    }

    private wrap(): HTMLElement {
        if(this.input.parentElement?.classList.contains('icheckbox') || this.input.parentElement?.classList.contains('iradio')) {
            return this.input.parentElement
        }
        const helper = document.createElement('span')
        helper.className = this.input.type === 'radio' ? this.options.radioClass:this.options.checkboxClass
        helper.setAttribute('role', this.input.type)
        this.input.classList.add('iCheck-input')
        this.input.before(helper)
        helper.append(this.input)
        return helper
    }
}
