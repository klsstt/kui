import { Component } from "../../core/component"
import { setHtmlContent, type HtmlContent, type HtmlSanitizer } from "../../core/content"
import { getSelectorFromElement } from "../../core/dom/elements"
import { getRovingFocusTarget, syncRovingTabIndex } from "../../core/dom/focus"
import { applyTabActiveRadiusStyles, type TabActiveRadiusOptions } from "../../core/dom/styles"
import { delegate, type EventDisposer } from '../../core/events'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export type PjaxFetcher = (url: string) => Promise<HtmlContent>

export interface PjaxTabDescriptor extends PlainObject {
    id?: string
    title: string
    url: string
    closable?: boolean
}

export interface PjaxTabsOptions extends PlainObject, TabActiveRadiusOptions {
    navSelector: string
    contentSelector: string
    activeClass: string
    closeSelector: string
    loadingTemplate: HtmlContent
    errorTemplate: HtmlContent
    fetcher: PjaxFetcher
    sanitizer?: HtmlSanitizer
    persist: boolean
    storageKey: string
}

export interface PjaxTabsProps extends PjaxTabsOptions {}

interface PjaxTabState extends PjaxTabDescriptor {
    id: string
    item: HTMLElement
    pane: HTMLElement
    trigger: HTMLElement
    generation: number
}

let pjaxTabsInstanceId = 0

export class PjaxTabs extends Component<PjaxTabsOptions> {
    static readonly componentName = 'pjaxTabs'
    static readonly selector = '[data-kui-pjax-tabs], .kui-pajx-tabs'
    static readonly triggerSelector = 'a[data-pjax], [data-toggle="pjax"], [data-toggle="pjaxTab"], [data-toggle="pjax-tab"], [data-kui-toggle="pjax-tab"]'
    static readonly defaults: PjaxTabsOptions = {
        navSelector: '.kui-pjax-tabs__nav',
        contentSelector: '.kui-pjax-tabs__content',
        activeClass: 'active',
        closeSelector: '[data-kui-close-tab]',
        loadingTemplate: '<div class="kui-tabs__loading">Loading...</div>',
        errorTemplate: '<div class="kui-tabs__error">Error loading tab content</div>',
        fetcher: defaultPjaxFetcher,
        persist: false,
        storageKey: 'kui.pjax.kTabs'
    }

    private readonly tabs = new Map<string, PjaxTabState>()
    private readonly nav: HTMLElement
    private readonly content: HTMLElement
    private readonly accessibilityId = ++pjaxTabsInstanceId

    private constructor(element: HTMLElement, options: Partial<PjaxTabsOptions> = {}) {
        super(element, PjaxTabs.componentName, mergeOptions(PjaxTabs.defaults, options))

        this.nav = this.ensureSlot(this.options.navSelector, 'ul', 'kui-pjax-tabs__nav nav')
        this.content = this.ensureSlot(this.options.contentSelector, 'div', 'kui-pajx-tabs__content')
        this.nav.setAttribute('role', 'toolbar')
        this.nav.setAttribute('aria-label', '标签页')
        this.bindKeyboardNavigation()
        void this.restore()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<PjaxTabsOptions> = {}): PjaxTabs {
        const element = PjaxTabs.resolveElement(target)
        return (
            getInstance<PjaxTabs>(element, PjaxTabs.componentName) ?? new PjaxTabs(element, {
                ...readDataOptions<PjaxTabDescriptor>(element),
                ...options
            })
        )
    }

