import { Component } from '../../core/component'
import { createHtmlContentNode, type HtmlContent, type HtmlSanitizer } from '../../core/content'
import { getSelectorFromElement } from '../../core/dom/elements'
import { delegate, type EventDisposer } from '../../core/events'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'
import { Modal } from '../modal'

export type ModalTriggerType = 'custom' | 'ajax' | 'iframe'
export type ModalTriggerFetcher = (url: string) => Promise<HtmlContent>

export interface ModalTriggerOptions extends PlainObject {
    backdrop: boolean
    className: string
    custom?: HtmlContent | (() => HtmlContent)
    fade: boolean
    fetcher: ModalTriggerFetcher
    height: string
    iframe?: string | boolean
    keyboard: boolean
    name: string
    remote?: string | boolean
    sanitizer?: HtmlSanitizer
    show: boolean
    showHeader: boolean
    size: '' | 'md' | 'sm' | 'lg' | 'fullscreen'
    title: string
    type: ModalTriggerType
    url: string
    width: string
}

export interface ModalTriggerProps extends ModalTriggerOptions {}

export class ModalTrigger extends Component<ModalTriggerOptions> {
    static readonly componentName = 'modalTrigger'
    static readonly selector = '[data-toggle="modal"], [data-kui-toggle="modal"]'
    static readonly defaults: ModalTriggerOptions = {
        backdrop: true,
        className: '',
        fade: true,
        fetcher: defaultFetcher,
        height: 'auto',
        keyboard: true,
        name: 'triggerModal',
        show: false,
        showHeader: true,
        size: '',
        title: '',
        type: 'custom',
        url: '',
        width: 'auto'
    }

    private modalElement: HTMLElement | null = null

    private constructor(element: HTMLElement, options: Partial<ModalTriggerOptions> = {}) {
        super(element, ModalTrigger.componentName, mergeOptions(ModalTrigger.defaults, options))

        if(this.options.show){
            void this.show()
        }
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<ModalTriggerOptions> = {}): ModalTrigger {
        const element = ModalTrigger.resolveElement(target)
        return (
            getInstance<ModalTrigger>(element, ModalTrigger.componentName) ??
            new ModalTrigger(element, {
                title: element.getAttribute('title') ?? element.textContent?.trim() ?? '',
                url: element.getAttribute('href') ?? element.dataset.url ?? '',
                type: element.classList.contains('iframe') ? 'iframe' : 'custom',
                ...readDataOptions<ModalTriggerOptions>(element),
                ...options
            })
        )
    }

    async show(options: Partial<ModalTriggerOptions> = {}): Promise<void> {
        this.options = this.normalizeOptions(mergeOptions(this.options, options))
        if (!this.emitCancelable(['show.kui.modalTrigger', 'kui:modalTrigger:show'], this.options)) {
            return
        }

        const modalElement = this.createModalElement()
        const body = modalElement.querySelector<HTMLElement>('.modal-body')
        if (!body) {
            return
        }

        body.replaceChildren(await this.resolveContent())
        const modal = Modal.getOrCreate(modalElement, {
            backdrop: this.options.backdrop,
            keyboard: this.options.keyboard,
            show: false
        })
        modal.show()
        this.emit('kui:modalTrigger:shown', this.options)
    }

    close(): void {
        if(!this.modalElement) {
            return
        }

        Modal.getOrCreate(this.modalElement).hide()
        this.emit('kui:modal-trigger:hidden', this.options)
    }

    hide(): void {
        this.close()
    }

    toggle(options: Partial<ModalTriggerOptions> = {}): void {
        if (this.modalElement?.classList.contains('show') || this.modalElement?.classList.contains('in')) {
            this.close()
            return
        }

        void this.show(options)
    }

    private normalizeOptions(options: ModalTriggerOptions): ModalTriggerOptions {
        if (options.remote) {
            options.type = 'ajax'
            if (typeof options.remote === 'string') {
                options.url = options.remote
            }
        }else if (options.iframe) {
            options.type = 'iframe'
            if(typeof options.iframe === 'string'){
                options.url = options.iframe
            }
        } else if (options.url && options.type === 'custom'){
            options.type = 'ajax'
        }

        return options
    }

