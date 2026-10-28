import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export interface OrgNode {
    /** 节点 id */
    id: string
    /** 姓名 / 名称 */
    name: string
    /** 岗位 / 说明 */
    title?: string
    /** 头像或图标 class */
    avatar?: string
    /** 头像图片地址；优先于 avatar 图标 */
    image?: string
    /** 语义色，用于区分层级与职能 */
    tone?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
    /** 子节点 */
    children?: OrgNode[]
}

export interface OrgChartOptions extends PlainObject {
    /** 组织数据 */
    items: OrgNode[]
    /** 渲染方向 */
    direction: 'vertical' | 'horizontal'
    /** 是否允许折叠 */
    collapsible: boolean
    /** 节点点击回调 */
    onSelect?: (node: OrgNode) => void
}

/**
 * 组织关系图。
 * 用 JSON 渲染多层结构，横向 / 竖向两种走向；
 * 不同层级用不同标记与颜色区分，连接线只表达归属关系。
 */
export class OrgChart extends Component<OrgChartOptions> {
    static readonly componentName = 'org-chart'
    static readonly selector = '[data-kui-org-chart]'
    static readonly defaults: OrgChartOptions = {
        items: [],
        direction: 'vertical',
        collapsible: true,
    }

    private lines: SVGSVGElement | null = null
    private resizeObserver: ResizeObserver | null = null

    private constructor(element: HTMLElement, options: Partial<OrgChartOptions> = {}) {
        super(element, OrgChart.componentName, mergeOptions(OrgChart.defaults, normalizeOrgChartOptions(options)))
        this.render()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<OrgChartOptions> = {}): OrgChart {
        const element = OrgChart.resolveElement(target)
        return (
            getInstance<OrgChart>(element, OrgChart.componentName) ??
            new OrgChart(element, { ...readDataOptions<OrgChartOptions>(element), ...options })
        )
    }

    setItems(items: OrgNode[]): void {
        this.options.items = items
        this.render()
    }

    setDirection(direction: 'vertical' | 'horizontal'): void {
        this.options.direction = direction
        this.render()
    }

    /** 折叠 / 展开全部：直接切换带有子节点的节点块 */
    toggleAll(collapsed: boolean): void {
        this.element.querySelectorAll<HTMLElement>('[data-org-item]').forEach((item) => {
            if (!item.querySelector(':scope > .kui-org-chart__level') || item.dataset.orgCollapsed === String(collapsed)) {
                return
            }
            item.dataset.orgCollapsed = String(collapsed)
            item.querySelector<HTMLElement>(':scope > .kui-org-chart__node')?.classList.toggle('is-collapsed', collapsed)
        })
        window.requestAnimationFrame(() => this.drawLines())
    }

