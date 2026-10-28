import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export interface CropperCropData {
    /** 裁剪区左上角（相对舞台，CSS 像素） */
    x: number
    y: number
    /** 裁剪区尺寸（CSS 像素） */
    width: number
    height: number
    /** 输出像素宽 */
    outputWidth: number
    /** 输出像素高 */
    outputHeight: number
    /** PNG Data URL */
    dataUrl: string
}

export interface CropperOptions extends PlainObject {
    /** 图片地址 */
    src: string
    /** 裁剪框宽高比，0 表示自由裁剪 */
    aspect: number
    /** 舞台高度（CSS 像素） */
    height: number
    /** 最小裁剪边长（CSS 像素） */
    minSize: number
    /** 初始缩放 */
    zoom: number
    /** 初始旋转角度 */
    rotation: number
    /** 预览图选择器，命中后自动写入裁剪结果 */
    preview: string
    /** 输出像素倍率，1 表示与裁剪框 1:1 */
    outputScale: number
    /** 裁剪形状：方形或圆形 */
    shape: 'rect' | 'circle'
    /** 裁剪结果变化回调 */
    onChange?: (data: CropperCropData) => void
}

type HandleDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

/**
 * 图片裁剪。
 * 舞台用 canvas 绘制（旋转、缩放、翻转都在画布内完成），裁剪框用 DOM 覆盖层：
 * 所见即所得，导出时直接取画布上的同一块区域，不需要反解变换矩阵。
 */
export class Cropper extends Component<CropperOptions> {
    static readonly componentName = 'cropper'
    static readonly selector = '[data-kui-cropper]'
    static readonly defaults: CropperOptions = {
        src: '',
        aspect: 0,
        height: 340,
        minSize: 36,
        zoom: 1,
        rotation: 0,
        preview: '',
        outputScale: 1,
        shape: 'rect',
    }

    private stage!: HTMLElement
    private canvas!: HTMLCanvasElement
    private box!: HTMLElement
    private preview: HTMLImageElement | null = null
    private image: HTMLImageElement | null = null
    private zoom = 1
    private rotation = 0
    private flipX = false
    private flipY = false
    private offsetX = 0
    private offsetY = 0
    private rect = { x: 0, y: 0, width: 0, height: 0 }
    private drag: { mode: 'move' | 'pan' | HandleDirection; startX: number; startY: number; origin: { x: number; y: number; width: number; height: number }; offset?: { x: number; y: number } } | null = null

    private constructor(element: HTMLElement, options: Partial<CropperOptions> = {}) {
        super(element, Cropper.componentName, mergeOptions(Cropper.defaults, options))
        this.zoom = this.options.zoom
        this.rotation = this.options.rotation
        element.classList.add('kui-cropper')
        element.classList.toggle('kui-cropper--circle', this.options.shape === 'circle')
        this.mount()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<CropperOptions> = {}): Cropper {
        const element = Cropper.resolveElement(target)
        return (
            getInstance<Cropper>(element, Cropper.componentName) ??
            new Cropper(element, { ...readDataOptions<CropperOptions>(element), ...options })
        )
    }

    /** 当前旋转角度 */
    get angle(): number {
        return this.rotation
    }

    /** 设置图片 */
    async setSrc(src: string): Promise<void> {
        this.options.src = src
        await this.load()
    }

    /** 旋转指定角度（顺时针） */
    rotate(degrees: number): void {
        this.rotation = (this.rotation + degrees) % 360
        this.draw()
        this.emitChange()
    }

    /** 水平翻转 */
    flipHorizontal(): void {
        this.flipX = !this.flipX
        this.draw()
        this.emitChange()
    }

    /** 垂直翻转 */
    flipVertical(): void {
        this.flipY = !this.flipY
        this.draw()
        this.emitChange()
    }

    /** 相对缩放 */
    zoomBy(factor: number): void {
        this.zoom = Math.min(Math.max(this.zoom * factor, 0.4), 4)
        this.draw()
        this.emitChange()
    }

    /** 设置宽高比，0 为自由裁剪 */
    setAspect(aspect: number): void {
        this.options.aspect = aspect
        this.applyAspect()
        this.syncBox()
        this.emitChange()
    }

