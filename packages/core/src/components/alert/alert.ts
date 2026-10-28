import { Component } from '../../core/component'
import { delegate, type EventDisposer } from '../../core/events'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export interface AlertOptions extends PlainObject {
    dismissSelector: string
    removeElement: boolean
}

export class Alert extends Component<AlertOptions> {
    static readonly componentName = 'alert'
    static readonly selector = '.alert'
    static readonly dismissSelector = '[data-dismiss="alert"], [data-kui-dismiss="alert"]'
    static readonly defaults: AlertOptions =  {
        dismissSelector: Alert.dismissSelector,
        removeElement: true,
    }

    private constructor (element: HTMLElement, options: Partial<AlertOptions> = {}) {
        super(element, Alert.componentName, mergeOptions(Alert.defaults, options))
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<AlertOptions> = {}) {
        const element = Alert.resolveElement(target)
        return (
            getInstance<Alert>(element, Alert.componentName) ?? new Alert(element, {...readDataOptions<AlertOptions>(element), ...options})
        )
    }

    close(): void {
        if (!this.emit('kui:alert:close')) {
            return
        }

        this.element.classList.remove('in', 'show')
        this.element.setAttribute('aria-hidden', 'true')

        if (this.options.removeElement) {
            this.element.remove()
            this.dispose()
        }

        this.emit('kui:alert:closed')
    }
}

export function bindAlertDataApi(root: Document = document): EventDisposer {
    return delegate(root, 'click', Alert.dismissSelector, (event, trigger) => {
        event.preventDefault()
        const alert = trigger.closest<HTMLElement>(Alert.selector)
        if (!alert) {
            return
        }

        Alert.getOrCreate(alert).close()
    })
}


