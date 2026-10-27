import { Component } from '../../core/component'
import { getElement, getSelectorFromElement, type ElementTarget } from '../../core/dom/elements'
import { getFocusableElements, trapFocus } from '../../core/dom/focus'
import { delegate, type EventDisposer } from '../../core/events'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions } from '../../core/options'

export interface ModalOptions {
    backdrop: boolean | 'static'
    keyboard: boolean
    show: boolean
}

export interface ModalProps extends ModalOptions {}

let modalId = 0

export class Modal extends Component<ModalOptions> {
    static readonly componentName = 'modal'
    static readonly selector = '.modal'
    static readonly triggerSelector = '[data-toggle="modal"], [data-kui-toggle="modal"]'
    static readonly dismissSelector = '[data-dismiss="modal"], [data-kui-dismiss="modal"]'
    static readonly defaults: ModalOptions = {
        backdrop: true,
        keyboard: true,
        show: false
    }

    private backdropElement: HTMLElement | null = null
    private originalParent: ParentNode | null = null
    private originalNextSibling: ChildNode | null = null
    private previouslyFocused: HTMLElement | null = null

    private constructor(element: HTMLElement, options: Partial<ModalOptions> = {}) {
        super(element, Modal.componentName, mergeOptions(Modal.defaults, options))
        this.bindEvents()

        if (this.options.show) {
            this.show()
        }
    }

    static getOrCreate(target: ElementTarget, options: Partial<ModalOptions> = {}): Modal {
        const element = getElement(target)
        return (getInstance<Modal>(element, Modal.componentName) ?? new Modal(element, {...readDataOptions<ModalOptions>(element), ...options}))
    }

    show(): void {
        if (this.isShown() || !this.emitCancelable(['show.kui.modal', 'kui:modal:show'])) {
            return
        }

        this.previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
        this.moveToBody()
        document.body.classList.add('modal-open')
        this.element.style.display = 'block'
        this.element.removeAttribute('aria-hidden')
        this.element.setAttribute('aria-modal', 'true')
        this.element.setAttribute('role', this.element.getAttribute('role') ?? 'dialog')
        this.element.tabIndex = this.element.tabIndex >=0 ? this.element.tabIndex : -1
        this.ensureAccessibleName()
        this.element.classList.add('in', 'show')

        if(this.options.backdrop) {
            this.showBackdrop()
        }

        this.focusFirstElement()
        this.emit('kui:modal:shown')
    }

    hide(): void {
        if (!this.isShown() || !this.emitCancelable(['hide.kui.modal', 'kui:modal:hide'])) {
            return
        }

        this.element.classList.remove('in', 'show')
        this.element.setAttribute('aria-hidden', 'true')
        this.element.removeAttribute('aria-modal')
        this.element.style.display = 'none'
        this.hideBackdrop()
        this.restorePosition()
        document.body.classList.remove('modal-open')
        this.previouslyFocused?.focus()
        this.emit('kui:modal:hidden')
    }

    toggle(): void {
        if(this.isShown()) {
            this.hide()
            return
        }

        this.show()
    }

    isShown(): boolean {
        return this.element.classList.contains('in') || this.element.classList.contains('show')
    }

    override dispose(): void {
        this.hideBackdrop()
        this.restorePosition()
        super.dispose()
    }

    private moveToBody(): void {
        if (this.element.parentNode === document.body) {
            return
        }

        this.originalParent = this.element.parentNode
        this.originalNextSibling = this.element.nextSibling
        document.body.append(this.element)
    }

    private restorePosition(): void {
        if (!this.originalParent) {
            return
        }

        this.originalParent.insertBefore(this.element, this.originalNextSibling)
        this.originalParent = null
        this.originalNextSibling = null
    }

    private bindEvents(): void {
        this.listen(this.element, 'click', (event) => {
            const target = event.target
            if (!(target instanceof Element)) {
                return
            }

            if(target.closest(Modal.dismissSelector)) {
                event.preventDefault()
                this.hide()
            }
        })

        this.listen(document, 'keydown', (event) => {
            if (!this.isShown()) {
                return
            }

            if(this.options.keyboard && event.key === 'Escape') {
                event.preventDefault()
                this.hide()
                return
            }

            trapFocus(event, this.element)
        })
    }

    private showBackdrop(): void {
        this.backdropElement = document.createElement('div')
        this.backdropElement.className = 'modal-backdrop fade in show'
        document.body.append(this.backdropElement)
        this.backdropElement.addEventListener('click', () => {
            if (this.options.backdrop !== 'static') {
                this.hide()
            } else {
                this.element.focus()
            }
        })
    }

    private hideBackdrop(): void{
        this.backdropElement?.remove()
        this.backdropElement = null
    }

    private focusFirstElement(): void {
        (getFocusableElements(this.element)[0] ?? this.element).focus()
    }

    private ensureAccessibleName(): void{
        if(this.element.hasAttribute('aria-label') || this.element.hasAttribute('aria-labelledby')) {
            return
        }

        const title = this.element.querySelector<HTMLElement>('.modal-title, [data-kui-modal-title]')
        if (!title) {
            return
        }

        title.id ||= `kui-modal-title-${++modalId}`
        this.element.setAttribute('aria-labelledby', title.id)
    }
}

export function bindModalDataApi(root: Document=document): EventDisposer {
    return delegate(root, 'click', Modal.triggerSelector, (event, trigger) => {
        const selector = getSelectorFromElement(trigger)
        if (!selector) {
            return
        }

        event.preventDefault()
        Modal.getOrCreate(selector).show()

    })
}
