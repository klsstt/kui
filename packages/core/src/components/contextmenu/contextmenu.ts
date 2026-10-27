import { Component } from '../../core/component'
import { getSelectorFromElement } from '../../core/dom/elements'
import { delegate, type EventDisposer } from '../../core/events'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export interface ContextMenuOptions extends PlainObject {
    target: string
    scopes: string
    before?: (event: MouseEvent, trigger: HTMLElement) => boolean | void
    onItem?: (event: MouseEvent | KeyboardEvent, trigger: HTMLElement, item: HTMLElement) => void
}

export type ContextMenuProps = ContextMenuOptions

let contextMenuId = 0

export class ContextMenu extends Component<ContextMenuOptions> {
    static readonly componentName = 'contextmenu'
    static readonly selector = '[data-toggle="context"],[data-kui-toggle="context"]'
    static readonly defaults: ContextMenuOptions = {
        target: '',
        scopes: ''
    }

    private menu: HTMLElement | null = null
    private restoreFocusTo: HTMLElement | null = null
    private typeahead = ''
    private typeaheadTimer: number | null = null
    private managedStyles: Record<'position' | 'zIndex' | 'left' | 'top', string> | null = null
    private menuRole: string | null = null
    private itemAttributes: Array<{ element: HTMLElement, role: string | null, tabindex: string | null }> = []
    private readonly triggerAttributes: Record<'aria-haspopup' | 'aria-controls' | 'aria-expanded', string | null>

    private constructor(element: HTMLElement, options: Partial<ContextMenuOptions> = {}) {
        super(element, ContextMenu.componentName, mergeOptions(ContextMenu.defaults, options))
        this.triggerAttributes = {
            'aria-haspopup': element.getAttribute('aria-haspopup'),
            'aria-controls': element.getAttribute('aria-controls'),
            'aria-expanded': element.getAttribute('aria-expanded'),
        }
        this.bindEvents()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<ContextMenuOptions> = {}): ContextMenu {
        const element = ContextMenu.resolveElement(target)
        return (
            getInstance<ContextMenu>(element, ContextMenu.componentName) ??
            new ContextMenu(element, {
                ...readDataOptions<ContextMenuOptions>(element),
                ...options,
            })
        )
    }

    show(event: MouseEvent): void {
        if (this.element.classList.contains('disabled') || this.element.hasAttribute('disabled')) {
            return
        }
        if (this.options.before?.call(this, event, this.element) === false) {
            return
        }

        const menu = this.getMenu()
        if (!menu || !this.emitCancelable(['show.kui.context', 'kui:contextmenu:show'], { event })) {
            return
        }

        this.closemenu()
        this.menu = menu
        this.restoreFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : this.element
        menu.id ||= `kui-contextmenu-${++contextMenuId}`
        this.menuRole = menu.getAttribute('role')
        this.managedStyles = {
            position: menu.style.position,
            zIndex: menu.style.zIndex,
            left: menu.style.left,
            top: menu.style.top
        }
        menu.setAttribute('role', 'menu')
        this.element.setAttribute('aria-haspopup', 'menu')
        this.element.setAttribute('aria-controls', menu.id)
        this.element.setAttribute('aria-expanded', 'true')
        this.prepareItems(menu)
        Object.assign(menu.style, {
            position: 'absolute',
            zIndex: '9999',
            left: `${event.pageX}px`,
            top: `${event.pageY}px`
        })
        menu.classList.add('open')
        this.getItems()[0]?.focus()
        this.emit('kui:contextmenu:shown', { event })
    }

    closemenu(restoreFocus = false): void {
        if (!this.menu?.classList.contains('open')) {
            return
        }

        this.menu.classList.remove('open')
        if (this.managedStyles) {
            this.menu.style.position = this.managedStyles.position
            this.menu.style.zIndex = this.managedStyles.zIndex
            this.menu.style.left = this.managedStyles.left
            this.menu.style.top = this.managedStyles.top
            this.managedStyles = null
        }

        restoreAttribute(this.menu, 'role', this.menuRole)
        this.itemAttributes.forEach(({element, role, tabindex}) => {
            restoreAttribute(element, 'role', role)
            restoreAttribute(element, 'tabindex', tabindex)
        })
        this.itemAttributes = []
        this.typeahead = ''
        if (this.typeaheadTimer !== null) {
            window.clearTimeout(this.typeaheadTimer)
            this.typeaheadTimer = null
        }
        this.element.setAttribute('aria-expanded', 'false')
        this.emit('kui:contextmenu:hidden')
        if (restoreFocus && this.restoreFocusTo?.isConnected) {
            this.restoreFocusTo.focus()
        }
    }

    hide(): void {
        this.closemenu()
    }

    destroy(): void {
        this.dispose()
    }

