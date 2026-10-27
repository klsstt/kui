import { autoUpdate, computePosition, flip, offset, shift, type Placement } from '@floating-ui/dom'
import { Component } from '../../core/component'
import { getSelectorFromElement } from '../../core/dom/elements'
import { delegate, type EventDisposer } from '../../core/events'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions } from '../../core/options'

export interface DropdownOptions {
    menuSelector: string
    placement: Placement
    offset: number
    autoClose: boolean
}

export interface DropdownProps extends DropdownOptions {}

let dropdownId = 0

export class Dropdown extends Component<DropdownOptions> {
    static readonly componentName = 'dropdown'
    static readonly selector = '[data-toggle="dropdown"], [data-kui-toggle="dropdown"]'
    static readonly defaults: DropdownOptions = {
        menuSelector: '.dropdown-menu',
        placement: 'bottom-start',
        offset: 2,
        autoClose: true
    }

    private readonly menu: HTMLElement
    private cleanupAutoUpdate: EventDisposer | null = null

    private constructor(trigger: HTMLElement, options: Partial<DropdownOptions> = {}) {
        super(trigger, Dropdown.componentName, mergeOptions(Dropdown.defaults, options))

        const menu = this.resolveMenu()
        if (!menu) {
            throw new Error('KUI dropdown requires a menu element.')
        }

        this.menu = menu
        this.configureAccessibility()
        this.bindEvents()
    }

    static getOrCreate(
        trigger: HTMLElement | string,
        options: Partial<DropdownOptions> = {}
    ): Dropdown {
        const element = Dropdown.resolveElement(trigger)
        return (
            getInstance<Dropdown>(element, Dropdown.componentName) ?? new Dropdown(element, {...readDataOptions<DropdownOptions>(element), ...options})
        )
    }

    static init(root: ParentNode = document): Dropdown[] {
        return Array.from(root.querySelectorAll<HTMLElement>(Dropdown.selector), (element) => Dropdown.getOrCreate(element))
    }

    toggle(): void {
        if (this.isShown()) {
            this.hide()
            return
        }

        this.show()
    }

    show(focusMenu = false): void {
        if (this.isShown() || !this.emitCancelable(['show.kui.dropdown', 'kui:dropdown:show'])) {
            return
        }

        this.closeSiblingMenus()
        this.element.setAttribute('aria-expanded', 'true')
        this.element.parentElement?.classList.add('open')
        this.menu.classList.add('show')
        this.updatePosition()
        if(focusMenu) {
            this.getMenuItems()[0]?.focus()
        }
        this.emit('kui:dropdown:shown')
    }

    hide(): void {
        if (!this.isShown() || !this.emitCancelable(['hide.kui.dropdown', 'kui:dropdown:hide'])) {
            return
        }

        this.cleanupAutoUpdate?.()
        this.cleanupAutoUpdate = null
        this.element.setAttribute('aria-expanded', 'false')
        this.element.parentElement?.classList.remove('open')
        this.menu.classList.remove('show')
        this.menu.removeAttribute('style')
        this.emit('kui:dropdown:hidden')
    }

    isShown(): boolean {
        return this.element.parentElement?.classList.contains('open') ?? false
    }

    override dispose(): void {
        this.cleanupAutoUpdate?.()
        super.dispose()
    }

    private bindEvents(): void {
        this.listen(this.element, 'keydown', (event) => {
            if(event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault()
                this.show(true)
                const items = this.getMenuItems()
                (event.key === 'ArrowUp' ? items.at(-1) : items[0])?.focus()
            } else if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                this.toggle()
                if (this.isShown()) {
                    this.getMenuItems()[0]?.focus()
                }
            }
        })

        this.listen(this.menu, 'keydown', (event) => {
            const items = this.getMenuItems()
            const activeIndex = items.findIndex((item) => item === document.activeElement)
            let nextIndex: number | null = null

            if(event.key === 'ArrowDown') {
                nextIndex = (activeIndex + 1) % items.length
            } else if (event.key === 'ArrowUp') {
                nextIndex = (activeIndex - 1 + items.length) % items.length
            } else if (event.key === 'Home') {
                nextIndex = 0
            } else if (event.key === 'End') {
                nextIndex = items.length - 1
            } else if (event.key === 'Escape') {
                event.preventDefault()
                this.hide()
                this.element.focus()
            }

            if(nextIndex !== null && items[nextIndex]) {
                event.preventDefault()
                items[nextIndex].focus()
            }
        })

        if (this.options.autoClose) {
            this.listen(document, 'click', (event) => {
                if(!(event.target instanceof Node)) {
                    return
                }

                if (this.element.contains(event.target) || this.menu.contains(event.target)) {
                    return
                }

                this.hide()
            })
        }
    }

    private configureAccessibility(): void {
        this.menu.id ||= `kui-dropdown-menu-${++dropdownId}`
        this.element.setAttribute('aria-controls', this.menu.id)
        this.element.setAttribute('aria-haspopup', 'menu')
        this.element.setAttribute('aria-expanded', this.isShown() ? 'true' : 'false')
        this.menu.setAttribute('role', this.menu.getAttribute('role') ?? 'menu')

        this.getMenuItems().forEach((item) => {
            item.setAttribute('role', item.getAttribute('role') ?? 'menuitem')
            item.tabIndex = -1
        })
    }

    private getMenuItems(): HTMLElement[] {
        return Array.from(
            this.menu.querySelectorAll<HTMLElement>(
                '[role="menuitem"], a[href], button:not(disabled), [tabindex]:not([tabindex="-1"])',
            ),
        ).filter((item) => item.getAttribute('aria-disabled') !== 'true' && !item.hasAttribute('disabled'))
    }

    private resolveMenu(): HTMLElement | null {
        const explicitSelector = getSelectorFromElement(this.element)
        if (explicitSelector) {
            const explicitMenu  = document.querySelector<HTMLElement>(explicitSelector)
            if(explicitMenu) {
                return explicitMenu
            }
        }

        return this.element.parentElement?.querySelector<HTMLElement>(this.options.menuSelector) ?? null
    }

    private updatePosition(): void {
        this.cleanupAutoUpdate?.()
        this.cleanupAutoUpdate = autoUpdate(this.element, this.menu, () => {
            void computePosition(this.element, this.menu, {
                placement: this.options.placement,
                middleware: [offset(this.options.offset), flip(), shift({padding: 8})],
            }).then(({ x, y }) => {
                Object.assign(this.menu.style, {
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`
                })
            })
        })
    }

    private closeSiblingMenus(): void {
        document.querySelectorAll<HTMLElement>(Dropdown.selector).forEach((element) => {
            if(element === this.element) {
                return
            }

            getInstance<Dropdown>(element, Dropdown.componentName)?.hide()
        })
    }
}

export function bindDropdownDataApi(root: Document = document): EventDisposer {
    return delegate(root, 'click', Dropdown.selector, (event, trigger) => {
        event.preventDefault()
        Dropdown.getOrCreate(trigger).toggle()
    })
}