    /** 重置旋转、缩放与翻转 */
    reset(): void {
        this.zoom = this.options.zoom
        this.rotation = this.options.rotation
        this.flipX = false
        this.flipY = false
        this.offsetX = 0
        this.offsetY = 0
        this.draw()
        this.centerBox()
        this.emitChange()
    }

    /** 读取当前裁剪结果 */
    getData(): CropperCropData {
        const { x, y, width, height } = this.rect
        const dpr = this.pixelRatio()
        const output = document.createElement('canvas')
        output.width = Math.max(1, Math.round(width * dpr))
        output.height = Math.max(1, Math.round(height * dpr))
        const context = output.getContext('2d')
        if (context) {
            context.drawImage(this.canvas, x * dpr, y * dpr, width * dpr, height * dpr, 0, 0, output.width, output.height)
            if (this.options.shape === 'circle') {
                context.globalCompositeOperation = 'destination-in'
                context.beginPath()
                context.arc(output.width / 2, output.height / 2, Math.min(output.width, output.height) / 2, 0, Math.PI * 2)
                context.fill()
            }
        }
        const scale = this.options.outputScale
        const outputWidth = Math.max(1, Math.round(width * scale))
        const outputHeight = Math.max(1, Math.round(height * scale))
        return {
            x,
            y,
            width,
            height,
            outputWidth,
            outputHeight,
            dataUrl: output.toDataURL('image/png'),
        }
    }

    dispose(): void {
        this.image = null
        super.dispose()
    }

