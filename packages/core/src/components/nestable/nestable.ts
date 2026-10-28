import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export interface NestableOptions extends PlainObject {
    /** 最大层级，0 表示不限制 */
    maxDepth: number
    /** 是否提供上移 / 下移 / 升级 / 降级按钮 */
    actions: boolean
    /** 顺序变化回调 */
    onChange?: (payload: { order: string[] }) => void
}

type DropMode = 'before' | 'after' | 'inside'

/**
 * 嵌套排序。
 * 既支持鼠标拖拽（before / after / inside 三个落点），
 * 也提供按钮操作，保证触屏与键盘用户同样可用。
 */
export class Nestable extends Component<NestableOptions> {
    static readonly componentName = 'nestable'
    static readonly selector = '[data-kui-nestable]'
    static readonly defaults: NestableOptions = {
        maxDepth: 0,
        actions: true,
    }

    private dragging: HTMLElement | null = null
    private pointerDrag: { item: HTMLElement; startX: number; startY: number; active: boolean } | null = null
    private dropTarget: { item: HTMLElement; mode: DropMode } | null = null
    private ghost: HTMLElement | null = null

    private constructor(element: HTMLElement, options: Partial<NestableOptions> = {}) {
        super(element, Nestable.componentName, mergeOptions(Nestable.defaults, options))
        element.classList.add('kui-nestable')
        this.listen(window, 'pointermove', (event) => this.onPointerMove(event))
        this.listen(window, 'pointerup', () => this.onPointerUp())
        this.listen(window, 'pointercancel', () => this.onPointerUp())
        this.bindItems()
        if (this.options.actions) {
            this.mountActions()
        }
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<NestableOptions> = {}): Nestable {
        const element = Nestable.resolveElement(target)
        return (
            getInstance<Nestable>(element, Nestable.componentName) ??
            new Nestable(element, { ...readDataOptions<NestableOptions>(element), ...options })
        )
    }

    /** 读取当前顺序（深度优先） */
    get order(): string[] {
        return this.items().map((item) => item.dataset.nestableId ?? item.textContent?.trim() ?? '')
    }

    /** 上移 */
    moveUp(item: HTMLElement): void {
        const previous = item.previousElementSibling
        if (previous instanceof HTMLElement) {
            previous.before(item)
            this.changed()
        }
    }

    /** 下移 */
    moveDown(item: HTMLElement): void {
        const next = item.nextElementSibling
        if (next instanceof HTMLElement) {
            next.after(item)
            this.changed()
        }
    }

    /** 降级：成为上一个兄弟节点的子节点 */
    indent(item: HTMLElement): void {
        const previous = item.previousElementSibling
        if (!(previous instanceof HTMLElement) || this.depth(item) >= this.options.maxDepth - 1) {
            return
        }
        this.childList(previous).append(item)
        this.changed()
    }

    /** 升级：移到父节点之后 */
    outdent(item: HTMLElement): void {
        const parentItem = item.parentElement?.closest<HTMLElement>('[data-kui-nestable-item]')
        if (!parentItem) {
            return
        }
        parentItem.after(item)
        if (!parentItem.querySelector('[data-kui-nestable-item]')) {
            this.childList(parentItem).remove()
        }
        this.changed()
    }

    private items(): HTMLElement[] {
        return Array.from(this.element.querySelectorAll<HTMLElement>('[data-kui-nestable-item]'))
    }

    private depth(item: HTMLElement): number {
        let depth = 0
        let parent = item.parentElement
        while (parent && parent !== this.element) {
            if (parent.matches('[data-kui-nestable-item]')) depth += 1
            parent = parent.parentElement
        }
        return depth
    }

    private childList(item: HTMLElement): HTMLElement {
        const existing = Array.from(item.children).find(
            (child): child is HTMLElement => child instanceof HTMLElement && child.matches('[data-kui-nestable-children]'),
        )
        if (existing) {
            return existing
        }
        const list = document.createElement('ol')
        list.className = 'kui-nestable__children'
        list.dataset.kuiNestableChildren = ''
        item.append(list)
        return list
    }

    private bindItems(): void {
        this.items().forEach((item) => {
            item.classList.add('kui-nestable__item')
            item.draggable = false

            if (!item.querySelector(':scope > .kui-nestable__row')) {
                const row = document.createElement('div')
                row.className = 'kui-nestable__row'
                const content = document.createElement('span')
                content.className = 'kui-nestable__content'
                // 用 DOM 搬移而不是 innerHTML 复制：保留子列表与已绑定的事件
                const children = Array.from(item.children).find((child) => child.matches('[data-kui-nestable-children]'))
                Array.from(item.childNodes)
                    .filter((node) => node !== children)
                    .forEach((node) => content.append(node))
                row.append(content)
                item.append(row)
                if (children) item.append(children)
            }

            this.bindPointer(item)
        })
    }