    private createModalElement(): HTMLElement {
        this.modalElement?.remove()

        const modal = document.createElement('div')
        modal.id = this.options.name
        modal.className = ['modal', 'modal-trigger', this.options.fade ? 'fade' : '', this.options.className].filter(Boolean).join(' ')
        modal.tabIndex = -1

        const dialogElement = document.createElement('div')
        dialogElement.className = `modal-dialog${this.options.size ? ` modal-${this.options.size}` : ''}`
        const contentElement = document.createElement('div')
        contentElement.className = 'modal-content'
        const headerElement = document.createElement('div')
        headerElement.className = 'modal-header'
        const closeButton = document.createElement('button')
        closeButton.type = 'button'
        closeButton.className = 'close'
        closeButton.textContent = 'x'
        closeButton.setAttribute('data-dismiss', 'modal')
        closeButton.setAttribute('aria-label', 'Close')
        const titleElement = document.createElement('h4')
        titleElement.className = 'modal-title'
        const titleNameElement = document.createElement('span')
        titleNameElement.className = 'modal-title-name'
        titleElement.append(titleNameElement)
        headerElement.append(closeButton, titleElement)
        const bodyElement = document.createElement('div')
        bodyElement.className = 'modal-body'
        contentElement.append(headerElement, bodyElement)
        dialogElement.append(contentElement)
        modal.append(dialogElement)

        const dialog = modal.querySelector<HTMLElement>('.modal-dialog')
        const header = modal.querySelector<HTMLElement>('.modal-header')
        const title = modal.querySelector<HTMLElement>('.modal-title-name')

        if(dialog) {
            if(this.options.width !== 'auto') {
                dialog.style.width = this.options.width
            }

            if(this.options.height !== 'auto'){
                dialog.style.height = this.options.height
            }
        }
        if (header) {
            header.hidden = !this.options.showHeader
        }
        if (title) {
            title.textContent = this.options.title
        }

        document.body.append(modal)
        this.modalElement = modal
        return modal
    }

    private async resolveContent(): Promise<Node> {
        if (this.options.type === 'iframe') {
            const iframe = document.createElement('iframe')
            iframe.src = this.options.url
            iframe.title = this.options.title || this.options.url
            iframe.className = 'modal-trigger-iframe'
            return iframe
        }

        if (this.options.type === 'ajax' && this.options.url) {
            const content = await this.options.fetcher(this.options.url)
            this.emit('kui:modal-trigger:loaded', { type: 'ajax', url: this.options.url })
            return createHtmlContentNode(content, {
                component: ModalTrigger.componentName,
                source: 'remote',
                url: this.options.url,
            }, this.options.sanitizer)
        }

        const custom = this.options.custom
        if (typeof custom === 'function') {
            return createHtmlContentNode(custom(), {
                component: ModalTrigger.componentName,
                source: 'custom',
            }, this.options.sanitizer)
        }
        if(custom instanceof HTMLElement) {
            return custom.cloneNode(true)
        }
        if(typeof custom === 'string') {
            const selected = custom.trim().startsWith('<') ? null : safeQuerySelector(custom)
            if (selected instanceof HTMLTemplateElement) {
                return selected.content.cloneNode(true)
            }
            if(selected) {
                return selected.cloneNode(true)
            }
            return createHtmlContentNode(custom, {
                component: ModalTrigger.componentName,
                source: 'custom',
            }, this.options.sanitizer)
        }

        if(custom instanceof Node) {
            return custom.cloneNode(true)
        }

        if(custom) {
            return createHtmlContentNode(custom, {
                component: ModalTrigger.componentName,
                source: 'custom',
            }, this.options.sanitizer)
        }

        return document.createTextNode('')
    }
}

function safeQuerySelector(selector: string): HTMLElement | null {
    try {
        return document.querySelector<HTMLElement>(selector)
    } catch {
        return null
    }
}

export function bindModalTriggerDataApi(root: Document = document): EventDisposer {
    return delegate(root, 'click', ModalTrigger.selector, (event, trigger) => {
        const selector = getSelectorFromElement(trigger)
        if (selector && document.querySelector(selector)) {
            return
        }

        event.preventDefault()
        ModalTrigger.getOrCreate(trigger).toggle({show: true})
    })
}

async function defaultFetcher(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    if (!response.ok) {
        throw new Error(`KUI modal trigger request failed: ${response.status}`)
    }
    return response.text()
}