    async open(descriptor: PjaxTabDescriptor): Promise<string> {
        const id = descriptor.id ?? createStableId('pjax-tab', descriptor.url)
        const existing = this.tabs.get(id)
        if (existing) {
            this.activate(id)
            return id
        }

        const nextDescriptor = { ...descriptor, id }
        if (!this.emit('kui:pjax-tabs:add', nextDescriptor)) {
            return id
        }

        const item = document.createElement('li')
        item.className = 'kui-tabs__item'
        item.setAttribute('role', 'presentation')

        const trigger = document.createElement('a')
        trigger.href = `#{id}`
        trigger.id = `kui-pjax-tabs-${this.accessibilityId}-${id}-tab`
        trigger.textContent = descriptor.title
        trigger.setAttribute('data-kui-tab-id', id)
        trigger.setAttribute('role', 'button')
        trigger.setAttribute('aria-controls', id)
        trigger.setAttribute('aria-pressed', 'false')
        trigger.tabIndex = -1
        applyTabActiveRadiusStyles(trigger, this.options)
        item.append(trigger)

        if(descriptor.closable !== false) {
            const closeButton = document.createElement('button')
            closeButton.type = 'button'
            closeButton.className = 'close'
            closeButton.textContent = 'x'
            closeButton.setAttribute('aria-label', `关闭 ${descriptor.title}`)
            closeButton.setAttribute('data-kui-close-tab', id)
            item.append(closeButton)
        }

        const  pane = document.createElement('div')
        pane.id = id
        pane.className = 'kui-pjax-tabs__pane tab-pane'
        pane.setAttribute('role', 'region')
        pane.setAttribute('aria-labelledby', trigger.id)
        pane.hidden = true

        this.nav.append(item)
        this.content.append(pane)
        const tab: PjaxTabState = { ...nextDescriptor, item, pane, trigger, generation: 0 }
        this.tabs.set(id, tab)
        this.bindTabItem(item, id)
        this.activate(id)
        await this.load(tab)
        this.persist()
        return id
    }

    activate(id: string): void {
        const tab = this.tabs.get(id)
        if (!tab || !this.emit('kui:pjax-tabs:show', tab)){
            return
        }

        this.tabs.forEach((candidate) => {
            const isActive = candidate.id === id
            candidate.item.classList.toggle(this.options.activeClass, isActive)
            candidate.trigger.classList.toggle(this.options.activeClass, isActive)
            candidate.trigger.setAttribute('aria-pressed', String(isActive))
            candidate.pane.classList.toggle(this.options.activeClass, isActive)
            candidate.pane.classList.toggle('in', isActive)
            candidate.pane.classList.toggle('show', isActive)
            candidate.pane.hidden = !isActive
        })
        syncRovingTabIndex(Array.from(this.tabs.values(), (candidate) => candidate.trigger), tab.trigger)

        this.emit('kui:pjax-tabs:show', tab)
        this.persist()
    }

    close(id:string): void {
        const tab = this.tabs.get(id)
        if (!tab || !this.emit('kui:pjax-tabs:close', tab)) {
            return
        }

        const orderedTabs = Array.from(this.tabs.values())
        const closeIndex = orderedTabs.indexOf(tab)
        const fallback = orderedTabs[closeIndex + 1] ?? orderedTabs[closeIndex - 1]
        const wasActive = tab.item.classList.contains(this.options.activeClass)
        const hadFocus = tab.item.contains(document.activeElement)
        tab.generation += 1
        tab.item.remove()
        tab.pane.remove()
        this.tabs.delete(id)

        if (wasActive && fallback) {
            this.activate(fallback.id)
        }

        if(hadFocus) {
            fallback?.trigger.focus()
        }

        this.persist()
        this.emit('kui:pjax-tabs:closed', tab)
    }

    async reload(id=this.getActiveId()): Promise<void> {
        const tab = id ? this.tabs.get(id): undefined
        if (tab) {
            await  this.load(tab)
        }
    }

    closeOthers(keepId = this.getActiveId()): void {
        if (!keepId) {
            return
        }
        this.getTabs().forEach((tab) => {
            if (tab.id && tab.id !== keepId && tab.closable !== false) {
                this.close(tab.id)
            }
        })
    }

    closeAll(): void {
        this.getTabs().forEach((tab) => {
            if(tab.id && tab.closable !== false) {
                this.close(tab.id)
            }
        })
    }

    getActiveId(): string | null {
        return Array.from(this.tabs.values()).find((tab) => tab.item.classList.contains(this.options.activeClass))?.id ?? null
    }

    getTabs(): PjaxTabDescriptor[] {
        return Array.from(this.tabs.values()).map(({id, title, url, closable}) => ({id, title, url, closable}))
    }

    private async load(tab: PjaxTabState): Promise<void> {
        const generation = ++tab.generation
        try {
            setHtmlContent(tab.pane, this.options.loadingTemplate, {
                component: PjaxTabs.componentName,
                source: 'loading',
                url: tab.url,
            }, this.options.sanitizer)
            const content = await this.options.fetcher(tab.url)
            if (!this.isCurrentLoad(tab, generation)) {
                return
            }
            setHtmlContent(tab.pane, content, {
                component: PjaxTabs.componentName,
                source: 'remote',
                url: tab.url,
            }, this.options.sanitizer)
            this.emit('kui:pjax-tabs:loaded', tab)
        }catch(error){
            if(!this.isCurrentLoad(tab, generation)) {
                return
            }
            try{
                setHtmlContent(tab.pane, this.options.errorTemplate, {
                    component: PjaxTabs.componentName,
                    source: 'error',
                    url: tab.url,
                }, this.options.sanitizer)

            }catch{
                tab.pane.textContent = 'Load failed.'
            }
            this.emit('kui:pjax-tabs:error', { ...tab, error })
        }
    }

