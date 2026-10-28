import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export type CarouselEffect = 'slide' | 'fade'

export interface CarouselOptions extends PlainObject {
    /** 当前页下标 */
    active: number
    /** 自动播放 */
    autoplay: boolean
    /** 播放间隔（毫秒） */
    interval: number
    /** 切换效果 */
    effect: CarouselEffect
    /** 循环播放 */
    loop: boolean
    /** auto：跟随当前页高度；fixed：固定首屏高度 */
    height: 'auto' | 'fixed'
    /** 左右控制按钮 */
    showControls: boolean
    /** 底部指示器 */
    showIndicators: boolean
    /** 悬停暂停 */
    pauseOnHover: boolean
    /** 图文说明位置 */
    captionPosition: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'center'
    /** 图文说明字号 */
    captionSize: 'sm' | 'md' | 'lg'
    /** 切换回调 */
    onChange?: (index: number) => void
}

/**
 * 轮播。
 * 支持单图 / 多图 / 渐变 / 自动播放 / 可变高度 / 视频，
 * 所有参数可在运行时通过 setOptions 调整（展示站的设置面板即用它驱动）。
 */
export class Carousel extends Component<CarouselOptions> {
    static readonly componentName = 'carousel'
    static readonly selector = '[data-kui-carousel]'
    static readonly defaults: CarouselOptions = {
        active: 0,
        autoplay: true,
        interval: 3600,
        effect: 'slide',
        loop: true,
        height: 'auto',
        showControls: true,
        showIndicators: true,
        pauseOnHover: true,
        captionPosition: 'bottom-left',
        captionSize: 'md',
    }

    private track!: HTMLElement
    private slides: HTMLElement[] = []
    private indicators: HTMLElement[] = []
    private timer: number | null = null

    private constructor(element: HTMLElement, options: Partial<CarouselOptions> = {}) {
        super(element, Carousel.componentName, mergeOptions(Carousel.defaults, options))
        this.mount()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<CarouselOptions> = {}): Carousel {
        const element = Carousel.resolveElement(target)
        return (
            getInstance<Carousel>(element, Carousel.componentName) ??
            new Carousel(element, { ...readDataOptions<CarouselOptions>(element), ...options })
        )
    }

    /** 幻灯片数量 */
    get length(): number {
        return this.slides.length
    }

    /** 当前下标 */
    get active(): number {
        return this.options.active
    }

    to(index: number): void {
        const count = this.slides.length
        if (!count) {
            return
        }
        const next = this.options.loop ? (index + count) % count : Math.min(Math.max(index, 0), count - 1)
        if (next === this.options.active) {
            return
        }
        this.options.active = next
        this.render()
        this.options.onChange?.(next)
        this.emit('kui:carousel:change', { index: next })
    }

    next(): void {
        this.to(this.options.active + 1)
    }

    prev(): void {
        this.to(this.options.active - 1)
    }

    play(): void {
        this.pause()
        if (!this.options.autoplay || this.slides.length < 2) {
            return
        }
        this.timer = window.setInterval(() => this.next(), Math.max(this.options.interval, 800))
    }

    pause(): void {
        if (this.timer !== null) {
            window.clearInterval(this.timer)
            this.timer = null
        }
    }

    /** 运行时调整参数（设置面板） */
    setOptions(options: Partial<CarouselOptions>): void {
        this.options = mergeOptions(this.options, options)
        this.mount()
    }

    dispose(): void {
        this.pause()
        super.dispose()
    }

