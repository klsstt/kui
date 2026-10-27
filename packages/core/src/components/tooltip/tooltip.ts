import { autoUpdate, computePosition, flip, offset, shift, type Placement } from "@floating-ui/dom"
import { Component } from "../../core/component"
import { delegate, type EventDisposer } from '../../core/events'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export interface TooltipDelay extends PlainObject {
    show: number,
    hide: number
}

export interface TooltipOptions extends PlainObject {
    animation: boolean,
    container: HTMLElement | string | false,
    delay: number | TooltipDelay,
    html: boolean,
    placement: Placement,
    selector: string | false,
    template: string,
    title: string | (() => string),
    trigger: string,
}

let tooltipId = 0

export class Tooltip extends Component<TooltipOptions> {
    static readonly componentName: string = 'tooltip'
    static readonly selector: string = '[data-toggle="tooltip"], [data-kui-toggle="tooltip"]'
    static readonly defaults: TooltipOptions = {
        animation: true,
        container: false,
        delay: 0,
        html: false,
        placement: 'top',
        selector: false,
        template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
        title: '',
        trigger: 'hover focus',
    }

    private enabled = true
    private tipElement: HTMLElement | null = null
    private timeoutId: number | null = null
    private cleanupAutoUPdate: EventDisposer | null = null
    private originalTitle: string | null = null

    protected constructor (
        element: HTMLElement,
        options: Partial<TooltipOptions> = {},
        componentName = Tooltip.componentName,
    ) {
        super(element, componentName, mergeOptions(Tooltip.defaults, options))
        this.fixTitle()
        this.bindTriggers()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<TooltipOptions> = {}): Tooltip {
        const element = Tooltip.resolveElement(target)
        return (
            getInstance<Tooltip>(element, Tooltip.componentName) ?? new Tooltip(element, {...readDataOptions<TooltipOptions>(element), ...options})
        )
    }

    show(): boolean {
        if (!this.enabled || !this.hasContent() || !this.emitCancelable(['show.kui.tooltip', 'kui:tooptip:show'])) {
            return false
        }

        const tip = this.getTipElement()
        if (tip.isConnected) {
            return false
        }

        tip.id = tip.id || `tooltip-${++tooltipId}`
        tip.classList.toggle('fade', this.options.animation)
        tip.classList.add('in', 'show', this.options.placement.split('-')[0])
        this.setContent(tip)
        this.element.setAttribute('aria-describedby', tip.id)
        this.getContainer().append(tip)
        this.updatePosition(tip)
        this.emit('kui:tooltip:show')
        return true
    }

    hide(): boolean {
        if (!this.tipElement?.isConnected || !this.emitCancelable(['hide.kui.tooltip', 'kui:tooptip:hide'])) {
            return false
        }

        this.removeTip()
        this.emit('kui:tooltip:hidden')
        return true
    }

    toggle(): void {
        if (this.tipElement?.isConnected) {
            this.hide()
            return
        }

        this.show()
    }

    enable(): void {
        this.enabled = true
    }

    disable(): void {
        this.enabled = false
    }

    toggleEnabled(): void {
        this.enabled = !this.enable
    }

    destroy(): void {
        this.dispose()
    }

    override dispose(): void {
        this.clearScheduledAction()
        this.removeTip()
        if (this.originalTitle !== null) {
            this.element.setAttribute('title', this.originalTitle)
            this.element.removeAttribute('data-original-title')
        }
        super.dispose()
    }

    protected removeTip(): void {
        this.cleanupAutoUPdate?.()
        this.cleanupAutoUPdate = null
        this.tipElement?.remove()
        this.element.removeAttribute('aria-describedby')
    }

    protected setContent(tip: HTMLElement): void {
        const inner = tip.querySelector<HTMLElement>('.tooltip-inner')
        if (!inner) {
            return
        }

        if(this.options.html){
            inner.innerHTML = this.getTitle()
        } else {
            inner.textContent = this.getTitle()
        }
    }

    protected getTitle(): string {
        const title = this.element.getAttribute('data-original-title') ?? this.element.getAttribute('title')
        if (title) {
            return title
        }

        return typeof this.options.title === 'function' ? this.options.title() : this.options.title
    }

    protected hasContent(): boolean {
        return this.getTitle().length > 0
    }

    protected getTipElement(): HTMLElement {
        if (this.tipElement) {
            return this.tipElement
        }

        const template = document.createElement('template')
        template.innerHTML = this.options.template.trim()
        const tip = template.content.firstElementChild
        if(!(tip instanceof HTMLElement)) {
            throw new Error('KUI tooltip template must contain one root element.')
        }

        this.tipElement = tip
        return tip
    }

    private bindTriggers(): void {
        this.options.trigger.split(' ').forEach((trigger) => {
            if (trigger === 'click') {
                this.listen(this.element, 'click', () => this.toggle())
            } else if(trigger === 'hover') {
                this.listen(this.element, 'mouseenter', () => this.show())
                this.listen(this.element, 'mouseleave', () => this.hide())
            } else if (trigger === 'focus') {
                this.listen(this.element, 'focusin', () => this.show())
                this.listen(this.element, 'focusout', () => this.hide())
            }
        })
    }

    private schedule(action: 'show' | 'hide'): void {
        this.clearScheduledAction()

        const delay = normalizeDelay(this.options.delay)[action]
        if(delay <= 0) {
            this[action]()
            return
        }

        this.timeoutId = window.setTimeout(() => {
            this.timeoutId = null
            this[action]()
        }, delay)
    }

    private clearScheduledAction(): void {
        if (this.timeoutId !== null){
            window.clearTimeout(this.timeoutId)
            this.timeoutId = null
        }
    }

    private fixTitle(): void {
        const title = this.element.getAttribute('title')
        if (title) {
            this.originalTitle = title
            this.element.setAttribute('data-original-title', title)
            this.element.setAttribute('title', '')
        }
    }

    private getContainer(): HTMLElement {
        if (this.options.container instanceof HTMLElement) {
            return this.options.container
        }
        if (typeof this.options.container === 'string') {
            return document.querySelector<HTMLElement>(this.options.container) ?? document.body
        }

        return this.element.parentElement ?? document.body
    }

    private updatePosition(tip: HTMLElement): void {
        this.cleanupAutoUPdate?.()
        this.cleanupAutoUPdate = autoUpdate(this.element, tip, () => {
            void computePosition(this.element, tip, {
                placement: this.options.placement,
                middleware: [offset(8), flip(), shift({padding: 8})]
            }).then(({ x, y }) => {
                Object.assign(tip.style, {
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`,
                })
            })
        })
    }
}

export function bindTooltipDataApi(root: Document = document): EventDisposer {
    return delegate(root, 'mouseenter', Tooltip.selector, (event, trigger) => {
        if (event.relatedTarget instanceof Node && trigger.contains(event.relatedTarget)) {
            return
        }
        if (getInstance<Tooltip>(trigger, Tooltip.componentName)) {
            return
        }
        Tooltip.getOrCreate(trigger).show()
    })
}

function normalizeDelay(delay: number | TooltipDelay): TooltipDelay {
    if (typeof delay === 'number') {
        return { show: delay, hide: delay }
    }
    return delay
}