    override dispose(): void {
        this.closemenu()
        if (this.typeaheadTimer !== null) window.clearTimeout(this.typeaheadTimer)
        this.typeaheadTimer = null
        restoreAttribute(this.element, 'aria-haspopup', this.triggerAttributes['aria-haspopup'])
        restoreAttribute(this.element, 'aria-controls', this.triggerAttributes['aria-controls'])
        restoreAttribute(this.element, 'aria-expanded', this.triggerAttributes['aria-expanded'])
        this.menu = null
        this.restoreFocusTo = null
        super.dispose()
    }

    private bindEvents(): void {
        this.listen(this.element, 'contextmenu', (event) => {
            event.preventDefault()
            this.show(event)
        })
        this.listen(this.element, 'keydown', (event) => {
            if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
                event.preventDefault()
                const rect = this.element.getBoundingClientRect()
                this.show(new MouseEvent('contextmenu', { clientX: rect.left, clientY: rect.bottom}))
            }
        })
        this.listen(document, 'click', (event) => {
            const target = event.target
            if (!(target instanceof Element)) {
                return
            }

            const item = target.closest<HTMLElement>('li:not(.divider), .dropdown-item')
            if (this.menu?.contains(target) && item) {
                this.options.onItem?.(event, this.element, item)
            }
            this.closemenu()
        })
        this.listen(document, 'keydown', (event) => {
            if (!this.menu?.classList.contains('open')) {
                return
            }
            const items = this.getItems()
            const current = document.activeElement instanceof HTMLElement ? items.indexof(document.activeElement) : -1
            let next = current
            if (event.key === 'Escape') {
                event.preventDefault()
                this.closemenu(true)
            } else if (event.key === 'Tab') {
                this.closemenu()
            } else if (event.key === 'ArrowDown') {
                next = (current + 1) % items.length
            } else if (event.key === 'ArrowUp') {
                next = (current - 1 + items.length) % items.length
            } else if (event.key === 'Home') {
                next = 0
            } else if (event.key === 'End') {
                next = items.length - 1
            } else if ((event.key === 'Enter' || event.key  === ' ') && current >= 0) {
                event.preventDefault()
                this.activateItem(items[current], event)
                return
            } else if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
                this.typeahead += event.key.toLocaleLowerCase()
                if (this.typeaheadTimer !== null) window.clearTimeout(this.typeaheadTimer)
                this.typeaheadTimer = window.setTimeout(() => {
                    this.typeahead = ''
                    this.typeaheadTimer = null
                }, 500)
                const match = items.find((item) => item.textContent?.trim().toLocaleLowerCase().startsWith(this.typeahead))
                if (match) {
                    event.preventDefault()
                    match.focus()
                }
                return
            } else {
                return
            }

            if (next >= 0 && next !== current) {
                event.preventDefault()
                items[next]?.focus()
            }
        })
    }

    getMenu(): HTMLElement | null {
        const selector = this.options.target || getSelectorFromElement(this.element)
        if (!selector) {
            return null
        }

        const target = document.querySelector<HTMLElement>(selector) ?? this.element.querySelector<HTMLElement>(selector)
        return target?.querySelector<HTMLElement>('.dropdown-menu') ?? target
    }

    private prepareItems(menu: HTMLElement): void {
        menu.querySelectorAll<HTMLElement>('a, button, [role="menuitem"], .dropdown-item').forEach((item) => {
            this.itemAttributes.push({
                element: item,
                role: item.getAttribute('role'),
                tabindex: item.getAttribute('tabindex')
            })
            item.setAttribute('role', 'menuitem')
            item.tabIndex = -1
        })
    }

    private getItems(): HTMLElement[] {
        if (!this.menu) return []
        return Array.from(this.menu.querySelectorAll<HTMLElement>('[role="menuitem"]')).filter((item) =>
            !item.matches('[disabled], [aria-disabled="true"], .disabled') && !item.closest('.disabled'),
        )
    }

    private activateItem(item: HTMLElement, event: MouseEvent | KeyboardEvent): void {
        this.options.onItem?.(event, this.element, item)
        if (event instanceof KeyboardEvent) {
            item.click()
        }
        this.closemenu(true)
    }
}

function restoreAttribute(element: Element, name: string, value: string | null): void {
    if (value === null) element.removeAttribute(name)
    else element.setAttribute(name, value)
}

export function bindContextMenuDataApi(root: Document = document): EventDisposer {
    return delegate(root, 'contextmenu', ContextMenu.selector, (event, trigger) => {
        if (getInstance<ContextMenu>(trigger, ContextMenu.componentName)) {
            return
        }
        event.preventDefault()
        ContextMenu.getOrCreate(trigger).show(event as MouseEvent)
    })
}
