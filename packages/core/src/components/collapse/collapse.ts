import { Component } from "../../core/component"
import { getElement, getSelectorFromElement, reflow, type ElementTarget } from '../../core/dom/elements'
import { delegate, type EventDisposer } from '../../core/events'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export interface CollapseOptions extends PlainObject {
    parent: string | null
    toggle: boolean
}

export class Collapse extends Component<CollapseOptions> {
    static readonly componentName = 'collapse'
    static readonly triggerSelector = '[data-toggle="collapse"], [data-kui-toggle="collapse"]'
    static readonly defaults: CollapseOptions = {
        parent: null,
        toggle: true,
    }

    private transitioning = false

    private constructor(element: HTMLElement, options: Partial<CollapseOptions> = {}) {
        super(element, Collapse.componentName, mergeOptions(Collapse.defaults, options))
        if (this.options.toggle) {
            this.toggle()
        }
    }

    static getOrCreate(target: ElementTarget, options: Partial<CollapseOptions> = {}): Collapse {
        const element = getElement(target)
        return (
            getInstance<Collapse>(element, Collapse.componentName) ?? new Collapse(element, {
            ...readDataOptions<CollapseOptions>(element),
            ...options,
            })
        )
    }

    show(): void {
        if (this.transitioning || this.isShown()){
            return
        }

        if (!this.emitCancelable(['show.kui.collapse', 'kui:collapse:show'])) {
            return
        }

        this.hideActivesSiblings()
        this.transitioning = true
        this.element.classList.remove('collapse')
        this.element.classList.add('collapsing')
        this.element.style.height = '0px'

        reflow(this.element)

        this.element.style.height = `${this.element.scrollHeight}px`
        this.afterTransition(() => {
            this.transitioning = false
            this.element.classList.remove('collapsing')
            this.element.classList.add('collapse', 'in', 'show')
            this.element.style.height = ''
            this.emit('kui:collapse:shown')
        })
    }

    hide(): void {
        if (this.transitioning || !this.isShown()) {
            return
        }

        if(!this.emitCancelable(['hide.kui.collapse', 'kui:collapse:hide'])) {
            return
        }

        this.transitioning = true
        this.element.style.height = `${this.element.getBoundingClientRect().height}px`
        reflow(this.element)
        this.element.classList.remove('collapse', 'in', 'show')
        this.element.classList.add('collapsing')
        this.element.style.height = '0px'

        this.afterTransition(() => {
            this.transitioning = false
            this.element.classList.remove('collapsing')
            this.element.classList.add('collapse')
            this.element.style.height = ''
            this.emit('kui:collapse:hidden')
        })
    }

    toggle(): void {
        if (this.isShown()) {
            this.hide()
            return
        }

        this.show()
    }

    isShown(): boolean {
        return this.element.classList.contains('in') || this.element.classList.contains('show')
    }

    private hideActivesSiblings(): void {
        if (!this.options.parent) {
            return
        }

        const parent = document.querySelector<HTMLElement>(this.options.parent)
        if (!parent) {
            return
        }

        parent.querySelectorAll<HTMLElement>('.collapse.in, .collapse.show').forEach((element) => {
            if (element !== this.element) {
                Collapse.getOrCreate(element, { toggle: false }).hide()
            }
        })
    }

    private afterTransition(callback: () => void): void {
        const duration = Number.parseFloat(getComputedStyle(this.element).transitionDuration || '0') * 1000
        if (duration === 0) {
            callback()
            return
        }

        let completed = false
        const complete = () => {
            if (completed) {
                return
            }

            completed = true
            callback()
        }
        const dispose = this.listenOnce('transitionend', complete)
        window.setTimeout(() => {
            complete()
            dispose()
        }, duration + 30)
    }

    private listenOnce(type: keyof HTMLElementEventMap, callback: () => void): EventDisposer {
        const handler = () => {
            callback()
            dispose()
        }
        const dispose = () => this.element.removeEventListener(type, handler)
        this.element.addEventListener(type, handler, { once: true} )
        return dispose
    }
}

export function bindCollapseDataApi(root: Document = document): EventDisposer {
    return delegate(root, 'click', Collapse.triggerSelector, (event, trigger) => {
        const selector = getSelectorFromElement(trigger)
        if (!selector) {
            return
        }

        event.preventDefault()
        Collapse.getOrCreate(selector, {
            parent: trigger.getAttribute('data-parent'),
            toggle: false,
        }).toggle()
    })
}

