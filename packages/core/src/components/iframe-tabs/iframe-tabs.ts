import { Component } from "../../core/component"
import { getSelectorFromElement } from "../../core/dom/elements"
import { getRovingFocusTarget, syncRovingTabIndex } from "../../core/dom/focus"
import { applyTabActiveRadiusStyles, type TabActiveRadiusOptions } from "../../core/dom/styles"
import { delegate, type EventDisposer } from '../../core/events'
import { getInstance } from "../../core/instances"
import { mergeOptions, readDataOptions, type PlainObject } from "../../core/options"

export interface IframeTabDescriptor extends PlainObject {
    id?: string,
    title: string,
    url: string,
    closable?: boolean
}

export interface IframeTabsOptions extends PlainObject, TabActiveRadiusOptions {
    navSelector: string
    contentSelector: string
    activeClass: string
    closeSelector: string
    persist: boolean
    storageKey: string
}

export interface IframeTabsProps extends IframeTabsOptions {}

interface IframeTabState extends IframeTabDescriptor {
    id: string
    item: HTMLElement
    pane: HTMLElement
    trigger: HTMLElement
}

let iframeTabsInstanceId = 0

export class IframeTabs extends Component<IframeTabsOptions> {
    static readonly componentName = 'iframeTabs'
    static readonly selector = '[data-kui-iframe-tabs], .kui-iframe-tabs'
    static readonly triggerSelector = 'a[data-iframe], [data-toggle="iframeTab"], [data-toggle="iframe-tab"], [data-kui-toggle="iframe-tab"]'
    static readonly defaults: IframeTabsOptions = {
        navSelector: '.kui-iframe-tabs__nav',
        contentSelector: '.kui-iframe-tabs__content',
        activeClass: 'active',
        closeSelector: '[data-kui-close-tab]',
        persist: true,
        storageKey: 'kui.iframe.kTabs'
    }

    private readonly tabs = new Map<string, IframeTabState>()
    private readonly nav: HTMLElement
    private readonly content: HTMLElement
    private readonly accessibilityId = ++iframeTabsInstanceId

    private constructor(element: HTMLElement, options: Partial<IframeTabsOptions> = {}) {
        super(element, IframeTabs.componentName, mergeOptions(IframeTabs.defaults, options))
        this.nav = this.ensureSlot(this.options.navSelector, 'ul', 'kui-iframe-tabs__nav nav')
        this.content = this.ensureSlot(this.options.contentSelector, 'div', 'kui-iframe-tabs__content')
        this.nav.setAttribute('role', 'tablist')
        this.bindKeyboardNavigation()
        this.restore()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<IframeTabsOptions> = {}): IframeTabs {
        const element = IframeTabs.resolveElement(target)
        return (getInstance<IframeTabs>(element, IframeTabs.componentName) ?? new IframeTabs(element, {...readDataOptions<IframeTabsOptions>(element), ...options}))
    }