    private mount(): void {
        // 支持三种图片来源：options.src、data-src、初始 img 标签
        if (!this.options.src) {
            this.options.src = this.element.dataset.src ?? this.element.querySelector('img')?.getAttribute('src') ?? ''
        }
        this.element.replaceChildren()
        this.element.style.setProperty('--kui-cropper-height', `${this.options.height}px`)

        const stage = document.createElement('div')
        stage.className = 'kui-cropper__stage'

        const canvas = document.createElement('canvas')
        canvas.className = 'kui-cropper__canvas'

        const box = document.createElement('div')
        box.className = 'kui-cropper__box'
        box.tabIndex = 0
        box.setAttribute('role', 'application')
        box.setAttribute('aria-label', '裁剪区域，可用方向键移动')
        box.dataset.cropperBox = ''

        const grid = document.createElement('span')
        grid.className = 'kui-cropper__grid'
        box.append(grid)

        const handles: HandleDirection[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
        handles.forEach((direction) => {
            const handle = document.createElement('span')
            handle.className = `kui-cropper__handle kui-cropper__handle--${direction}`
            handle.dataset.cropperHandle = direction
            box.append(handle)
        })

        stage.append(canvas, box)
        this.element.append(stage)

        this.stage = stage
        this.canvas = canvas
        this.box = box

        this.listen(box, 'pointerdown', (event) => this.onPointerDown(event, 'move'))
        // 画布空白处按下即拖动画布，放大后可移动到需要裁的位置
        this.listen(stage, 'pointerdown', (event) => {
            if (event.target === box || (event.target instanceof Element && event.target.closest('[data-cropper-box]'))) {
                return
            }
            event.preventDefault()
            this.onPointerDown(event, 'pan')
        })
        box.querySelectorAll<HTMLElement>('[data-cropper-handle]').forEach((handle) => {
            this.listen(handle, 'pointerdown', (event) => {
                event.stopPropagation()
                const direction = handle.dataset.cropperHandle as HandleDirection
                this.onPointerDown(event, direction)
            })
        })
        this.listen(box, 'keydown', (event) => this.onBoxKeydown(event))
        this.listen(window, 'resize', () => {
            this.clampRect()
            this.viewport()
        })

        if (this.options.preview) {
            this.preview = document.querySelector<HTMLImageElement>(this.options.preview)
        }

        // 先按当前尺寸画出舞台并放好裁剪框，图片解码完成后再重绘
        this.viewport()
        this.centerBox()
        void this.load()
    }

    private async load(): Promise<void> {
        if (!this.options.src) {
            return
        }
        const image = new Image()
        image.decoding = 'async'
        image.src = this.options.src
        try {
            await image.decode()
        } catch {
            return
        }
        this.image = image
        this.viewport()
        this.centerBox()
        this.emit('kui:cropper:ready', { width: image.naturalWidth, height: image.naturalHeight })
    }

    private viewport(): void {
        const width = this.stage.clientWidth
        const height = this.stage.clientHeight
        const dpr = this.pixelRatio()
        this.canvas.width = Math.max(1, Math.round(width * dpr))
        this.canvas.height = Math.max(1, Math.round(height * dpr))
        this.canvas.style.width = `${width}px`
        this.canvas.style.height = `${height}px`
        this.draw()
        this.syncBox()
    }

    private draw(): void {
        const context = this.canvas.getContext('2d')
        const image = this.image
        const width = this.stage.clientWidth
        const height = this.stage.clientHeight
        if (!context || width === 0 || height === 0) {
            return
        }
        const dpr = this.pixelRatio()
        context.setTransform(1, 0, 0, 1, 0, 0)
        context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        if (!image) {
            return
        }

        context.save()
        context.scale(dpr, dpr)
        context.translate(width / 2 + this.offsetX, height / 2 + this.offsetY)
        context.rotate((this.rotation * Math.PI) / 180)
        context.scale((this.flipX ? -1 : 1) * this.zoom, (this.flipY ? -1 : 1) * this.zoom)

        // 旋转后按外包尺寸取「contain」基准，保证任意角度下图片完整可见
        const radian = (this.rotation * Math.PI) / 180
        const natural = image.naturalWidth
        const naturalHeight = image.naturalHeight
        const rotatedWidth = Math.abs(natural * Math.cos(radian)) + Math.abs(naturalHeight * Math.sin(radian))
        const rotatedHeight = Math.abs(natural * Math.sin(radian)) + Math.abs(naturalHeight * Math.cos(radian))
        const base = Math.min(width / rotatedWidth, height / rotatedHeight)
        context.drawImage(image, (-natural * base) / 2, (-naturalHeight * base) / 2, natural * base, naturalHeight * base)
        context.restore()
    }

    private centerBox(): void {
        const width = this.stage.clientWidth
        const height = this.stage.clientHeight
        const ratio = this.options.aspect
        let boxWidth = width * 0.62
        let boxHeight = height * 0.62
        if (ratio > 0) {
            boxHeight = boxWidth / ratio
            if (boxHeight > height * 0.84) {
                boxHeight = height * 0.84
                boxWidth = boxHeight * ratio
            }
        }
        this.rect = {
            x: (width - boxWidth) / 2,
            y: (height - boxHeight) / 2,
            width: boxWidth,
            height: boxHeight,
        }
        this.syncBox()
    }

    private applyAspect(): void {
        const ratio = this.options.aspect
        if (ratio <= 0) {
            return
        }
        const centerX = this.rect.x + this.rect.width / 2
        const centerY = this.rect.y + this.rect.height / 2
        const width = this.rect.width
        const height = width / ratio
        const clampHeight = Math.min(height, this.stage.clientHeight - 16)
        const finalWidth = clampHeight === height ? width : clampHeight * ratio
        this.rect.width = finalWidth
        this.rect.height = clampHeight
        this.rect.x = centerX - finalWidth / 2
        this.rect.y = centerY - clampHeight / 2
        this.clampRect()
    }

    private syncBox(): void {
        this.box.style.left = `${this.rect.x}px`
        this.box.style.top = `${this.rect.y}px`
        this.box.style.width = `${this.rect.width}px`
        this.box.style.height = `${this.rect.height}px`
    }

    private onPointerDown(event: PointerEvent, mode: 'move' | 'pan' | HandleDirection): void {
        event.preventDefault()
        this.box.focus({ preventScroll: true })
        this.drag = {
            mode,
            startX: event.clientX,
            startY: event.clientY,
            origin: { ...this.rect },
            offset: { x: this.offsetX, y: this.offsetY },
        }
        this.box.setPointerCapture?.(event.pointerId)
        const onMove = (moveEvent: PointerEvent): void => this.onPointerMove(moveEvent)
        const onUp = (): void => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            this.drag = null
            this.element.classList.remove('is-dragging')
            this.emitChange()
        }
        this.element.classList.add('is-dragging')
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp, { once: true })
    }

    private onPointerMove(event: PointerEvent): void {
        if (!this.drag) {
            return
        }
        const deltaX = event.clientX - this.drag.startX
        const deltaY = event.clientY - this.drag.startY
        const origin = this.drag.origin
        const stageWidth = this.stage.clientWidth
        const stageHeight = this.stage.clientHeight
        const min = this.options.minSize

        if (this.drag.mode === 'pan') {
            const offset = this.drag.offset ?? { x: 0, y: 0 }
            const limitX = this.stage.clientWidth * 0.9
            const limitY = this.stage.clientHeight * 0.9
            this.offsetX = Math.min(Math.max(offset.x + deltaX, -limitX), limitX)
            this.offsetY = Math.min(Math.max(offset.y + deltaY, -limitY), limitY)
            this.draw()
            return
        }

        if (this.drag.mode === 'move') {
            this.rect.x = Math.min(Math.max(origin.x + deltaX, 0), stageWidth - origin.width)
            this.rect.y = Math.min(Math.max(origin.y + deltaY, 0), stageHeight - origin.height)
            this.syncBox()
            return
        }

        const mode = this.drag.mode
        let left = origin.x
        let top = origin.y
        let right = origin.x + origin.width
        let bottom = origin.y + origin.height

        if (mode.includes('w')) {
            left = Math.min(Math.max(origin.x + deltaX, 0), right - min)
        }
        if (mode.includes('e')) {
            right = Math.max(Math.min(origin.x + origin.width + deltaX, stageWidth), left + min)
        }
        if (mode.includes('n')) {
            top = Math.min(Math.max(origin.y + deltaY, 0), bottom - min)
        }
        if (mode.includes('s')) {
            bottom = Math.max(Math.min(origin.y + origin.height + deltaY, stageHeight), top + min)
        }

        this.rect = { x: left, y: top, width: right - left, height: bottom - top }

        const ratio = this.options.aspect
        if (ratio > 0) {
            if (mode === 'n' || mode === 's') {
                this.rect.width = this.rect.height * ratio
            } else {
                this.rect.height = this.rect.width / ratio
            }
            if (mode.includes('n')) {
                this.rect.y = bottom - this.rect.height
            }
            this.clampRect()
        }
        this.syncBox()
    }

    private clampRect(): void {
        const stageWidth = this.stage.clientWidth
        const stageHeight = this.stage.clientHeight
        this.rect.width = Math.max(this.options.minSize, Math.min(this.rect.width, stageWidth))
        this.rect.height = Math.max(this.options.minSize, Math.min(this.rect.height, stageHeight))
        this.rect.x = Math.min(Math.max(this.rect.x, 0), stageWidth - this.rect.width)
        this.rect.y = Math.min(Math.max(this.rect.y, 0), stageHeight - this.rect.height)
    }

    private onBoxKeydown(event: KeyboardEvent): void {
        const step = event.shiftKey ? 10 : 2
        let handled = true
        if (event.key === 'ArrowLeft') {
            this.rect.x = Math.max(this.rect.x - step, 0)
        } else if (event.key === 'ArrowRight') {
            this.rect.x = Math.min(this.rect.x + step, this.stage.clientWidth - this.rect.width)
        } else if (event.key === 'ArrowUp') {
            this.rect.y = Math.max(this.rect.y - step, 0)
        } else if (event.key === 'ArrowDown') {
            this.rect.y = Math.min(this.rect.y + step, this.stage.clientHeight - this.rect.height)
        } else {
            handled = false
        }
        if (handled) {
            event.preventDefault()
            this.syncBox()
            this.emitChange()
        }
    }

    private emitChange(): void {
        const data = this.getData()
        if (this.preview) {
            this.preview.src = data.dataUrl
        }
        this.options.onChange?.(data)
        this.emit('kui:cropper:change', data)
    }

    private pixelRatio(): number {
        return Math.min(window.devicePixelRatio || 1, 2)
    }
}