    private isCurrentLoad(tab: PjaxTabState, generation: number): boolean {
        return this.tabs.get(tab.id) === tab && tab.generation === generation && tab.pane.isConnected
    }

    private bindTabItem(item: HTMLElement, id: string): void {
        this.listen(item, 'click', (event) => {
            const target = event.target
            if (!(target instanceof Element)) {
                return
            }
            const closeButton = target.closest<HTMLElement>(this.options.closeSelector)
            if(closeButton){
                event.preventDefault()
                this.close(closeButton.dataset.kuiCloseTab ?? id)
                return
            }
            event.preventDefault()
            this.activate(id)
        })
    }

    private bindKeyboardNavigation(): void {
        this.listen(this.nav, 'keydown', (event) => {
            const current = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-kui-tab-id]') : null
            if (!current) {
                return
            }
            const currentId = current.dataset.kuiTabId
            const currentTab = currentId ? this.tabs.get(currentId) : undefined
            if(event.key === 'Delete' && currentTab?.closable !== false && currentId) {
                event.preventDefault()
                this.close(currentId)
                return
            }
            const triggers = Array.from(this.tabs.values(), (tab) => tab.trigger)
            const target = getRovingFocusTarget(event, triggers, current, { orientation: 'horizontal'})
            const targetId = target?.dataset.kuiTabId
            if(!target || !targetId) {
                return
            }
            event.preventDefault()
            target.focus()
            this.activate(targetId)
        })
    }

    private ensureSlot(selector: string, tagName: string, className: string): HTMLElement {
        const existing = this.element.querySelector<HTMLElement>(selector)
        if(existing){
            return existing
        }
        const slot = document.createElement(tagName)
        slot.className = className
        this.element.append(slot)
        return slot
    }

    private persist():void{
        if (!this.options.persist){
            return
        }
        window.localStorage?.setItem(
            this.options.storageKey,
            JSON.stringify({activeId: this.getActiveId(), tabs: this.getTabs() })
        )
    }
    private async restore(): Promise<void> {
        if (!this.options.persist){
            return
        }
        try{
            const state = JSON.parse(window.localStorage?.getItem(this.options.storageKey) ?? '{}') as {
                activeId?: string
                tabs?: PjaxTabDescriptor[]
            }
            for (const tab of state.tabs ?? []){
                await this.open(tab)
            }
            if(state.activeId) {
                this.activate(state.activeId)
            }
        }catch{
            window.localStorage?.removeItem(this.options.storageKey)
        }
    }
}

export function bindPjaxTabsDataApi(root: Document = document): EventDisposer {
    return delegate(root, 'click', PjaxTabs.triggerSelector, (event, trigger) => {
        const containerSelector = trigger.getAttribute('data-kui-container') ?? trigger.getAttribute('data-pjax') ?? getSelectorFromElement(trigger)
        const container = containerSelector ? document.querySelector<HTMLElement>(containerSelector) : trigger.closest<HTMLElement>(PjaxTabs.selector) ?? document.querySelector<HTMLElement>(PjaxTabs.selector)
        const url = trigger.dataset.url ?? trigger.getAttribute('href')

        if (!container || !url || url.startsWith('#')) {
            return
        }

        event.preventDefault()
        void PjaxTabs.getOrCreate(container).open({
            id: trigger.dataset.id,
            title: trigger.dataset.title ?? trigger.textContent?.trim() ?? url,
            url,
            closable: trigger.dataset.closable !== 'false'
        })
    })
}

async function defaultPjaxFetcher(url:string): Promise<string> {
    const response = await fetch(url, {headers: {'X-Requested-With': 'XMLHttpRequest' }})
    if(!response.ok){
        throw new Error (`Kui Pjax request failed: ${response.status}`)
    }
    return response.text()
}

function createStableId(prefix:string, source: string): string {
    let hash = 0
    for (let index=0; index< source.length; index+=1){
        hash = (hash << 5) - hash + source.charCodeAt(index)
        hash |=0
    }
    return `${prefix}-${Math.abs(hash).toString()}`
}
