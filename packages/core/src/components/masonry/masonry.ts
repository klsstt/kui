import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export interface MasonryOptions extends PlainObject {
    /** 单列最小宽度，容器变宽时自动加列 */
    minColumnWidth: number
    /** 间距 */
    gap: number
    /** 固定列数，为 0 时按 minColumnWidth 自适应 */
    columns: number
}

/**
 * 瀑布流。
 * 按列高最短优先放置，纯布局计算，不改动子元素结构；
 * 容器尺寸变化时用 ResizeObserver 重排，适配移动端 / 平板 / 桌面。
 */
export class Masonry extends Component<MasonryOptions> {
    static readonly componentName = 'masonry'
    static readonly selector = '[data-kui-masonry]'
    static readonly defaults: MasonryOptions = {
        minColumnWidth: 180,
        gap: 16,
        columns: 0,
    }

    private observer: ResizeObserver | null = null

    private constructor(element: HTMLElement, options: Partial<MasonryOptions> = {}) {
        super(element, Masonry.componentName, mergeOptions(Masonry.defaults, options))
        element.classList.add('kui-masonry')
        this.listen(window, 'resize', () => this.layout())
        if (typeof ResizeObserver !== 'undefined') {
            this.observer = new ResizeObserver(() => this.layout())
            this.observer.observe(element)
        }
        this.layout()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<MasonryOptions> = {}): Masonry {
        const element = Masonry.resolveElement(target)
        return (
            getInstance<Masonry>(element, Masonry.componentName) ??
            new Masonry(element, { ...readDataOptions<MasonryOptions>(element), ...options })
        )
    }

    /** 重新排布 */
    layout(): void {
        const { minColumnWidth, gap, columns } = this.options
        const items = Array.from(this.element.children).filter((node): node is HTMLElement => node instanceof HTMLElement)
        if (!items.length) {
            this.element.style.height = ''
            return
        }

        const width = this.element.clientWidth
        const count = columns > 0 ? columns : Math.max(Math.floor((width + gap) / (minColumnWidth + gap)), 1)
        const columnWidth = (width - gap * (count - 1)) / count
        const heights = new Array<number>(count).fill(0)

        this.element.classList.add('is-positioned')
        items.forEach((item) => {
            const shortest = heights.indexOf(Math.min(...heights))
            item.style.width = `${columnWidth}px`
            item.style.transform = `translate3d(${shortest * (columnWidth + gap)}px, ${heights[shortest]}px, 0)`
            heights[shortest] += item.getBoundingClientRect().height + gap
        })

        this.element.style.height = `${Math.max(...heights) - gap}px`
    }

    dispose(): void {
        this.observer?.disconnect()
        this.observer = null
        super.dispose()
    }
}