    private bindPointer(item: HTMLElement): void {
        const row = item.querySelector<HTMLElement>(':scope > .kui-nestable__row')
        if (!row) {
            return
        }
        this.listen(row, 'pointerdown', (event) => this.onPointerDown(item, event))
    }

    private onPointerDown(item: HTMLElement, event: PointerEvent): void {
        if (event.button !== 0) {
            return
        }
        const target = event.target
        if (target instanceof Element && target.closest('button, a, input, select, textarea')) {
            return
        }
        this.pointerDrag = { item, startX: event.clientX, startY: event.clientY, active: false }
    }

    private onPointerMove(event: PointerEvent): void {
        const drag = this.pointerDrag
        if (!drag) {
            return
        }
        const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY)
        if (!drag.active && distance < 5) {
            return
        }
        if (!drag.active) {
            drag.active = true
            this.dragging = drag.item
            drag.item.classList.add('is-dragging')
            this.element.classList.add('is-pointer-dragging')
            const row = drag.item.querySelector<HTMLElement>(':scope > .kui-nestable__row')
            if (row) {
                const ghost = row.cloneNode(true) as HTMLElement
                ghost.className = 'kui-nestable__ghost'
                ghost.style.width = `${row.getBoundingClientRect().width}px`
                document.body.append(ghost)
                this.ghost = ghost
            }
        }
        event.preventDefault()
        if (this.ghost) {
            this.ghost.style.left = `${event.clientX - 24}px`
            this.ghost.style.top = `${event.clientY - 16}px`
        }
        this.updateDropTarget(event)
    }

    private onPointerUp(): void {
        const drag = this.pointerDrag
        this.pointerDrag = null
        if (!drag?.active) {
            return
        }
        this.ghost?.remove()
        this.ghost = null
        drag.item.classList.remove('is-dragging')
        this.element.classList.remove('is-pointer-dragging')
        const target = this.dropTarget
        this.dropTarget = null
        this.clearMarkers()
        this.dragging = null
        if (!target) {
            return
        }
        const { item, mode } = target
        if (mode === 'inside') {
            if (this.options.maxDepth && this.depth(item) + 1 >= this.options.maxDepth) {
                return
            }
            item.removeAttribute('data-nestable-collapsed')
            this.childList(item).append(drag.item)
        } else if (mode === 'before') {
            item.before(drag.item)
        } else {
            item.after(drag.item)
        }
        this.changed()
    }

    /** 指针位置决定落点：上 35% 之前、下 25% 之内、其余之后 */
    private updateDropTarget(event: PointerEvent): void {
        const drag = this.pointerDrag
        if (!drag?.active) {
            return
        }
        const element = document.elementFromPoint(event.clientX, event.clientY)
        const item = element instanceof Element ? element.closest<HTMLElement>('[data-kui-nestable-item]') : null
        this.clearMarkers()
        if (!item || item === drag.item || drag.item.contains(item)) {
            this.dropTarget = null
            return
        }
        const mode = this.resolveMode(item, event.clientY)
        item.classList.add(`is-drop-${mode}`)
        this.dropTarget = { item, mode }
    }

    private resolveMode(item: HTMLElement, clientY: number): DropMode {
        const rect = item.getBoundingClientRect()
        const offsetY = clientY - rect.top
        if (offsetY > rect.height * 0.75) {
            return 'inside'
        }
        return offsetY < rect.height * 0.35 ? 'before' : 'after'
    }
    private clearMarkers(): void {
        this.items().forEach((item) => item.classList.remove('is-drop-before', 'is-drop-after', 'is-drop-inside'))
    }

    private mountActions(): void {
        this.items().forEach((item) => {
            const row = item.querySelector<HTMLElement>(':scope > .kui-nestable__row')
            if (!row || row.querySelector('.kui-nestable__actions')) {
                return
            }
            const actions = document.createElement('span')
            actions.className = 'kui-nestable__actions'
            const buttons: Array<[string, string, () => void]> = [
                ['fa fa-arrow-up', '上移', () => this.moveUp(item)],
                ['fa fa-arrow-down', '下移', () => this.moveDown(item)],
                ['fa fa-outdent', '升级', () => this.outdent(item)],
                ['fa fa-indent', '降级', () => this.indent(item)],
            ]
            buttons.forEach(([icon, label, handler]) => {
                const button = document.createElement('button')
                button.type = 'button'
                button.className = 'kui-nestable__action'
                button.title = label
                button.setAttribute('aria-label', label)
                button.innerHTML = `<i class="${icon}" aria-hidden="true"></i>`
                button.addEventListener('click', handler)
                actions.append(button)
            })
            row.append(actions)
        })
    }

    private changed(): void {
        if (this.options.actions) {
            this.mountActions()
        }
        const order = this.order
        this.options.onChange?.({ order })
        this.emit('kui:nestable:change', { order })
    }
}
