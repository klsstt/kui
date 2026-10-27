import { Component } from "../../core/component"
import { delegate, type EventDisposer } from "../../core/events"
import { getInstance } from "../../core/instances"
import { mergeOptions, readDataOptions, type PlainObject } from "../../core/options"

export interface PanelOptions extends PlainObject {
    loadingClass: string
}

export class Panel extends Component<PanelOptions> {
    static readonly componentName = 'panel'
    static readonly selector = '.panel'
    static readonly actionSelector = '[data-toggle="panel-fullscreen"], [data-toggle="panel-collapse"], [data-toggle="panel-close"], [data-toggle="panel-refresh"], [data-kui-toggle="panel-fullscreen"], [data-kui-toggle="panel-collapse"], [data-kui-toggle="panel-close"], [data-kui-toggle="panel-refresh"]'
    static readonly defaults: PanelOptions = {
        loadingClass: 'is-loading'
    }

    private constructor(element: HTMLElement, options: Partial<PanelOptions> = {}) {
        super(element, Panel.componentName, mergeOptions(Panel.defaults, options))
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<PanelOptions> = {}): Panel {
        const element = Panel.resolveElement(target)
        return (
            getInstance<Panel>(element, Panel.componentName) ?? new Panel(element, {...readDataOptions<PanelOptions>(element), ...options})
        )
    }

    load(html: string): void {
        const body = this.element.querySelector<HTMLElement>('.panel-body')
        if (body) {
            body.innerHTML = html
        }
    }

    done(): void {
        this.element.classList.remove(this.options.loadingClass)
        this.emit('loading.done.uikit.panel')
        this.emit('kui:panel:loading-done')
    }

    refresh(html?: string): void {
        this.element.classList.add(this.options.loadingClass)
        if (html) {
            this.load(html)
        }
        this.done()
    }

    toggleContent(): void {
        if (this.element.classList.contains('is-collapse')){
            this.showContent()
            return
        }
        this.hideContent()
    }

    showContent(): void {
        this.element.classList.remove('is-collapse')
        this.swapActionIcon('panel-collapse', 'fa-plus', 'fa-minus')
        this.emit('show.kui.panel')
        this.emit('kui:panel:show')
    }

    hideContent(): void {
        this.element.classList.add('is-collapse')
        this.swapActionIcon('panel-collapse', 'fa-minus', 'fa-plus')
        this.emit('hidden.uikit.panel')
        this.emit('kui:panel:hidden')
    }

    toggleFullscreen(): void {
        if (this.element.classList.contains('is-fullscreen')) {
            this.leaveFullscreen()
            return
        }

        this.enterFullscreen()
    }

    enterFullscreen(): void {
        this.element.classList.add('is-fullscreen')
        this.swapActionIcon('panel-fullscreen', 'fa-expand', 'fa-compress')
        this.emit('enter.fullscreen.uikit.panel')
        this.emit('kui:panel:fullscreen-enter')
    }

    leaveFullscreen(): void {
        this.element.classList.remove('is-fullscreen')
        this.swapActionIcon('panel-fullscreen', 'fa-compress', 'fa-expand')
        this.emit('leave.fullscreen.uikit.panel')
        this.emit('kui:panel:fullscreen-leave')
    }

    toggle(): void {
        if (this.element.classList.contains('is-close')) {
            this.open()
            return
        }
        this.close()
    }

    open(): void {
        this.element.classList.remove('is-close')
        this.emit('open.uikit.panel')
        this.emit('kui:panel:open')
    }

    close():void {
        this.element.classList.add('is-close')
        this.emit('close.uikit.panel')
        this.emit('kui:panel:close')
    }

    private swapActionIcon(action: string, from: string, to :string): void {
        this.element.querySelectorAll<HTMLElement>(`[data-toggle="${action}"], [data-kui-toggle="${action}"]`).forEach((element) => {
            element.classList.remove(from)
            element.classList.add(to)
        })
    }
}

export function bindPanelDataApi(root: Document = document): EventDisposer {
    return delegate(root, 'click', Panel.actionSelector, (event, trigger) => {
        event.preventDefault()
        const panelElement = trigger.closest<HTMLElement>(Panel.selector)
        if(!panelElement){
            return
        }

        const panel = Panel.getOrCreate(panelElement)
        const action = trigger.dataset.kuiToggle ?? trigger.dataset.toggle
        if(action === 'panel-fullscreen') {
            panel.toggleFullscreen()
        } else if(action === 'panel-collapse') {
            panel.toggleContent()
        } else if(action === 'panel-close') {
            panel.close()
        } else if(action === 'panel-refresh') {
            panel.refresh(trigger.dataset.load)
        }
    })
}
