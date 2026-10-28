import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export type TimelineTone = 'default' | 'primary' | 'success' | 'warning' | 'danger'

export interface TimelineItem {
    /** 主标题 */
    title: string
    /** 时间或副标题 */
    time?: string
    /** 正文 */
    description?: string
    /** 节点图标 */
    icon?: string
    /** 节点语义色 */
    tone?: TimelineTone
}

export interface TimelineOptions extends PlainObject {
    /** 时间线数据 */
    items: TimelineItem[]
    /** 交替左右布局 */
    alternating: boolean
    /** 紧凑模式 */
    dense: boolean
}

/**
 * 时间线。
 * 用一条轴线串起事件序列，节点颜色只承担状态语义，不做装饰。
 */
export class Timeline extends Component<TimelineOptions> {
    static readonly componentName = 'timeline'
    static readonly selector = '[data-kui-timeline]'
    static readonly defaults: TimelineOptions = {
        items: [],
        alternating: false,
        dense: false,
    }

    private constructor(element: HTMLElement, options: Partial<TimelineOptions> = {}) {
        super(element, Timeline.componentName, mergeOptions(Timeline.defaults, normalizeTimelineOptions(options)))
        this.render()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<TimelineOptions> = {}): Timeline {
        const element = Timeline.resolveElement(target)
        return (
            getInstance<Timeline>(element, Timeline.componentName) ??
            new Timeline(element, { ...readDataOptions<TimelineOptions>(element), ...options })
        )
    }

    setItems(items: TimelineItem[]): void {
        this.options.items = items
        this.render()
    }

    private render(): void {
        const { items, alternating, dense } = this.options
        this.element.classList.add('kui-timeline')
        this.element.classList.toggle('kui-timeline--alternating', alternating)
        this.element.classList.toggle('kui-timeline--dense', dense)
        this.element.setAttribute('role', 'list')

        this.element.replaceChildren(
            ...items.map((item) => {
                const node = document.createElement('div')
                node.className = 'kui-timeline__item'
                node.setAttribute('role', 'listitem')
                if (item.tone && item.tone !== 'default') {
                    node.classList.add(`is-${item.tone}`)
                }

                const dot = document.createElement('span')
                dot.className = 'kui-timeline__dot'
                dot.innerHTML = item.icon ? `<i class="${item.icon}" aria-hidden="true"></i>` : ''

                const body = document.createElement('div')
                body.className = 'kui-timeline__body'

                const title = document.createElement('p')
                title.className = 'kui-timeline__title'
                title.textContent = item.title

                const meta = document.createElement('p')
                meta.className = 'kui-timeline__meta'
                meta.textContent = item.time ?? ''

                body.append(title)
                if (item.time) {
                    body.append(meta)
                }
                if (item.description) {
                    const description = document.createElement('p')
                    description.className = 'kui-timeline__desc'
                    description.textContent = item.description
                    body.append(description)
                }

                node.append(dot, body)
                return node
            }),
        )
    }
}

function normalizeTimelineOptions(options: Partial<TimelineOptions>): Partial<TimelineOptions> {
    const items = options.items as unknown
    return typeof items === 'string' ? { ...options, items: JSON.parse(items) as TimelineItem[] } : options
}