    private render(): void {
        const { items, direction } = this.options
        this.element.classList.add('kui-org-chart')
        this.element.classList.toggle('kui-org-chart--horizontal', direction === 'horizontal')
        this.element.setAttribute('role', 'tree')

        const list = document.createElement('ul')
        list.className = 'kui-org-chart__level'
        list.setAttribute('role', 'group')
        items.forEach((node) => list.append(this.renderNode(node, 1)))
        this.element.replaceChildren(list)
        if (!this.resizeObserver && typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.drawLines())
            this.resizeObserver.observe(this.element)
        }
        window.requestAnimationFrame(() => this.drawLines())
    }

    private renderNode(node: OrgNode, level: number): HTMLElement {
        const item = document.createElement('li')
        item.className = 'kui-org-chart__item'
        item.dataset.orgItem = node.id
        item.dataset.orgLevel = String(level)
        item.setAttribute('role', 'treeitem')

        const card = document.createElement('div')
        card.className = 'kui-org-chart__node'
        if (node.tone && node.tone !== 'default') {
            card.classList.add(`is-${node.tone}`)
        }
        const hasChildren = Boolean(node.children?.length)
        card.innerHTML = `
            <span class="kui-org-chart__avatar">${
                node.image
                    ? `<img src="${node.image}" alt="" loading="lazy">`
                    : node.avatar
                        ? `<i class="${node.avatar}" aria-hidden="true"></i>`
                        : node.name.slice(0, 1)
            }</span>
            <span class="kui-org-chart__info">
                <strong>${node.name}</strong>
                ${node.title ? `<small>${node.title}</small>` : ''}
            </span>
            ${hasChildren ? '<i class="fa fa-angle-down kui-org-chart__chevron" aria-hidden="true"></i>' : ''}
        `
        card.tabIndex = 0
        card.addEventListener('click', () => {
            if (hasChildren) {
                const collapsed = item.dataset.orgCollapsed === 'true'
                item.dataset.orgCollapsed = String(!collapsed)
                card.classList.toggle('is-collapsed', !collapsed)
                window.requestAnimationFrame(() => this.drawLines())
            }
            this.options.onSelect?.(node)
            this.emit('kui:org-chart:select', { node })
        })
        item.append(card)

        if (node.children?.length) {
            const children = document.createElement('ul')
            children.className = 'kui-org-chart__level'
            children.setAttribute('role', 'group')
            node.children.forEach((child) => children.append(this.renderNode(child, level + 1)))
            item.append(children)
        }

        return item
    }

    /**
     * 用 SVG 画正交连接线。
     * 每个父节点只画一条主干、一条横杆和每条子节点的短竖线，避免逐条路径重叠造成“双线”。
     */
    private drawLines(): void {
        const namespace = 'http://www.w3.org/2000/svg'
        const base = this.element.getBoundingClientRect()
        const width = Math.max(this.element.scrollWidth, this.element.clientWidth)
        const height = Math.max(this.element.scrollHeight, this.element.clientHeight)
        const svg = this.lines ?? document.createElementNS(namespace, 'svg')
        svg.classList.add('kui-org-chart__lines')
        svg.setAttribute('width', String(width))
        svg.setAttribute('height', String(height))
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
        svg.setAttribute('aria-hidden', 'true')
        svg.replaceChildren()

        const horizontal = this.element.classList.contains('kui-org-chart--horizontal')
        const toLocal = (rect: DOMRect) => ({
            left: rect.left - base.left - this.element.clientLeft + this.element.scrollLeft,
            top: rect.top - base.top - this.element.clientTop + this.element.scrollTop,
            width: rect.width,
            height: rect.height,
        })
        const append = (d: string): void => {
            const path = document.createElementNS(namespace, 'path')
            path.setAttribute('d', d)
            path.setAttribute('fill', 'none')
            path.style.stroke = 'var(--kui-color-border)'
            path.setAttribute('stroke-width', '1.25')
            svg.append(path)
        }

        this.element.querySelectorAll<HTMLElement>('[data-org-item]').forEach((item) => {
            const level = item.querySelector<HTMLElement>(':scope > .kui-org-chart__level')
            const node = item.querySelector<HTMLElement>(':scope > .kui-org-chart__node')
            if (!level || !node || item.dataset.orgCollapsed === 'true') {
                return
            }
            const parent = toLocal(node.getBoundingClientRect())
            const targets = Array.from(level.children)
                .map((child) =>
                    child instanceof HTMLElement
                        ? child.querySelector<HTMLElement>(':scope > .kui-org-chart__node')
                        : null,
                )
                .filter((card): card is HTMLElement => Boolean(card))
                .map((card) => toLocal(card.getBoundingClientRect()))
            if (!targets.length) {
                return
            }

            if (horizontal) {
                const startX = parent.left + parent.width
                const startY = parent.top + parent.height / 2
                const midX = startX + Math.max((Math.min(...targets.map((target) => target.left)) - startX) / 2, 12)
                const childY = targets.map((target) => target.top + target.height / 2)
                append(`M ${startX} ${startY} H ${midX}`)
                append(`M ${midX} ${Math.min(...childY)} V ${Math.max(...childY)}`)
                targets.forEach((target) => append(`M ${midX} ${target.top + target.height / 2} H ${target.left}`))
            } else {
                const startX = parent.left + parent.width / 2
                const startY = parent.top + parent.height
                const midY = startY + Math.max((Math.min(...targets.map((target) => target.top)) - startY) / 2, 12)
                const childX = targets.map((target) => target.left + target.width / 2)
                append(`M ${startX} ${startY} V ${midY}`)
                append(`M ${Math.min(...childX)} ${midY} H ${Math.max(...childX)}`)
                targets.forEach((target) => append(`M ${target.left + target.width / 2} ${midY} V ${target.top}`))
            }
        })

        if (!this.lines || !this.lines.isConnected) {
            this.element.insertBefore(svg, this.element.firstChild)
            this.lines = svg
        }
    }

    override dispose(): void {
        this.resizeObserver?.disconnect()
        this.resizeObserver = null
        super.dispose()
    }
}

function normalizeOrgChartOptions(options: Partial<OrgChartOptions>): Partial<OrgChartOptions> {
    const items = options.items as unknown
    return typeof items === 'string' ? { ...options, items: JSON.parse(items) as OrgNode[] } : options
}
