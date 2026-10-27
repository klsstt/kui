import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export interface ColorPickerOptions extends PlainObject {
    colors: string[]
    lineCount: number
    optional: boolean
    pullMenuRight: boolean
    tileSize: number
    title?: string
    updateBackground?: string
    updateBorder?: string
    updateText?: string
    wrapper: string
}

export class ColorPicker extends Component<ColorPickerOptions> {
    static readonly componentName = 'colorPicker'
    static readonly selector = '[data-provide="colorpicker"], [data-plugin="colorpicker"], [data-kui-color-picker]'
    static readonly defaults: ColorPickerOptions = {
        colors: ['#00BCD4', '#388E3C', '#3280fc', '#3F51B5', '#9C27B0', '#795548', '#F57C00', '#F44336', '#E91E63'],
        lineCount: 5,
        optional: true,
        pullMenuRight: true,
        tileSize: 30,
        wrapper: 'btn-wrapper',
    }

    private picker!: HTMLElement
    private menu!: HTMLElement
    private button!: HTMLElement

    private constructor(element: HTMLElement, options: Partial<ColorPickerOptions> = {}) {
        super(element, ColorPicker.componentName, mergeOptions(ColorPicker.defaults, normalizeOptions(options)))
        this.render()
        this.bindEvents()
        this.setValue(this.getInputValue(), true)
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<ColorPickerOptions> = {}): ColorPicker {
        const element = ColorPicker.resolveElement(target)
        return (
            getInstance<ColorPicker>(element, ColorPicker.componentName) ??
            new ColorPicker(element, {...readDataOptions<ColorPickerOptions>(element), ...options})
        )
    }

    setValue(color: string, notSetInput = false): void {
        const hex = normalizeColor(color)
        this.menu.querySelectorAll('.cp-tile.active').forEach((tile) => tile.classList.remove('active'))

        if(hex) {
            this.button.style.background = hex
            this.button.style.borderColor = hex
            if(!notSetInput) {
                this.setInputValue(hex)
            }
            this.menu.querySelector<HTMLElement>(`.cp-tile[data-color="${hex}"]`)?.classList.add('active')
        } else {
            this.button.removeAttribute('style')
            if(!notSetInput) {
                this.setInputValue('')
            }
            this.menu.querySelector('.cp-tile.empty')?.classList.add('active')
        }

        this.updateTargets(hex)
        this.emit('colorchange', hex || null)
        this.emit('kui:color-picker:change', { color: hex || null })
    }

    private render(): void {
        this.picker = document.createElement('div')
        this.picker.className = `colorpicker ${this.options.wrapper}`
        this.picker.innerHTML = `
            <button type="button" class="btn dropdown-toggle"><span class="cp-title"></span><i class="ic"></i></button>
            <ul class="dropdown-menu clearfix"></ul>
        `
        this.button = this.picker.querySelector<HTMLButtonElement>('button') ?? document.createElement('button')
        this.menu = this.picker.querySelector<HTMLElement>('.dropdown-menu') ?? document.createElement('ul')
        this.menu.classList.toggle('pull-right', this.options.pullMenuRight)
        const title = this.picker.querySelector<HTMLElement>('.cp-title')
        if (title) {
            title.textContent = this.options.title ?? ''
            title.style.display = this.options.title ? '': 'none'
        }
        this.renderTiles()
        this.element.after(this.picker)
    }

    private renderTiles(): void {
        this.menu.innerHTML = ''
        this.options.colors.map(normalizeColor).filter(Boolean).forEach((color) => this.addTile(color))
        if (this.options.optional) {
            this.addTile('', true)
        }
        this.menu.style.width = `${Math.min(this.options.colors.length + (this.options.optional ? 1 : 0), this.options.lineCount) * this.options.tileSize + 6}px`
    }

    private addTile(color: string, empty = false): void {
        const item = document.createElement('li')
        item.style.width = `${this.options.tileSize}px`
        item.style.height = `${this.options.tileSize}px`
        const tile = document.createElement('a')
        tile.href = '###'
        tile.className = `cp-tile${empty ? ' empty' : ''}`
        if (color) {
            tile.dataset.color = color
            tile.style.background = color
            tile.style.borderColor = color
        }

        item.append(tile)
        this.menu.append(item)
    }

    private bindEvents(): void {
        this.listen(this.menu, 'click', (event) => {
            const target = event.target
            if (!(target instanceof Element)) {
                return
            }
            const tile = target.closest<HTMLElement>('.cp-tile')
            if (!tile) {
                return
            }
            event.preventDefault()
            this.setValue(tile.classList.contains('empty') ? '' : tile.dataset.color ?? '')
        })

        if(this.element instanceof HTMLInputElement) {
            this.listen(this.element, 'input', () => this.setValue(this.element instanceof HTMLInputElement ? this.element.value : '', true))
            this.listen(this.element, 'change', () => this.setValue(this.element instanceof HTMLInputElement ? this.element.value : '', true))
        }
    }

    private getInputValue(): string {
        return this.element instanceof HTMLInputElement ? this.element.value : ''
    }

    private setInputValue(value: string): void {
        if(this.element instanceof HTMLInputElement) {
            this.element.value = value
            this.element.dispatchEvent(new Event('change', { bubbles: true }))
        }
    }

    private updateTargets(color: string): void {
        if (this.options.updateBorder) {
            document.querySelectorAll<HTMLElement>(this.options.updateBorder).forEach((target) => {
                target.style.borderColor = color
            })
        }
        if( this.options.updateBackground) {
            document.querySelectorAll<HTMLElement>(this.options.updateBackground).forEach((target) => {
                target.style.background = color
            })
        }
        if(this.options.updateText) {
            document.querySelectorAll<HTMLElement>(this.options.updateText).forEach((target) => {
                target.textContent = color
            })
        }
    }
}

function normalizeOptions(options: Partial<ColorPickerOptions>): Partial<ColorPickerOptions> {
    const colors = options.colors as unknown
    return typeof colors === 'string' ? { ...options, colors: colors.split(',') } : options
}

function normalizeColor(color: string): string {
    const value = color.trim()
    if(!value){
        return ''
    }
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value)) {
        return value.toLowerCase()
    }
    return value.startsWith('#') ? value.toLowerCase() : `#${value.toLowerCase()}`
}