    open(descriptor: IframeTabDescriptor): string {
        const id = descriptor.id ?? createStableId('iframe-tab', descriptor.url)
        const existing = this.tabs.get(id)
        if (existing) {
            this.activate(id)
            return id
        }

        const nextDescriptor = { ...descriptor, id}
        if (!this.emitCancelable(['add.kui.iframeTabs', 'kui:iframe-tabs:add'], nextDescriptor)) {
            return id
        }

        const item = document.createElement('li')
        item.className = 'kui-tabs__item'
        item.setAttribute('role', 'presentation')

        const trigger = document.createElement('a')
        trigger.href = `#{id}`
        trigger.id = `kui-iframe-tabs-${this.accessibilityId}-${id}-tab`
        trigger.textContent = descriptor.title
        trigger.setAttribute('data-kui-tab-id', id)
        trigger.setAttribute('role', 'tab')
        trigger.setAttribute('aria-controls', id)
        trigger.setAttribute('aria-selected', 'false')
        trigger.tabIndex = -1
        applyTabActiveRadiusStyles(trigger, this.options)
        item.append(trigger)

        if(descriptor.closable !== false) {
            const closeButton = document.createElement('button')
            closeButton.type = 'button'
            closeButton.className = 'close'
            closeButton.textContent = 'x'
            closeButton.setAttribute('aria-label', `Close ${descriptor.title}`)
            closeButton.setAttribute('data-kui-close-tab', id)
            closeButton.tabIndex = -1
            item.append(closeButton)
        }

        const pane =  document.createElement('div')
        pane.id =id
        pane.className = 'kui-iframe-tabs__pane tab-pane'
        pane.setAttribute('role', 'tabpanel')
        pane.setAttribute('aria-labelledby', trigger.id)
        pane.hidden = true

        const iframe = document.createElement('iframe')
        iframe.src = descriptor.url
        iframe.title = descriptor.title
        iframe.name = id
        pane.append(iframe)

        this.nav.append(item)
        this.content.append(pane)
        this.tabs.set(id, {...nextDescriptor, item, pane, trigger})
        this.bindTabItem(item, id)
        this.activate(id)
        this.persist()
        this.emit('kui:iframe-tabs:added', nextDescriptor)
        return id
    }

    activate(id: string): void {
        const tab = this.tabs.get(id)
        if(!tab || !this.emitCancelable(['show.kui.iframeTabs', 'kui:iframe-tabs:show'], tab)) {
            return
        }

        this.tabs.forEach((candidate) => {
            const isActive = candidate.id === id
            candidate.item.classList.toggle(this.options.activeClass, isActive)
            candidate.trigger.classList.toggle(this.options.activeClass, isActive)
            candidate.trigger.setAttribute('aria-selected', String(isActive))
            candidate.pane.classList.toggle(this.options.activeClass, isActive)
            candidate.pane.classList.toggle('in', isActive)
            candidate.pane.classList.toggle('show', isActive)
            candidate.pane.hidden = !isActive
        })
        syncRovingTabIndex(Array.from(this.tabs.values(), (candidate) => candidate.trigger), tab.trigger)

        this.emit('kui:iframe-tabs:shown', tab)
        this.persist()
    }

    close(id: string): void {
        const tab = this.tabs.get(id)
        if(!tab || !this.emitCancelable(['close.kui.iframeTabs', 'kui:iframe-tabs:close'], tab)) {
            return
        }

        const orderedTabs = Array.from(this.tabs.values())
        const closedIndex = orderedTabs.indexOf(tab)
        const fallback = orderedTabs[closedIndex + 1] ?? orderedTabs[closedIndex - 1]
        const wasActive = tab.item.classList.contains(this.options.activeClass)
        const hadFocus = tab.item.contains(document.activeElement)
        tab.item.remove()
        tab.pane.remove()
        this.tabs.delete(id)

        if(wasActive && fallback) {
            this.activate(fallback.id)
        }
        if(hadFocus) {
            fallback?.trigger.focus()
        }

        this.persist()
        this.emit('kui:iframe-tabs:closed', tab)
    }

    reload(id= this.getActiveId()):void {
        if (!id) {
            return
        }

        const tab = this.tabs.get(id)
        const iframe = tab?.pane.querySelector<HTMLIFrameElement>('iframe')
        if (!tab || !iframe) {
            return
        }

        iframe.src = tab.url
        this.emit('kui:iframe-tabs:reloaded', tab)
    }

    closeOthers(keepId = this.getActiveId()): void {
        if (!keepId) {
            return
        }

        this.getTabs().forEach((tab) => {
            if (tab.id && tab.id !== keepId && tab.closable !==false ) {
                this.close(tab.id)
            }
        })
    }

    closeAll(): void {
        this.getTabs().forEach((tab) => {
            if (tab.id && tab.closable !== false) {
                this.close(tab.id)
            }
        })
    }

