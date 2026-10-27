import { Component } from "../../core/component";
import { getSelectorFromElement } from '../../core/dom/elements'
import { getRovingFocusTarget, syncRovingTabIndex, type RovingFocusOrientation } from "../../core/dom/focus";
import { applyTabActiveRadiusStyles, type TabActiveRadiusOptions } from "../../core/dom/styles";
import { delegate, type EventDisposer } from "../../core/events";
import { getInstance } from "../../core/instances";
import { mergeOptions, readDataOptions } from "../../core/options";

export interface TabOptions extends TabActiveRadiusOptions {
    activeClass: string
    paneActiveClass: string
}

export interface TabProp extends TabOptions {}

export interface TabEventPayload {
    previousTab: HTMLElement | null
    targetPane: HTMLElement | null
}

export class Tab extends Component<TabOptions> {
    static readonly componentName = 'tab'
    static readonly selector = '[data-toggle="tab"], [data-toggle="pill"], [data-kui-toggle="tab"]'
    static readonly defaults: TabOptions = {
        activeClass: 'active',
        paneActiveClass: 'active'
    }

    private constructor(element: HTMLElement, options: Prtial<TabOptions> = {}) {
        super(element, Tab.componentName, mergeOptions(Tab.defaults, options))
        applyTabActiveRadiusStyles(this.element, this.options)
        this.configureAccessibility()
        this.listen(this.element, 'keydown', (event) => this.handleKeydown(event))
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<TabOptions> = {}): Tab {
        const element = Tab.resolveElement(target)
        return getInstance<Tab>(element, Tab.componentName) ?? new Tab(element, {...readDataOptions<TabOptions>(element), ...options})
    }

    show(): void {
        const listItem = this.element.closest<HTMLElement>('li')
        if (listItem?.classList.contains(this.options.activeClass)) {
            return
        }

        const selector = getSelectorFromElement(this.element)
        const targetPane = selector ? document.querySelector<HTMLElement>(selector) : null
        const tabList = this.element.closest<HTMLElement>('.nav, [role="tablist"]')
        const previousTab = tabList?.querySelector<HTMLElement>(
            `li.${this.options.activeClass} > a, .${this.options.activeClass}[data-toggle="tab"], .${this.options.activeClass}[data-kui-toggle="tab"]`,
        ) ?? null
        const payload: TabEventPayload = { previousTab, targetPane }

        if(!this.emitCancelable(['show.kui.tab', 'kui:tab:show'], payload))
            return

        this.deactivalCurrentTab(tabList)
        this.activateTab(listItem)                                                                                                                                                                                                                                                                                                                                                         )
        this.activatePane(targetPane)
        this.syncTabStops(tabList)
        this.emit('kui:tab:shown', payload)
    }

    private deactivalCurrentTab(tabList: HTMLElement | null): void {
        this.getTabTriggers(tabList).forEach((trigger) => {
            trigger.classList.remove(this.options.activeClass)
            trigger.closest('li')?.classList.remove(this.options.activeClass)
            trigger.setAttribute('aria-selected', 'false')
        })
    }

    private activateTab(listItem: HTMLElement | null): void {
        listItem?.classList.add(this.options.activeClass)
        this.element.classList.add(this.options.activeClass)
        this.element.setAttribute('aria-selected', 'true')
    }

    private activatePane(targetPane: HTMLElement | null): void {
        if (!targetPane) {
            return
        }

        const paneContainer = targetPane.parentElement
        paneContainer?.querySelectorAll<HTMLElement>('.tab-pane').forEach((pane) => {
            if (pane.classList.contains(this.options.paneActiveClass)) {
                pane.classList.remove(this.options.paneActiveClass, 'in', 'show')
                pane.hidden = true
            }
        })

        targetPane.classList.add(this.options.paneActiveClass, 'in', 'show')
        targetPane.hidden = false
    }

    private configureAccessibility(): void {
        const tabList = this.element.closest<HTMLElement>('.nav, [role="tablist"]')
        if (!tabList)  {
            return
        }

        tabList.setAttribute('role', 'tablist')
        const triggers = this.getTabTriggers(tabList)
        triggers.forEach((trigger, index) => {
            trigger.id ||= `kui-tab-${index + 1}-${getSelectorFromElement(trigger)?.replace(/^#/, '') ?? 'item'}`
            trigger.setAttribute('role', 'tab')
            const paneSelector = getSelectorFromElement(trigger)
            const pane = paneSelector ? document.querySelector<HTMLElement>(paneSelector) : null
            if (pane) {
                trigger.setAttribute('aria-controls', pane.id)
                pane.setAttribute('role', 'tabpanel')
                pane.setAttribute('aria-labelledby', trigger.id)
                const selected = trigger.closest('li')?.classList.contains(this.options.activeClass) || trigger.classList.contains(this.options.activeClass)
                pane.hidden = !selected
            }
        })
        this.syncTabStops(tabList)
    }

    private getTabTriggers(tabList: HTMLElement | null): HTMLElement[] {
        return tabList ? Array.from(tabList.querySelectorAll<HTMLElement>(Tab.selector)) : []
    }

    private syncTabStops(tabList: HTMLElement | null): void {
        const triggers = this.getTabTriggers(tabList)
        const selected = triggers.find((trigger) => trigger.getAttribute('aria-selected') === 'true') ?? null
        syncRovingTabIndex(triggers, selected)
    }

    handleKeydown(event: KeyboardEvent): void {
        const tabList = this.element.closest<HTMLElement>('.nav, [role="tablist"]')
        if (!tabList) {
            return
        }

        const items = this.getTabTriggers(tabList)
        const orientation = (tabList.getAttribute('aria-orientation') ?? 'horizontal') as RovingFocusOrientation
        const target = getRovingFocusTarget(event, items, this.element, { orientation})
        if (!target) {
            return
        }

        event.preventDefault()
        target.focus()
        Tab.getOrCreate(target).show()
    }
}

export function bindTabDataApi(root: Document = document): EventDisposer {
    const disposeClick = delegate(root, 'click', Tab.selector, (event, target) =>  {
        event.preventDefault()
        Tab.getOrCreate(target).show()
    })
    const disposeKeyboard = delegate(root, 'keydown', Tab.selector, (event, target) => {
        if (getInstance<Tab>(target, Tab.componentName)) {
            return
        }
        Tab.getOrCreate(target).handleKeydown(event)
    })

    return () => {
        disposeClick()
        disposeKeyboard()
    }
}


