import { Component } from "../../core/component";
import { getInstance } from "../../core/instances";
import { mergeOptions, readDataOptions, type PlainObject } from "../../core/options";

export interface ScrollSpyOptions extends PlainObject {
    offset: number
    target: string
}

interface SpyTarget {
    selector: string
    top: number
}

export class ScrollSpy extends Component<ScrollSpyOptions> {
    static readonly componentName = 'scrollspy'
    static readonly selector = '[data-spy="scroll"], [data-kui-spy="scroll"]'
    static readonly defaults: ScrollSpyOptions = {
        offset: 10,
        target: ''
    }
    private targets: SpyTarget[] = []
    private activeTarget: string | null = null

    private constructor(element: HTMLElement, options: Partial<ScrollSpyOptions> = {}) {
        super(element, ScrollSpy.componentName, mergeOptions(ScrollSpy.defaults, options))
        this.refresh()
        this.listen(this.element === document.body ? window : this.element, 'scroll', () => this.process())
        this.process()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<ScrollSpyOptions> = {}): ScrollSpy {
        const element = ScrollSpy.resolveElement(target)
        return (
            getInstance<ScrollSpy>(element, ScrollSpy.componentName) ?? new ScrollSpy(element, { ... readDataOptions<ScrollSpyOptions>(element), ...options})
        )
    }

    refresh(): void {
        const nav = this.options.target ? document.querySelector<HTMLElement>(this.options.target) : document.body
        // 以滚动容器的内容原点为基准度量锚点位置，
        // 这样锚点与 scrollTop 处于同一坐标系，不受中间布局祖先（定位/contain）影响
        const containerTop = this.element === document.body ? 0 : this.element.getBoundingClientRect().top
        const scrolled = this.getScrollTop()
        this.targets = Array.from(nav?.querySelectorAll<HTMLAnchorElement>('.nav li > a, .nav a, a[data-target]') ?? [])
        .map((anchor) => {
            const selector = anchor.dataset.target ?? anchor.getAttribute('href') ?? ''
            const target = selector.startsWith('#') ? document.querySelector<HTMLElement>(selector) : null
            if (!target) {
                return null
            }

            return { selector, top: target.getBoundingClientRect().top - containerTop + scrolled }
        })
        .filter((target): target is SpyTarget => target !== null)
        .sort((left, right) => left.top - right.top)
    }

    process(): void {
        if (this.targets.length === 0) {
            return
        }

        const scrollTop = this.getScrollTop() + this.options.offset
        const nextTarget = this.targets.reduce((active, target) => (scrollTop >= target.top ? target : active), this.targets[0]).selector
        if (nextTarget !== this.activeTarget) {
            this.activate(nextTarget)
        }
    }

    activate(selector: string): void {
        this.activeTarget = selector
        this.clear()
        const nav = this.options.target ? document.querySelector<HTMLElement>(this.options.target) : document.body
        nav?.querySelectorAll<HTMLAnchorElement>(`a[href="${selector}"], a[data-target="${selector}"]`).forEach((anchor) => {
            anchor.closest('li')?.classList.add('active')
            anchor.classList.add('active')
            anchor.dispatchEvent(new CustomEvent('activate.kui.scrollspy', { bubbles: true }))
            anchor.dispatchEvent(new CustomEvent('kui:scrollspy:activate', { bubbles: true }))
        })
    }

    clear(): void {
        const nav = this.options.target ? document.querySelector<HTMLElement>(this.options.target) : document.body
        nav?.querySelectorAll('.active').forEach((element) => element.classList.remove('active'))
    }

    private getScrollTop(): number {
        if (this.element === document.body) {
            return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop
        }
        return this.element.scrollTop
    }
}

export function bindScrollSpyDataApi(root: ParentNode = document): () => void {
    root.querySelectorAll<HTMLElement>(ScrollSpy.selector).forEach((element) => ScrollSpy.getOrCreate(element))
    return () => undefined
}
