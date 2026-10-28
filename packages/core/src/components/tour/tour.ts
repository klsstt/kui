import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export type TourPlacement = 'top' | 'right' | 'bottom' | 'left' | 'auto'

export interface TourStep {
    /** 步骤标题 */
    title: string
    /** 步骤正文 */
    content?: string
    /** 目标元素选择器，缺省时居中显示 */
    target?: string
    /** 相对目标的方位 */
    placement?: TourPlacement
    /** 高亮内边距 */
    padding?: number
    /** 圆角 */
    radius?: number
}

export interface TourOptions extends PlainObject {
    /** 步骤数据 */
    steps: TourStep[]
    /** 挂载后自动开始 */
    autoStart: boolean
    /** 允许点击遮罩关闭 */
    maskClosable: boolean
    /** 显示“跳过引导” */
    skippable: boolean
    /** 按钮文案 */
    nextText: string
    prevText: string
    doneText: string
    /** 结束回调 */
    onFinish?: () => void
    /** 关闭回调（无论是否走完） */
    onClose?: (reason: 'finish' | 'skip' | 'mask' | 'escape') => void
    /** 步骤切换回调 */
    onChange?: (index: number, step: TourStep) => void
}

const MASK_PADDING = 6

/**
 * 引导。
 * 用「聚光 + 气泡」把用户的注意力固定在一个目标上，一次只讲一件事：
 * 目标被高亮，其余界面被遮罩压暗，说明文字与操作入口始终贴在目标附近。
 */
export class Tour extends Component<TourOptions> {
    static readonly componentName = 'tour'
    static readonly selector = '[data-kui-tour]'
    static readonly defaults: TourOptions = {
        steps: [],
        autoStart: false,
        maskClosable: true,
        skippable: true,
        nextText: '下一步',
        prevText: '上一步',
        doneText: '完成',
    }

    private index = 0
    private root: HTMLElement | null = null
    private mask: HTMLElement | null = null
    private highlight: HTMLElement | null = null
    private bubble: HTMLElement | null = null
    private open = false
    private readonly reposition = (): void => this.place()

    private constructor(element: HTMLElement, options: Partial<TourOptions> = {}) {
        super(element, Tour.componentName, mergeOptions(Tour.defaults, normalizeTourOptions(options)))
        element.classList.add('kui-tour-source')
        element.hidden = true
        if (this.options.autoStart) {
            this.start()
        }
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<TourOptions> = {}): Tour {
        const element = Tour.resolveElement(target)
        return (
            getInstance<Tour>(element, Tour.componentName) ??
            new Tour(element, { ...readDataOptions<TourOptions>(element), ...options })
        )
    }

    /** 是否正在展示 */
    get isOpen(): boolean {
        return this.open
    }

    /** 当前步骤下标 */
    get current(): number {
        return this.index
    }

    start(index = 0): void {
        if (!this.options.steps.length) {
            return
        }
        this.index = Math.min(Math.max(index, 0), this.options.steps.length - 1)
        this.open = true
        this.mount()
        this.show()
    }

    next(): void {
        if (this.index >= this.options.steps.length - 1) {
            this.finish()
            return
        }
        this.go(this.index + 1)
    }

    prev(): void {
        this.go(this.index - 1)
    }

    go(index: number): void {
        if (!this.open) {
            return
        }
        const next = Math.min(Math.max(index, 0), this.options.steps.length - 1)
        if (next === this.index) {
            return
        }
        this.index = next
        this.show()
    }

    /** 关闭引导，不触发完成回调 */
    close(reason: 'skip' | 'mask' | 'escape' = 'skip'): void {
        if (!this.open) {
            return
        }
        this.open = false
        this.unmount()
        this.options.onClose?.(reason)
    }

    dispose(): void {
        this.unmount()
        super.dispose()
    }

    private finish(): void {
        if (!this.open) {
            return
        }
        this.open = false
        this.unmount()
        this.options.onFinish?.()
        this.options.onClose?.('finish')
        this.emit('kui:tour:finish', { index: this.index })
    }

    private mount(): void {
        this.unmount()

        const mask = document.createElement('div')
        mask.className = 'kui-tour__mask'
        mask.dataset.tourMask = ''

        const highlight = document.createElement('div')
        highlight.className = 'kui-tour__highlight'

        const bubble = document.createElement('div')
        bubble.className = 'kui-tour__bubble'
        bubble.setAttribute('role', 'dialog')
        bubble.setAttribute('aria-modal', 'true')
        bubble.setAttribute('aria-live', 'polite')

        const root = document.createElement('div')
        root.className = 'kui-tour'
        root.append(mask, highlight, bubble)
        document.body.append(root)

        this.root = root
        this.mask = mask
        this.highlight = highlight
        this.bubble = bubble

        this.listen(mask, 'click', () => {
            if (this.options.maskClosable) {
                this.close('mask')
            }
        })
        this.listen(window, 'resize', this.reposition)
        this.listen(window, 'scroll', this.reposition, { capture: true, passive: true })
        this.listen(document, 'keydown', (event) => this.onKeydown(event))
    }

    private unmount(): void {
        this.root?.remove()
        this.root = null
        this.mask = null
        this.highlight = null
        this.bubble = null
        this.disposers.splice(0).forEach((disposer) => disposer())
    }

    private onKeydown(event: KeyboardEvent): void {
        if (!this.open) {
            return
        }
        if (event.key === 'Escape') {
            event.preventDefault()
            this.close('escape')
        } else if (event.key === 'ArrowRight') {
            event.preventDefault()
            this.next()
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault()
            this.prev()
        }
    }

