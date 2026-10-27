import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export interface RatingOptions extends PlainObject {
    cancel: boolean
    cancelClass: string
    cancelHint: string
    cancelOff: string
    cancelOn: string
    click?: (score: number | null, event?: Event) => void
    half: boolean
    hints: string[]
    mouseover?: (score: number | null, event?: Event) => void
    number: number
    readOnly: boolean
    score?: number
    scoreName: string
    starHalf: string
    starOff: string
    starOn: string
    starType: 'class' | 'text'
    target?: string
    targetFormat: string
    targetKeep: boolean
    targetText: string
    targetType: 'hint' | 'score'
}


export type RatingProps = RatingOptions

export class Rating extends Component<RatingOptions> {
    static readonly componentName = 'rating'
    static readonly selector = '[data-plugin="rating"], [data-plugin="raty"], [data-kui-rating], .rating'
    static readonly defaults: RatingOptions = {
        cancel: false,
        cancelClass: 'raty-cancel',
        cancelHint: '取消评级！',
        cancelOff: 'fa fa-minus-circle',
        cancelOn: 'fa fa-minus-circle orange-600',
        half: false,
        hints: [ '10', '20', '30', '40', '50', '60', '70', '80', '90', '100'],
        number: 10,
        readOnly: false,
        scoreName: 'score',
        starHalf: 'fa fa-star-half-empty orange-600',
        starOff: 'fa fa-star',
        starOn: 'fa fa-star orange-600',
        starType: 'class',
        targetFormat: '{score}',
        targetKeep: false,
        targetText: '',
        targetType: 'hint',
    }

    private scoreInput!: HTMLInputElement
    private currentScore: number | null = null

    private constructor(element: HTMLElement, options: Partial<RatingOptions> = {}) {
        super(element, Rating.componentName, mergeOptions(Rating.defaults, normalizeRatingOptions(options)))
        this.currentScore = this.normalizeScore(this.options.score ?? null)
        this.bindEvents()
        this.render()
        this.applyScore(this.currentScore)
        this.updateTarget(this.currentScore, this.options.targetKeep)
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<RatingOptions> = {}): Rating {
        const element = Rating.resolveElement(target)
        return getInstance<Rating>(element, Rating.componentName) ?? new Rating(element, {
                ...readDataOptions<RatingOptions>(element),
                ...options,
        })
    }

    score(value?: number | null): number | null {
        if (arguments.length === 0) {
            return this.currentScore
        }
        this.setScore(value ?? null)
        return this.currentScore
    }

    setScore(value: number | null): void {
        if (this.options.readOnly) {
            return
        }
        this.currentScore = this.normalizeScore(value)
        this.applyScore(this.currentScore)
        this.updateTarget(this.currentScore, true)
        this.emit('kui:rating:change', { score: this.currentScore })
    }

    readOnly(value: boolean): void {
        this.options.readOnly = value
        this.element.classList.toggle('is-readonly', value)
        this.syncAccessibility()
    }

    cancel(isClick = false): void {
        this.setScore(null)
        if (isClick) {
            this.options.click?.(null)
        }
    }

    reload(): void {
        this.render()
        this.applyScore(this.currentScore)
    }

    private render(): void {
        this.element.replaceChildren()
        this.element.classList.add('rating')
        if (this.options.cancel) {
            const cancel = this.createIcon(this.options.cancelOff, 'X', this.options.cancelHint)
            cancel.classList.add(this.options.cancelClass)
            cancel.dataset.ratingCancel = 'true'
            cancel.setAttribute('role', 'button')
            this.element.append(cancel)
        }

        for (let index = 1; index <= Math.max(1, this.options.number); index += 1) {
            const star = this.createIcon(this.options.starOff, String(index), this.options.hints[index - 1] ?? String(index))
            star.dataset.score = String(index)
            this.element.append(star)
        }

        this.scoreInput = document.createElement('input')
        this.scoreInput.type = 'hidden'
        this.scoreInput.name = this.options.scoreName
        this.element.append(this.scoreInput)
        this.syncAccessibility()
    }

    private createIcon(className: string, text: string, title: string): HTMLElement {
        const icon = document.createElement('i')
        icon.className = className
        icon.textContent = this.options.starType === 'text' ? text : ''
        icon.title = title
        return icon
    }