    private mount(): void {
        const { effect, showControls, showIndicators, pauseOnHover } = this.options
        this.element.classList.add('kui-carousel')
        this.element.classList.toggle('kui-carousel--fade', effect === 'fade')
        this.element.classList.toggle('kui-carousel--controls', showControls)
        this.element.classList.toggle('kui-carousel--indicators', showIndicators)
        this.element.classList.toggle('kui-carousel--fixed', this.options.height === 'fixed')
        this.captionClasses().forEach((name) => this.element.classList.remove(name))
        this.element.classList.add(`kui-carousel--caption-${this.options.captionPosition}`)
        this.element.classList.add(`kui-carousel--caption-${this.options.captionSize}`)

        // 结构规整：把内容包进 track，幻灯片统一加类名
        this.track =
            this.element.querySelector<HTMLElement>('.kui-carousel__track') ?? this.createTrack()
        this.slides = Array.from(this.track.children).filter((node): node is HTMLElement => node instanceof HTMLElement)
        this.slides.forEach((slide) => slide.classList.add('kui-carousel__slide'))

        this.element.querySelector('.kui-carousel__control')?.remove()
        this.element.querySelector('.kui-carousel__indicators')?.remove()
        if (showControls) {
            this.element.append(this.createControl('prev', 'fa fa-angle-left', () => this.prev()), this.createControl('next', 'fa fa-angle-right', () => this.next()))
        }
        if (showIndicators) {
            this.indicators = this.slides.map((_, index) => {
                const dot = document.createElement('button')
                dot.type = 'button'
                dot.className = 'kui-carousel__indicator'
                dot.dataset.carouselTo = String(index)
                dot.setAttribute('role', 'tab')
                dot.setAttribute('aria-label', `第 ${index + 1} 张`)
                this.listen(dot, 'click', () => this.to(index))
                return dot
            })
            const list = document.createElement('div')
            list.className = 'kui-carousel__indicators'
            list.setAttribute('role', 'tablist')
            list.setAttribute('aria-label', '轮播图切换')
            list.append(...this.indicators)
            this.element.append(list)
        } else {
            this.indicators = []
        }

        if (pauseOnHover) {
            this.listen(this.element, 'pointerenter', () => this.pause())
            this.listen(this.element, 'pointerleave', () => this.play())
        }

        this.render()
        this.play()
    }

    private captionClasses(): string[] {
        return ['bottom-left', 'bottom-right', 'top-left', 'top-right', 'center']
            .map((position) => `kui-carousel--caption-${position}`)
            .concat(['sm', 'md', 'lg'].map((size) => `kui-carousel--caption-${size}`))
    }

    private createTrack(): HTMLElement {
        const track = document.createElement('div')
        track.className = 'kui-carousel__track'
        const children = Array.from(this.element.children)
        children.forEach((child) => track.append(child))
        this.element.append(track)
        return track
    }

    private createControl(direction: 'prev' | 'next', icon: string, handler: () => void): HTMLElement {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = `kui-carousel__control kui-carousel__control--${direction}`
        button.innerHTML = `<i class="${icon}" aria-hidden="true"></i>`
        button.setAttribute('aria-label', direction === 'prev' ? '上一张' : '下一张')
        this.listen(button, 'click', handler)
        return button
    }

    private render(): void {
        const { active, effect, height } = this.options
        const index = Math.min(Math.max(active, 0), Math.max(this.slides.length - 1, 0))
        this.options.active = index

        this.slides.forEach((slide, position) => {
            slide.classList.toggle('is-active', position === index)
            slide.setAttribute('aria-hidden', position === index ? 'false' : 'true')
        })
        this.indicators.forEach((dot, position) => {
            dot.classList.toggle('is-active', position === index)
            dot.setAttribute('aria-selected', position === index ? 'true' : 'false')
        })

        if (effect === 'slide') {
            this.track.style.transform = `translate3d(-${index * 100}%, 0, 0)`
        } else {
            this.track.style.transform = ''
        }

        // 视频：离开当前页即暂停，避免声音与解码开销
        this.slides.forEach((slide, position) => {
            slide.querySelectorAll<HTMLVideoElement>('video').forEach((video) => {
                if (position === index) {
                    if (video.dataset.carouselAutoplay === 'true') {
                        void video.play().catch(() => undefined)
                    }
                } else if (!video.paused) {
                    video.pause()
                }
            })
        })

        // 位移模式由内容撑开；淡入模式绝对定位，需要用当前页高度或固定高度撑住轨道
        if (effect === 'fade' && height === 'auto') {
            window.requestAnimationFrame(() => this.syncHeight())
        } else {
            this.track.style.height = ''
        }
    }

    private syncHeight(): void {
        const active = this.slides[this.options.active]
        if (!active) {
            return
        }
        const height = active.getBoundingClientRect().height
        if (height <= 0) {
            // 图片尚未解码完成，等 load 后补一次测量
            active.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
                if (!image.complete) {
                    image.addEventListener('load', () => this.syncHeight(), { once: true })
                }
            })
            return
        }
        this.track.style.height = `${height}px`
    }
}
