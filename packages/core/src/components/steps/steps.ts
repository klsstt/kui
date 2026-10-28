import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export type StepStatus = 'wait' | 'process' | 'finish' | 'error'

export interface StepItem {
    /** 标题 */
    title: string
    /** 描述 */
    description?: string
    /** 图标 class，缺省显示序号 */
    icon?: string
    /** 单独指定状态，缺省按 current 推导 */
    status?: StepStatus
}

export interface StepsOptions extends PlainObject {
    /** 当前步骤下标 */
    current: number
    /** 排列方向 */
    direction: 'horizontal' | 'vertical'
    /** 步骤数据 */
    items: StepItem[]
    /** 尺寸 */
    size: 'small' | 'medium'
    /** 是否允许点击切换 */
    clickable: boolean
    /** 切换回调 */
    onChange?: (index: number, item: StepItem) => void
}

/**
 * 步骤条。
 * 用于把长流程拆成可被快速觉察的阶段：当前节点高亮，已完成节点带对勾，
 * 失败节点单独着色，符合「清晰 / 稳定 / 克制」的设计价值观。
 */
export class Steps extends Component<StepsOptions> {
    static readonly componentName = 'steps'
    static readonly selector = '[data-kui-steps]'
    static readonly defaults: StepsOptions = {
        current: 0,
        direction: 'horizontal',
        items: [],
        size: 'medium',
        clickable: true,
    }

    private constructor(element: HTMLElement, options: Partial<StepsOptions> = {}) {
        super(element, Steps.componentName, mergeOptions(Steps.defaults, normalizeStepsOptions(options)))
        // 事件委托：render 会重建 DOM，委托可避免监听器堆积
        this.listen(this.element, 'click', (event) => {
            const step = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-step-index]')
            if (step && this.options.clickable) {
                this.goTo(Number(step.dataset.stepIndex ?? 0))
            }
        })
        this.listen(this.element, 'keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') {
                return
            }
            const step = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-step-index]')
            if (step && this.options.clickable) {
                event.preventDefault()
                this.goTo(Number(step.dataset.stepIndex ?? 0))
            }
        })
        this.render()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<StepsOptions> = {}): Steps {
        const element = Steps.resolveElement(target)
        return (
            getInstance<Steps>(element, Steps.componentName) ??
            new Steps(element, { ...readDataOptions<StepsOptions>(element), ...options })
        )
    }

    /** 当前步骤下标 */
    get current(): number {
        return this.options.current
    }

    goTo(index: number): void {
        const next = Math.min(Math.max(index, 0), Math.max(this.options.items.length - 1, 0))
        if (next === this.options.current) {
            return
        }
        this.options.current = next
        this.render()
        this.options.onChange?.(next, this.options.items[next])
        this.emit('kui:steps:change', { index: next })
    }

    next(): void {
        this.goTo(this.options.current + 1)
    }

    prev(): void {
        this.goTo(this.options.current - 1)
    }

    /** 用新数据重绘（保持当前下标） */
    setItems(items: StepItem[]): void {
        this.options.items = items
        this.render()
    }

    private render(): void {
        const { items, direction, size, current } = this.options
        this.element.classList.add('kui-steps')
        this.element.classList.toggle('kui-steps--vertical', direction === 'vertical')
        this.element.classList.toggle('kui-steps--small', size === 'small')
        this.element.setAttribute('role', 'list')

        this.element.replaceChildren(
            ...items.map((item, index) => {
                const status = item.status ?? (index < current ? 'finish' : index === current ? 'process' : 'wait')
                const step = document.createElement('div')
                step.className = 'kui-step'
                step.classList.add(`is-${status}`)
                step.setAttribute('role', 'listitem')
                step.setAttribute('aria-current', status === 'process' ? 'step' : 'false')
                step.dataset.stepIndex = String(index)

                const marker = document.createElement('span')
                marker.className = 'kui-step__marker'
                if (item.icon) {
                    marker.innerHTML = `<i class="${item.icon}" aria-hidden="true"></i>`
                } else if (status === 'finish') {
                    marker.innerHTML = '<i class="fa fa-check" aria-hidden="true"></i>'
                } else if (status === 'error') {
                    marker.innerHTML = '<i class="fa fa-close" aria-hidden="true"></i>'
                } else {
                    marker.textContent = String(index + 1)
                }

                const content = document.createElement('div')
                content.className = 'kui-step__content'
                const title = document.createElement('span')
                title.className = 'kui-step__title'
                title.textContent = item.title
                content.append(title)
                if (item.description) {
                    const description = document.createElement('span')
                    description.className = 'kui-step__desc'
                    description.textContent = item.description
                    content.append(description)
                }

                if (this.options.clickable) {
                    step.tabIndex = 0
                }
                step.append(marker, content)
                return step
            }),
        )
    }
}

function normalizeStepsOptions(options: Partial<StepsOptions>): Partial<StepsOptions> {
    const items = options.items as unknown
    return typeof items === 'string' ? { ...options, items: JSON.parse(items) as StepItem[] } : options
}
