import { Component } from "../../core/component"
import { getRovingFocusTarget, syncRovingTabIndex } from "../../core/dom/focus"
import { delegate, type EventDisposer } from '../../core/events'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from "../../core/options"

export interface TreeAction extends PlainObject {
    type: string
    title?: string
    template?: string
}

export interface TreeItem extends PlainObject {
    id?: string | number
    name?: string
    title?: string
    url?: string
    html?: string
    open?: boolean
    actions?: TreeActions | boolean | string
    children?: TreeItem[]
}

export type TreeActions = Record<string, boolean | Partial<TreeAction>>
export type TreeInitialState = 'normal' | 'preserve' | 'expand' | 'collapse'

export interface TreeOptions extends PlainObject {
    actions?: TreeActions | boolean | string
    accordion: boolean
    animate: boolean
    data: TreeItem[]
    initialState: TreeInitialState
    itemWrapper: boolean | string
    name: string
    toggleTemplate: string
    itemCreator?: (item: TreeItem, element: HTMLElement) => string | HTMLElement | boolean
    action?: (payload: TreeActionPayload) => void
    hit?: (payload: TreeItemPayload) => void
    expand?: (payload: TreeItemPayload) => void
    collapse?: (payload: TreeItemPayload) => void
}

export type TreeProps = TreeOptions

export interface TreeItemPayload {
    target: HTMLElement | null
    item: TreeItem | null
}

export interface TreeActionPayload extends TreeItemPayload {
    action: TreeAction
    actionElement: HTMLElement
}

const defaultActions: Record<string, TreeAction> = {
    sort: { type: 'sort', template: '<a class="sort-handler" href="#"></a>'},
    add: { type: 'add', template: '<a href="#"></a>'},
    edit: { type: 'edit', template: '<a href="#"></a>'},
    delete: { type: 'delete', template: '<a href="#"></a>'}
}

export class Tree extends Component<TreeOptions> {
    static readonly componentName = 'tree'
    static readonly selector = '[data-ride="tree"], [data-kui-ride="tree"], .tree'
    static readonly defaults: TreeOptions = {
        accordion: false,
        animate: false,
        data: [],
        initialState: 'normal',
        itemWrapper: false,
        name: '',
        toggleTemplate: ''
    }

    private constructor(element: HTMLElement, options: Partial<TreeOptions> = {}) {
        super(element, Tree.componentName, mergeOptions(Tree.defaults, options))
        this.element.classList.add('tree')
        this.element.setAttribute('role', 'tree')
        this.element.classList.toggle('tree-animate', this.options.animate)
        this.bindEvents()

        if(this.options.data.length > 0) {
            this.reload(this.options.data)
        } else {
            this.initializeList(this.element)
        }

        if(this.options.initialState === 'expand') {
            this.expand()
        } else if (this.options.initialState === 'collapse') {
            this.collapse()
        } else if (this.options.initialState === 'preserve') {
            this.restoreState()
        }
        this.syncAccessibility()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<TreeOptions> = {}): Tree {
        const element = Tree.resolveElement(target)
        return (getInstance<Tree>(element, Tree.componentName) ?? new Tree(element, {...readDataOptions<TreeOptions>(element), ...options}))
    }

    add(root: HTMLElement | string | null, items: TreeItem | TreeItem[], expand= false): void {
        const rootElement = typeof root === 'string' ? this.element.querySelector<HTMLElement>(root) : root
        const target = rootElement ?? this.element
        const list = target.matches('li') ? this.ensureChildList(target as HTMLElement) : target
        const normalizedItems = Array.isArray(items) ? items : [items]

        normalizedItems.forEach((item, index) => {
            list.append(this.createItem(item, index + 1))
        })
        this.initializeList(list)
        if (target instanceof HTMLElement) {
            this.syncBranchAnimationHeight(target)
        }

        if(expand && target instanceof HTMLElement) {
            this.expand(target)
        }

        this.syncAccessibility(target instanceof HTMLLIElement ? target : null)
    }