    getActiveId(): string | null {
        return Array.from(this.tabs.values()).find((tab) => tab.item.classList.contains(this.options.activeClass))?.id ?? null
    }

    getTabs(): IframeTabDescriptor[] {
        return Array.from(this.tabs.values()).map(({id, title, url, closable}) => ({id, title, url, closable }))
    }

    private bindTabItem(item: HTMLElement, id: string):void {
        this.listen(item, 'click', (event) => {
            const target = event.target
            if (!(target instanceof Element)) {
                return
            }

            const closeButton = target.closest<HTMLElement>(this.options.closeSelector)
            if (closeButton) {
                event.preventDefault()
                this.close(closeButton.dataset.kuiCloseTab ?? id)
                return
            }

            event.preventDefault()
            this.activate(id)
        })
    }

    private bindKeyboardNavigation():void {
        this.listen(this.nav, 'keydown', (event) => {
            const current = event.target instanceof Element ? event.target.closest<HTMLElement>('[role="tab"]') : null
            if (!current) {
                return
            }

            const currentId = current.dataset.kuiTabId
            const currentTab = currentId ? this.tabs.get(currentId) : undefined
            if (event.key === 'Delete' && currentTab?.closable !== false && currentId) {
                event.preventDefault()
                this.close(currentId)
                return
            }

            const triggers = Array.from(this.tabs.values(), (tab) => tab.trigger)
            const target = getRovingFocusTarget(event, triggers, current, { orientation: 'horizontal'})
            const targetId = target?.dataset.kuiTabId
            if (!target || !targetId) {
                return
            }

            event.preventDefault()
            target.focus()
            this.activate(targetId)
        })
    }

    private ensureSlot(selector: string, tagName: string, className: string): HTMLElement {
        const existing = this.element.querySelector<HTMLElement>(selector)
        if (existing) {
            return existing
        }

        const slot = document.createElement(tagName)
        slot.className = className
        this.element.append(slot)
        return slot
    }

    private persist(): void {
        if (!this.options.persist){
            return
        }

        window.localStorage?.setItem(
            this.options.storageKey,
            JSON.stringify({ activeId: this.getActiveId(), tabs: this.getTabs() })
        )
    }

    private restore(): void {
        if (!this.options.persist){
            return
        }

        try{
            const state = JSON.parse(window.localStorage?.getItem(this.options.storageKey) ?? '{}') as {
                activeId?: string
                tabs?: IframeTabDescriptor[]
            }
            state.tabs?.forEach((tab) => this.open(tab))
            if (state.activeId) {
                this.activate(state.activeId)
            }
        } catch {
            window.localStorage?.removeItem(this.options.storageKey)
        }
    }
}

export function bindIframeTabsDataApi(root: Document = document): EventDisposer {
    return delegate(root, 'click', IframeTabs.triggerSelector, (event, trigger) => {
        const containerSelector = trigger.getAttribute('data-kui-container') ?? trigger.getAttribute('data-iframe') ?? getSelectorFromElement(trigger)
        const container = containerSelector ? document.querySelector<HTMLElement>(containerSelector) : trigger.closest<HTMLElement>(IframeTabs.selector) ?? document.querySelector<HTMLElement>(IframeTabs.selector)
        const url = trigger.dataset.url ?? trigger.getAttribute('href')
        if (!container || !url || url.startsWith('#')) {
            return
        }

        event.preventDefault()
        IframeTabs.getOrCreate(container).open({
            id: trigger.dataset.id,
            title: trigger.dataset.title ?? trigger.textContent?.trim() ?? url,
            url,
            closable: trigger.dataset.closable !== 'false'
        })
    })
}


function createStableId(prefix: string, source: string): string {
    let hash = 0
    for (let index=0; index < source.length; index+=1) {
        hash = ((hash << 5) - hash) + source.charCodeAt(index)
        hash |= 0
    }

    return `${prefix}-${Math.abs(hash).toString(36)}`
}
