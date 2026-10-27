import { Component } from '../../core/component'
import { type EventDisposer } from '../../core/events'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export interface DragPayload {
    event: MouseEvent
    element: HTMLElement
    pos: {
        left: number
        top: number
    }
    offset: {
        x: number
        y: number
    }
    smallOffset: {
        x: number
        y: number
    }
}

export interface DraggableOptions extends PlainObject {
    container: string
    handle: string
    mouseButton: 'left' | 'middle' | 'right' | 'all' | number
    move: boolean | ((pos: {
        left: number
        top: number
    }, element: HTMLElement) => void)
    selector: string
    stopPropagation: boolean
    before?: (payload: Pick<DragPayload, 'event' | 'element'>) => boolean | void
    drag?: (payload: DragPayload) => void
    finish?: (payload: DragPayload) => void
}

export class Draggable extends Component<DraggableOptions> {
    static readonly componentName = 'draggable'
    static readonly selector = '[data-kui-draggable], .draggable'
    static readonly defaults: DraggableOptions = {
        container: 'body',
        handle: '',
        mouseButton: 'left',
        move: true,
        selector: '',
        stopPropagation: false,
    }

    private documentDisposers: EventDisposer[] = []

    private constructor(element: HTMLElement, options: Partial<DraggableOptions> = {}) {
        super(element, Draggable.componentName, mergeOptions(Draggable.defaults, options))
        this.bindEvents()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<DraggableOptions> = {}): Draggable {
        const element = Draggable.resolveElement(target)
        return (
            getInstance<Draggable>(element, Draggable.componentName) ?? new Draggable(element, { ...readDataOptions<DraggableOptions>(element), ...options })
        )
    }

    destroy(): void {
        this.dispose()
    }

    override dispose(): void {
        this.clearDocumentListeners()
        super.dispose()
    }

    private bindEvents(): void {
        this.listen(this.element, 'mousedown', (event) => this.handleMouseDown(event))
    }

    private handleMouseDown(event: MouseEvent): void {
        if (!this.isAllowedButton(event)) {
            return
        }

        const target = event.target
        if(!(target instanceof Element)) {
            return
        }

        if(this.options.handle && !target.closest(this.options.handle)) {
            return
        }

        const dragElement = this.resolveDragElement(target)
        if (!dragElement) {
            return
        }

        if(this.options.before?.({event, element: dragElement }) === false ){
            return
        }

        const startX = event.pageX
        const startY = event.pageY
        const rect = dragElement.getBoundingClientRect()
        const startLeft = rect.left + window.scrollX
        const startTop = rect.top + window.scrollY
        let lastX = startX
        let lastY = startY

        dragElement.classList.add('drag-ready')
        event.preventDefault()
        this.stop(event)

        const onMove = (moveEvent: MouseEvent) => {
            const pos = {
                left: startLeft + moveEvent.pageX - startX,
                top: startTop + moveEvent.pageY - startY
            }
            const payload: DragPayload = {
                event: moveEvent,
                element: dragElement,
                pos,
                offset: {
                    x: moveEvent.pageX - startX,
                    y: moveEvent.pageY - startY
                },
                smallOffset: {
                    x: moveEvent.pageX - lastX,
                    y: moveEvent.pageY - lastY
                }
            }
            dragElement.classList.remove('drag-ready')
            dragElement.classList.add('dragging')
            this.moveElement(dragElement, pos)
            this.options.drag?.(payload)
            this.emit('kui:draggable:drag', payload)
            lastX = moveEvent.pageX
            lastY = moveEvent.pageY
            this.stop(moveEvent)
        }

        const onUp = (upEvent: MouseEvent) => {
            const pos = {
                left: startLeft + upEvent.pageX - startX,
                top: startTop + upEvent.pageY - startY
            }
            const payload: DragPayload = {
                event: upEvent,
                element: dragElement,
                pos,
                offset: { x: upEvent.pageX - startX, y: upEvent.pageY - startY},
                smallOffset: { x: upEvent.pageX - lastX, y: upEvent.pageY - lastY}
            }
            dragElement.classList.remove('drag-ready')
            dragElement.classList.remove('dragging')
            this.moveElement(dragElement, pos)
            this.options.finish?.(payload)
            this.emit('kui:draggable:finish', payload)
            this.clearDocumentListeners()
            this.stop(upEvent)
        }

        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
        this.documentDisposers = [
            () => document.removeEventListener('mousemove', onMove),
            () => document.removeEventListener('mouseup', onUp)
        ]
    }

    private resolveDragElement(target: Element): HTMLElement | null {
        if(this.options.selector) {
            return target.closest<HTMLElement>(this.options.selector)
        }
        return this.element
    }

    private moveElement(element: HTMLElement, pos: {left: number, top: number}): void {
        if (!this.options.move) {
            return
        }

        if(typeof this.options.move === 'function') {
            this.options.move(pos, element)
            return
        }

        if(getComputedStyle(element).position === 'static'){
            element.style.position = 'absolute'
        }
        element.style.left = `${pos.left}px`
        element.style.top = `${pos.top}px`
    }

    private isAllowedButton(event: MouseEvent): boolean {
        const button = this.options.mouseButton
        if (button === 'all') {
            return true
        }
        if (typeof button === 'number') {
            return button < 0 || event.button === button
        }
        const buttonMap = {left: 0,  middle: 1, right: 2}
        return event.button === buttonMap[button]
    }

    private stop(event: MouseEvent): void {
        if(this.options.stopPropagation) {
            event.stopPropagation()
        }
    }

    private clearDocumentListeners(): void {
        this.documentDisposers.splice(0).forEach((dispose) => dispose())
    }
}