    private show(): void {
        const step = this.options.steps[this.index]
        if (!step || !this.bubble || !this.highlight) {
            return
        }

        this.bubble.replaceChildren(this.buildBubble(step))
        this.place()
        this.options.onChange?.(this.index, step)
        this.emit('kui:tour:change', { index: this.index, step })
        this.bubble.querySelector<HTMLElement>('[data-tour-primary]')?.focus({ preventScroll: true })
    }

    private buildBubble(step: TourStep): DocumentFragment {
        const fragment = document.createDocumentFragment()
        const total = this.options.steps.length
        const last = this.index === total - 1

        const head = document.createElement('div')
        head.className = 'kui-tour__head'
        const counter = document.createElement('span')
        counter.className = 'kui-tour__counter'
        counter.textContent = `${this.index + 1} / ${total}`
        const title = document.createElement('strong')
        title.className = 'kui-tour__title'
        title.textContent = step.title
        head.append(counter, title)

        if (this.options.skippable) {
            const skip = document.createElement('button')
            skip.type = 'button'
            skip.className = 'kui-tour__close'
            skip.setAttribute('aria-label', '跳过引导')
            skip.innerHTML = '<i class="fa fa-close" aria-hidden="true"></i>'
            skip.addEventListener('click', () => this.close('skip'))
            head.append(skip)
        }

        fragment.append(head)

        if (step.content) {
            const body = document.createElement('p')
            body.className = 'kui-tour__content'
            body.textContent = step.content
            fragment.append(body)
        }

        const footer = document.createElement('div')
        footer.className = 'kui-tour__footer'

        const dots = document.createElement('span')
        dots.className = 'kui-tour__dots'
        this.options.steps.forEach((_, position) => {
            const dot = document.createElement('i')
            dot.className = position === this.index ? 'is-active' : ''
            dots.append(dot)
        })
        footer.append(dots)

        const actions = document.createElement('span')
        actions.className = 'kui-tour__actions'
        if (this.index > 0) {
            const prev = document.createElement('button')
            prev.type = 'button'
            prev.className = 'btn btn-default btn-sm'
            prev.textContent = this.options.prevText
            prev.addEventListener('click', () => this.prev())
            actions.append(prev)
        }
        const primary = document.createElement('button')
        primary.type = 'button'
        primary.className = 'btn btn-primary btn-sm'
        primary.dataset.tourPrimary = ''
        primary.textContent = last ? this.options.doneText : this.options.nextText
        primary.addEventListener('click', () => (last ? this.finish() : this.next()))
        actions.append(primary)
        footer.append(actions)
        fragment.append(footer)

        return fragment
    }

    private place(): void {
        const step = this.options.steps[this.index]
        if (!step || !this.highlight || !this.bubble || !this.root) {
            return
        }
        const target = step.target ? document.querySelector<HTMLElement>(step.target) : null
        const padding = step.padding ?? MASK_PADDING

        if (!target) {
            this.root.classList.add('is-centered')
            this.highlight.style.display = 'none'
            this.mask?.classList.add('is-solid')
            this.bubble.style.removeProperty('--kui-tour-x')
            this.bubble.style.removeProperty('--kui-tour-y')
            this.bubble.classList.add('is-centered')
            return
        }

        this.root.classList.remove('is-centered')
        this.highlight.style.display = ''
        this.mask?.classList.remove('is-solid')
        this.bubble.classList.remove('is-centered')

        const rect = target.getBoundingClientRect()
        this.highlight.style.inset = ''
        this.highlight.style.left = `${rect.left - padding}px`
        this.highlight.style.top = `${rect.top - padding}px`
        this.highlight.style.width = `${rect.width + padding * 2}px`
        this.highlight.style.height = `${rect.height + padding * 2}px`
        this.highlight.style.borderRadius = `${step.radius ?? 8}px`
        this.highlight.dataset.tourPlacement = this.resolvePlacement(rect, step.placement ?? 'auto')

        const bubbleRect = this.bubble.getBoundingClientRect()
        const placement = this.resolvePlacement(rect, step.placement ?? 'auto')
        const gap = 12
        let x = rect.left + rect.width / 2 - bubbleRect.width / 2
        let y = rect.top - bubbleRect.height - gap

        if (placement === 'bottom') {
            y = rect.bottom + gap
        } else if (placement === 'right') {
            x = rect.right + gap
            y = rect.top + rect.height / 2 - bubbleRect.height / 2
        } else if (placement === 'left') {
            x = rect.left - bubbleRect.width - gap
            y = rect.top + rect.height / 2 - bubbleRect.height / 2
        }

        const margin = 12
        x = Math.min(Math.max(x, margin), window.innerWidth - bubbleRect.width - margin)
        y = Math.min(Math.max(y, margin), window.innerHeight - bubbleRect.height - margin)

        this.bubble.dataset.placement = placement
        this.bubble.style.left = `${x}px`
        this.bubble.style.top = `${y}px`
    }

    private resolvePlacement(rect: DOMRect, preference: TourPlacement): Exclude<TourPlacement, 'auto'> {
        if (preference !== 'auto') {
            return preference
        }
        if (rect.top > window.innerHeight * 0.45) {
            return 'top'
        }
        return 'bottom'
    }
}

function normalizeTourOptions(options: Partial<TourOptions>): Partial<TourOptions> {
    const steps = options.steps as unknown
    return typeof steps === 'string' ? { ...options, steps: JSON.parse(steps) as TourStep[] } : options
}