    reload(data: TreeItem[] = this.options.data): void {
        this.options.data = data
        this.element.innerHTML = ''
        data.forEach((item, index) => this.element.append(this.createItem(item, index + 1)))
        this.initializeList(this.element)
        this.syncAccessibility()
    }

    expand(target?: HTMLElement | string | null): void {
        const shouldCollapseSiblings = this.options.accordion && target !== undefined && target !== null
        this.resolveTargets(target).forEach((item) => {
            if (shouldCollapseSiblings) {
                this.collapseSiblingBranches(item)
            }
            this.syncBranchAnimationHeight(item)
            item.classList.add('open', 'in')
            item.setAttribute('aria-expanded', 'true')
            this.storeItemState(item, true)
            this.callItemEvent('expand', item)
        })
        this.syncAccessibility()
    }

    collapse(target?: HTMLElement | string | null): void {
        this.resolveTargets(target).forEach((item) => {
            this.syncBranchAnimationHeight(item)
            item.classList.remove('open', 'in')
            item.setAttribute('aria-expanded', 'false')
            this.storeItemState(item, false)
            this.callItemEvent('collapse', item)
            if (item.contains(document.activeElement)) {
                this.focusItem(item)
            }
        })
        this.syncAccessibility()
    }

    toggle(target?: HTMLElement | string | null): void {
        const targets = this.resolveTargets(target)
        targets.forEach((item) => {
            if (item.classList.contains('open')) {
                this.collapse(item)
            } else {
                this.expand(item)
            }
        })
    }

    show(targets: Iterable<HTMLElement>): void {
        Array.from(targets).forEach((target) => {
            let current: HTMLElement | null = target
            while(current) {
                if (current instanceof HTMLElement) {
                    this.expand(current)
                }
                current = current.parentElement?.closest('li') ?? null
            }
        })
    }

    toData(root: HTMLElement = this.element): TreeItem[] {
        return Array.from(root.children).filter((child): child is HTMLLIElement => child instanceof HTMLElement && !child.classList.contains('tree-action-item'))
        .map((item) => {
            const data = readTreeItem(item)
            const children = item.querySelector(':scope > ul')
            if (children instanceof HTMLElement) {
                data.children = this.toData(children)
            }
            data.open = item.classList.contains('open') || item.classList.contains('in')
            return data
        })
    }

    private bindEvents(): void {
        this.listen(this.element, 'click', (event) => {
            const target = event.target
            if (!(target instanceof Element)) {
                return
            }
            const action = target.closest<HTMLElement>('.tree-action')
            if (action) {
                event.preventDefault()
                this.callActionEvent(action)
                return
            }

            const item = target.closest<HTMLLIElement>('li')
            if (!item || !this.element.contains(item)) {
                return
            }

            const toggle = target.closest<HTMLElement>('.list-toggle, .tree-toggle, a[href="#"]')
            if (toggle || this.isBranchContentHit(target, item)) {
                event.preventDefault()
                this.callItemEvent('hit', item)
                this.toggle(item)
            }
        })

        this.listen(this.element, 'keydown', (event) => this.handleKeydown(event))
    }

    private isBranchContentHit(target: Element, item: HTMLLIElement): boolean {
        const childList = item.querySelector<HTMLElement>(':scope > ul')
        if (!childList || childList.contains(target)) {
            return false
        }

        const interactive = target.closest<HTMLElement>('a[href], button, input, select, textarea, [role="button"], [tabindex]')
        return !interactive || interactive === item || interactive.matches('.list-toggle, .tree-toggle, a[href="#"]')
    }

