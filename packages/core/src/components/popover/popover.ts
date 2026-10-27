import { Tooltip, type TooltipOptions } from "../tooltip"
import { getInstance } from '../../core/instances'
import { readDataOptions, type PlainObject } from '../../core/options'
import { delegate, type EventDisposer } from '../../core/events'
import { setHtmlContent, type HtmlSanitizer } from '../../core/content'

export interface PopoverOptions extends TooltipOptions {
    content: string | HTMLElement | (() => string | HTMLElement)
    mode: 'auto' | 'tooltip' | 'dialog'
    sanitizer?: HtmlSanitizer
}

export type PopoverProps = PopoverOptions

export class Popover extends Tooltip {
    static readonly componentName = 'popover'
    static readonly selector  = '[data-toggle="popover"], [data-kui-toggle="popover"]'
    static readonly defaults: PopoverOptions = {
        ...Tooltip.defaults,
        mode: 'auto',
        content: '',
        placement: 'right',
        template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>',
        trigger: 'click',
    }

    private contentNode: HTMLElement | null = null
    private contentParent: Node | null = null
    private contentNextSibling: Node | null = null

    private constructor(element: HTMLElement, options: Partial<PopoverOptions> = {}) {
        super(element, {...Popover.defaults, ...options }, Popover.componentName)
        this.listen(document, 'keydown', (event) => {
            if (event.key === 'Escape' && this.getOpenTip()?.getAttribute('role') === 'dialog') {
                event.preventDefault()
                if(this.hide() && this.element.isConnected) this.element.focus()
            }
        })
        this.listen(document, 'pointerdown', (event) => {
            const tip = this.getOpenTip()
            if(tip?.getAttribute('role') === 'dialog' && event.target instanceof Node && !tip.contains(event.target) && !this.element.contains(event.target)) {
                const restoreFocus = tip.contains(document.activeElement)
                if(this.hide() && restoreFocus) {
                    queueMicrotask(() => {
                        if (this.element.isConnected && (document.activeElement === document.body || document.activeElement === null)) {
                            this.element.focus()
                        }
                    })
                }
            }
        })
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<PopoverOptions> = {}): Popover {
        const element = Popover.resolveElement(target)
        return (
            getInstance<Popover>(element, Popover.componentName) ?? new Popover(element, {...readDataOptions<PopoverOptions>(element), ...options})
        )
    }

    protected override setContent(tip: HTMLElement): void {
        const title = tip.querySelector<HTMLElement>('.popover-title')
        const content = tip.querySelector<HTMLElement>('.popover-content')
        const popoverContent = this.getContent()

        if(title) {
            title.textContent = this.getTitle()
            title.hidden = title.textContent.length === 0
            title.id ||=`${tip.id}-title`
        }

        if(!content) {
            return
        }

        content.replaceChildren()
        if (popoverContent instanceof HTMLElement) {
            if (this.contentNode !== popoverContent) {
                this.restoreContentNode()
                this.contentNode = popoverContent
                this.contentParent = popoverContent.parentNode
                this.contentNextSibling = popoverContent.nextSibling
            }
            content.append(popoverContent)
        } else if ((this.options as PopoverOptions).html) {
            setHtmlContent(content, popoverContent, { component: 'popover', source: 'custom'}, (this.options as PopoverOptions).sanitizer)
        } else {
            content.textContent = popoverContent
        }
    }

    override show(): boolean {
        if(!super.show()) return false
        const tip = this.getOpenTip()
        if(!tip) return false
        const mode = this.resolveMode(tip)
        tip.setAttribute('role', mode)
        if (mode === 'dialog') {
            const title = tip.querySelector<HTMLElement>('.popover-title:not([hidden])')
            if (title?.id) tip.setAttribute('aria-labelledby', title.id)
            else tip.setAttribute('aria-label', this.element.getAttribute('aria-label') ?? '弹出内容')
            this.element.removeAttribute('aria-describedby')
            this.element.setAttribute('aria-haspopup', 'dialog')
            this.element.setAttribute('aria-controls', tip.id)
            this.element.setAttribute('aria-expanded', 'true')
            const initialFocus = tip.querySelector<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
            if (initialFocus) initialFocus.focus()
            else { tip.tabIndex = -1; tip.focus()}
        }
        this.emit('kui:popover:show')
        return true
    }

    override hide(): boolean {
        if(!super.hide()) return false
        this.element.removeAttribute('aria-controls')
        this.element.removeAttribute('aria-expanded')
        this.element.removeAttribute('aria-haspopup')
        this.emit('kui:popover:hidden')
        return true
    }

    protected override removeTip(): void {
        super.removeTip()
        this.restoreContentNode()
        this.element.removeAttribute('aria-controls')
        this.element.removeAttribute('aria-expanded')
        this.element.removeAttribute('aria-haspopup')
    }

    protected override getTipElement(): HTMLElement {
        const tip = super.getTipElement()
        tip.classList.add('popover')
        return tip
    }

    protected override hasContent(): boolean {
        const content = this.getContent()
        return super.hasContent() || (content instanceof HTMLElement ? content.childNodes.length > 0 : content.length > 0)
    }

    private getContent(): string | HTMLElement {
        const dataContent = this.element.getAttribute('data-content')
        const optionContent = (this.options as PopoverOptions).content
        if(dataContent){
            return dataContent
        }
        return typeof optionContent === 'function' ? optionContent() : optionContent
    }

    private getOpenTip(): HTMLElement | null {
        const id = this.element.getAttribute('aria-controls') ?? this.element.getAttribute('aria-describedby')
        return id ? document.getElementById(id) : null
    }

    private resolveMode(tip: HTMLElement): 'tooltip' | 'dialog' {
        const mode = (this.options as PopoverOptions).mode
        if(mode !== 'auto') return mode
        return (this.options as PopoverOptions).trigger.includes('click') || Boolean(tip.querySelector('a[href], button, input, select, textarea')) ? 'dialog' : 'tooltip'
    }

    private restoreContentNode(): void {
        if (!this.contentNode || !this.contentParent?.isConnected) {
            this.contentNode = null
            this.contentParent = null
            this.contentNextSibling = null
            return
        }
        if(this.contentNextSibling?.parentNode === this.contentParent) {
            this.contentParent.insertBefore(this.contentNode, this.contentNextSibling)
        }else{
            this.contentParent.appendChild(this.contentNode)
        }
        this.contentNode = null
        this.contentParent = null
        this.contentNextSibling = null
    }
}

export function bindPopoverDataApi(root: Document = document): EventDisposer {
    return delegate(root, 'click', Popover.selector, (event, trigger) => {
        const instance = getInstance<Popover>(trigger, Popover.componentName)
        if(instance) {
            return
        }
        event.preventDefault()
        Popover.getOrCreate(trigger).toggle()
    })
}

export type { PlainObject }
////////////////////////