    private bindEvents(): void {
        this.listen(this.element, this.options.half ? 'mousemove' : 'mouseover', (event) => {
            const star = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-score]') : null
            if (star) {
                this.previewScore(star, event)
            }
        })
        this.listen(this.element, 'click', (event) => {
            const target = event.target instanceof Element ? event.target : null
            if (!target || this.options.readOnly) {
                return
            }
            if(target.closest('[data-rating-cancel]')) {
                this.setScore(null)
                this.options.click?.(null, event)
                return
            }
            const star = target.closest<HTMLElement>('[data-score]')
            if (star) {
                this.commitScore(star, event)
            }
        })
        this.listen(this.element, 'keydown', (event) => this.handleKeydown(event))
    }

    private handleKeydown(event: KeyboardEvent): void {
        if (this.options.readOnly) {
            return
        }
        if(event.target instanceof Element && event.target.closest('[data-rating-cancel]')) {
            if(event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                this.setScore(null)
                this.options.click?.(null, event)
            }
            return
        }

        const step = this.options.half ? 0.5 : 1
        let next = this.currentScore ?? step
        if (event.key === 'Home') {
            next = step
        } else if (event.key === 'End') {
            next = this.options.number
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            next += step
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
            next -= step
        } else if (event.key !== ' ' && event.key !== 'Enter') {
            return
        }

        event.preventDefault()
        this.setScore(next)
        this.options.click?.(this.currentScore, event)
        if (!this.options.half && this.currentScore !== null) {
            this.element.querySelector<HTMLElement>(`[data-score="${this.currentScore}"]`)?.focus()
        }
    }

    private previewScore(star: HTMLElement, event: Event): void {
        if (this.options.readOnly) {
            return
        }
        const score = this.scoreFromStar(star, event)
        this.applyScore(score)
        this.updateTarget(score, true)
        this.options.mouseover?.(score, event)
    }

    private commitScore(star: HTMLElement, event: Event): void {
        const score = this.scoreFromStar(star, event)
        this.currentScore = score
        this.applyScore(score)
        this.updateTarget(score, true)
        this.options.click?.(score, event)
        this.emit('kui:rating:change', { score })
    }

    private scoreFromStar(star: HTMLElement, event: Event): number {
        const score = Number(star.dataset.score ?? 0)
        if (!this.options.half || !(event instanceof MouseEvent)) {
            return score
        }
        const rect = star.getBoundingClientRect()
        return event.clientX - rect.left <= rect.width / 2 ? score - 0.5 : score
    }

    private applyScore(score: number | null): void {
        this.element.querySelectorAll<HTMLElement>('[data-score]').forEach((star) => {
            const starScore = Number(star.dataset.score)
            star.className = starScore <= (score ?? 0) ? this.options.starOn : this.options.starOff
            if (score !== null && score > starScore - 1 && score < starScore) {
                star.className = this.options.starHalf
            }
        })
        this.scoreInput.value = score === null ? '' : String(score)
        this.syncAccessibility()
    }

    private syncAccessibility(): void {
        const baseLabel = this.element.dataset.ratingLabel ?? this.element.getAttribute('aria-label') ?? '评分'
        const stars = Array.from(this.element.querySelectorAll<HTMLElement>('[data-score]'))
        const cancel = this.element.querySelector<HTMLElement>('[data-rating-cancel]')

        cancel?.setAttribute('tabindex', this.options.readOnly ? '-1' : '0')
        if(this.options.readOnly) {
            this.element.setAttribute('role', 'img')
            this.element.setAttribute('aria-label', `${baseLabel} ${this.currentScore ?? 0}/${this.options.number}`)
            this.element.removeAttribute('tabindex')
            stars.forEach((star) => { star.removeAttribute('role'); star.tabIndex = -1; star.setAttribute('aria-hidden', 'true') })
        } else if (this.options.half) {
            this.element.setAttribute('role', 'slider')
            this.element.setAttribute('aria-label', baseLabel)
            this.element.setAttribute('aria-valuemin', '0')
            this.element.setAttribute('aria-valuemax', String(this.options.number))
            this.element.setAttribute('aria-valuenow', String(this.currentScore ?? 0))
            this.element.setAttribute('aria-valuetext', `${this.currentScore ?? 0}/${this.options.number}`)
            this.element.tabIndex = 0
            stars.forEach((star) => { star.tabIndex = -1; star.setAttribute('aria-hidden', 'true') })
        } else {
            this.element.setAttribute('role', 'radiogroup')
            this.element.setAttribute('aria-label', baseLabel)
            this.element.removeAttribute('tabindex')
            const activeScore = this.currentScore ?? 1
            stars.forEach((star) => {
                const score = Number(star.dataset.score)
                star.removeAttribute('aria-hidden')
                star.setAttribute('role', 'radio')
                star.setAttribute('aria-label', this.options.hints[score - 1] ?? `${score} 分`)
                star.setAttribute('aria-checked', String(score === this.currentScore))
                star.tabIndex = score === activeScore ? 0 : -1
            })
        }
    }

    private normalizeScore(value: number | null): number | null {
        if (value === null || !Number.isFinite(value)) {
            return null
        }
        const step = this.options.half ? 0.5 : 1
        return clamp(Math.round(value / step) * step, 0, Math.max(1, this.options.number))
    }

    private updateTarget(score: number | null, keep: boolean): void {
        if (!this.options.target) return
        const target = document.querySelector<HTMLElement | HTMLInputElement>(this.options.target)
        if(!target) return
        let value = this.options.targetText
        if (keep && score !== null) {
            value = this.options.targetType === 'hint' ? this.options.hints[Math.ceil(score) - 1] ?? String(score) : String(score)
            value = this.options.targetFormat.replace(`{score}`, value)
        }
        if (target instanceof HTMLInputElement) target.value = value
        else target.textContent = value
    }
}

function normalizeRatingOptions(options: Partial<RatingOptions>) : Partial<RatingOptions> {
    const hints = options.hints as unknown
    return typeof hints === 'string' ? { ...options, hints: hints.split(',')} : options
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}