    private createItem(item: TreeItem, index: number): HTMLLIElement {
        const li = document.createElement('li')
        li.dataset.idx = String(index)
        li.dataset.item = JSON.stringify(stripChildren(item))
        if (item.id !== undefined) {
            li.dataset.id = String(item.id)
        }

        const contentHost = this.createItemContentHost(li)
        const customContent = this.options.itemCreator?.(item, li)
        if (customContent instanceof HTMLElement) {
            contentHost.append(customContent)
        } else if (typeof customContent === 'string') {
            contentHost.innerHTML = customContent
        } else if (item.html) {
            contentHost.innerHTML = item.html
        } else if (item.url) {
            const anchor = document.createElement('a')
            anchor.href = item.url
            anchor.textContent = item.title ?? item.name ?? String(item.id ?? '')
            contentHost.append(anchor)
        } else {
            const label = document.createElement('span')
            label.textContent = item.title ?? item.name ?? String(item.id ?? '')
            contentHost.append(label)
        }

        this.appendActions(contentHost, item)

        if(item.children?.length) {
            const children = document.createElement('ul')
            item.children.forEach((child, childIndex) => children.append(this.createItem(child, childIndex + 1)))
            li.append(children)
        }

        if (item.open) {
            li.classList.add('open', 'in')
        }

        return li
    }

    private createItemContentHost(li: HTMLElement): HTMLElement {
        if (!this.options.itemWrapper) {
            return li
        }

        const wrapper = document.createElement('div')
        wrapper.className = typeof this.options.itemWrapper === 'string' ? this.options.itemWrapper.replace(/[<>"]/g, '') : 'tree-item-wrapper'
        li.append(wrapper)
        return wrapper
    }

    private initializeList(list: HTMLElement):void {
        list.querySelectorAll<HTMLLinkElement>('li').forEach((item) => {
            const childList = item.querySelector(':scope > ul')
            item.setAttribute('role', 'treeitem')
            if (childList) {
                item.classList.add('has-list')
                childList.setAttribute('role', 'group')
                item.setAttribute('aria-expanded', String(item.classList.contains('open') || item.classList.contains('in')))
                this.ensureToggle(item)
            } else {
                item.removeAttribute('aria-expanded')
            }
            this.syncBranchAnimationHeight(item)
        })
    }

    private ensureToggle(item: HTMLElement): void {
        const existing = item.querySelector<HTMLElement>(':scope > .list-toggle')
        if (existing) {
            item.classList.add('tree-has-toggle')
            return
        }

        const template = this.options.toggleTemplate.trim()
        if (!template) {
            item.classList.remove('tree-has-toggle')
            return
        }

        item.insertAdjacentHTML('afterbegin', template)
        item.classList.toggle('tree-has-toggle', Boolean(item.querySelector(':scope > .list-toggle')))
    }

    private syncBranchAnimationHeight(item: HTMLElement): void {
        if (!this.options.animate){
            return
        }
        const childList = item.querySelector<HTMLElement>(':scope > ul')
        if(!childList) {
            return
        }

        childList.style.setProperty('--kui-tree-collapse-max-height', `${childList.scrollHeight}px`)
    }

    private appendActions(host: HTMLElement, item: TreeItem): void {
        const actions = normalizeActions(item.actions, this.options.actions)
        if (!actions) {
            return
        }
         const container = document.createElement('div')
         container.className = 'tree-actions'
         Object.values(actions).forEach((action) => {
            const actionElement = createActionElement(action)
            container.append(actionElement)
         })
         host.append(container)
    }

    private ensureChildList(item: HTMLElement): HTMLElement {
        const existing = item.querySelector<HTMLElement>(':scope > ul')
        if (existing) {
            return existing
        }

        const list = document.createElement('ul')
        item.append(list)
        item.classList.add('has-list')
        this.ensureToggle(item)
        this.syncBranchAnimationHeight(item)
        return list
    }

    private resolveTargets(target?: HTMLElement | string | null): HTMLLIElement[] {
        if (typeof target === 'string') {
            return Array.from(this.element.querySelectorAll<HTMLLIElement>(target))
        }
        if (target instanceof HTMLLIElement) {
            return [target]
        }
        if (target instanceof HTMLElement) {
            const item = target.closest<HTMLLIElement>('li')
            return item ? [item] : []
        }

        return Array.from(this.element.querySelectorAll<HTMLLIElement>('li.has-list'))
    }

    private collapseSiblingBranches(item: HTMLLIElement): void {
        const parent = item.parentElement
        if (!parent) {
            return
        }

        Array.from(parent.children).filter((child): child is HTMLLIElement => child instanceof HTMLLIElement && child !== item)
        .forEach((sibling) => {
            [sibling, ...Array.from(sibling.querySelectorAll<HTMLLIElement>('li.has-list'))].forEach((branchItem) => {
                if (!branchItem.classList.contains('open') && !branchItem.classList.contains('in')) {
                    return
                }
                this.syncBranchAnimationHeight(branchItem)
                branchItem.classList.remove('open', 'in')
                branchItem.setAttribute('aria-expanded', 'false')
                this.storeItemState(branchItem, false)
                this.callItemEvent('collapse', branchItem)
            })
        })
    }

    private callItemEvent(name: 'hit' | 'expand' | 'collapse', target: HTMLLIElement | null): void {
        const payload: TreeItemPayload = { target, item: target ? readTreeItem(target): null }
        this.options[name]?.(payload)
        this.emit(`${name}.kui.tree`, payload)
        this.emit(`kui:tree:${name}`, payload)
    }

    private callActionEvent(actionElement: HTMLElement): void {
        const item = actionElement.closest<HTMLLIElement>('li:not(.tree-action-item)')
        const action = readAction(actionElement)
        const payload: TreeActionPayload = {
            target: item,
            item: item ? readTreeItem(item) : null,
            action,
            actionElement,
        }
        this.options.action?.(payload)
        this.emit('action.kui.tree', payload)
        this.emit('kui:tree:action', payload)
    }

    private storeItemState(item: HTMLLIElement, expanded: boolean): void {
        if (this.options.initialState !== 'preserve' || !item.dataset.id) {
            return
        }
        const state = this.readStoredState()
        if (expanded) {
            state[item.dataset.id] = true
        } else {
            delete state[item.dataset.id]
        }
        window.localStorage?.setItem(this.storageKey(), JSON.stringify(state))
    }

    private restoreState(): void {
        const state = this.readStoredState()
        Object.keys(state).forEach((id) => {
            const item = this.element.querySelector<HTMLLIElement>(`li[data-id="${CSS.escape(id)}"]`)
            item?.classList.add('open', 'in')
        })
        this.syncAccessibility()
    }

    private handleKeydown(event: KeyboardEvent): void {
        const item = event.target instanceof Element ? event.target.closest<HTMLLIElement>('[role="treeitem"]') : null
        if (!item || !this.element.contains(item)) {
            return
        }

        if (event.target !== item && event.target instanceof Element && event.target.closest('a, button, input, select, textarea, [role="button"]')) {
            return
        }

        const visibleItems = this.getVisibleItems()
        const linearTarget = getRovingFocusTarget(event, visibleItems, item, { orientation: 'vertical', loop: false })
        if (linearTarget instanceof HTMLLIElement) {
            event.preventDefault()
            this.focusItem(linearTarget)
            return
        }

        const childList = item.querySelector<HTMLElement>(':scope > ul')
        const expanded = item.classList.contains('open') || item.classList.contains('in')
        if (event.key === 'ArrowRight' && childList) {
            event.preventDefault()
            if (!expanded) {
                this.expand(item)
            } else {
                const firstChild = childList.querySelector<HTMLLIElement>(':scope > li[role="treeitem"]')
                if (firstChild) {
                    this.focusItem(firstChild)
                }
            }
            return
        }

        if(event.key === 'ArrowLeft') {
            if (childList && expanded) {
                event.preventDefault()
                this.collapse(item)
                return
            }
            const parentItem = item.parentElement?.closest<HTMLLIElement>('[role="treeitem"]')
            if (parentItem) {
                event.preventDefault()
                this.focusItem(parentItem)
            }
            return
        }

        if(event.key === 'Enter' || event.key === ' '){
            event.preventDefault()
            this.callItemEvent('hit', item)
            if (childList) {
                this.toggle(item)
            }
        }
    }
    private getVisibleItems(): HTMLLIElement[] {
        const result: HTMLLIElement[] = []
        const visit = (list: HTMLElement): void => {
            Array.from(list.children).forEach((child) => {
                if (child instanceof HTMLUListElement) {
                    visit(child)
                    return
                }
                if(!(child instanceof HTMLLIElement) || child.classList.contains('tree-action-item')) {
                    return
                }
                result.push(child)
                const childList = child.querySelector<HTMLElement>(':scope > ul')
                if (childList && (child.classList.contains('open') || child.classList.contains('in'))) {
                    visit(childList)
                }
            })
        }
        visit(this.element)
        return result
    }

    private syncAccessibility(preferred: HTMLLIElement | null = null): void {
        this.element.querySelectorAll<HTMLLIElement>('li').forEach((item) => {
            if (item.classList.contains('tree-action-item')) {
                return
            }
            item.setAttribute('role', 'treeitem')
            const childList = item.querySelector<HTMLElement>(':scope > ul')
            if (childList) {
                childList.setAttribute('role', 'group')
                item.setAttribute('aria-expanded', String(item.classList.contains('open') || item.classList.contains('in')))
            } else {
                item.removeAttribute('aria-expanded')
            }
        })

        const visibleItems = this.getVisibleItems()
        const focused = document.activeElement instanceof HTMLLIElement && visibleItems.includes(document.activeElement) ? document.activeElement : null
        const active = preferred && visibleItems.includes(preferred) ? preferred: focused
        syncRovingTabIndex(visibleItems, active)
        this.element.querySelectorAll<HTMLLIElement>('[role="treeitem"]').forEach((item) => {
            if (!visibleItems.includes(item)) {
                item.tabIndex = -1
            }
        })
    }

    private focusItem(item: HTMLLIElement): void {
        this.syncAccessibility(item)
        item.focus()
    }

    private readStoredState(): Record<string, boolean> {
        try {
            return JSON.parse(window.localStorage?.getItem(this.storageKey()) ?? '{}') as Record<string, boolean>
        } catch {
            return {}
        }
    }

    private storageKey(): string {
        return `kui.tree.${this.options.name || this.element.id || 'default'}`
    }
}

export function bindTreeDataApi(root: ParentNode = document): EventDisposer {
    const init = () => {
        root.querySelectorAll<HTMLElement>(Tree.selector).forEach((element) => Tree.getOrCreate(element))
    }

    init()
    return delegate(document, 'click', '[data-kui-tree-action]', () => undefined)
}

function normalizeActions(
    ownActions?: TreeActions | boolean | string,
    parentActions?: TreeActions | boolean | string,
): Record<string, TreeAction> | null {
    const source = ownActions ?? parentActions
    if (!source) {
        return null
    }
    const names = source === true ? ['add', 'delete', 'edit', 'sort']: typeof source === 'string' ? source.split(',') : Object.keys(source)
    return names.reduce<Record<string,TreeAction>> ((actions, name) => {
        const sourceAction = typeof source === 'object' ? source[name] : true
        if (!sourceAction) {
            return actions
        }
        actions[name] = {
            ...defaultActions[name],
            ...(typeof sourceAction === 'object' ? sourceAction : {}), type: name,
        }
        return actions
    }, {})
}

function createActionElement(action: TreeAction): HTMLElement {
    const template = document.createElement('template')
    template.innerHTML = action.template ?? `<a href="#">${action.type}</a>`
    const element = template.content.firstElementChild instanceof HTMLElement ? template.content.firstElementChild : document.createElement('a')
    element.classList.add('tree-action')
    element.dataset.type = action.type
    element.dataset.action = JSON.stringify(action)
    if (action.title) {
        element.title = action.title
    }
    return element
}

function readAction(element: HTMLElement): TreeAction {
    try {
        return JSON.parse(element.dataset.action ?? '{}') as TreeAction
    } catch {
        return {type: element.dataset.type ?? ''}
    }
}

function readTreeItem(element: HTMLLIElement): TreeItem {
    try{
        return JSON.parse(element.dataset.item ?? '{}') as TreeItem
    } catch {
        return {id: element.dataset.id }
    }
}

function stripChildren(item: TreeItem): TreeItem {
    const rest = {...item}
    delete rest.children
    return rest
}
