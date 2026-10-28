import { Cropper } from '@kui/core'
import type { CropperCropData, CropperOptions, KuiEventDetail } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 图片裁剪。
 * 舞台用画布绘制图片，裁剪框是画布上的 DOM 覆盖层：
 * 旋转、翻转与缩放只改变画布内容，导出时取同一块区域，所见即所得。
 * 放大后可以直接按住画布空白处拖动画布，把需要保留的部分移到裁剪框里。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '裁剪把用户手里的原图整理成页面上需要的形状。KUI 的裁剪框、右侧预览与导出尺寸来自同一块画布区域：拖动时就近更新尺寸，放手后导出同一块区域，不会出现「预览对了、导出偏了」。新增的 shape 让头像可以裁成圆形，放大后还能按住画布空白处平移图片。',
    tags: ['Cropper', '.kui-cropper', 'shape', 'outputScale'],
})}

${sectionTitle('基本裁剪', '默认示例挂载即显示裁剪框：拖动框体移动，拖八个手柄改尺寸，右侧同步给出裁剪区与输出像素。放大后按住画布空白处拖动，图片会平移而裁剪框保持不动。')}

${demo({
    title: '标准裁剪与画布拖动',
    desc: '先用「2×」把画布放大，再按住图片的空白处拖动：图片在框内平移，裁剪框位置不变；裁剪框本身仍然可以拖动和缩放。旋转、水平 / 垂直翻转、缩放、重置与 1 : 1 / 16 : 9 都保持可用。',
    tags: ['按住空白拖动画布', 'rotate / flip / zoom', 'setAspect'],
    script: `
const unit = document.querySelector('[data-cr-unit="basic"]')
const cropper = Cropper.getOrCreate('[data-cr-unit="basic"] [data-cr-stage]', {
    src: './images/photos/cropper.jpg',
    shape: 'rect',
    aspect: 16 / 9,
    height: 400,
    preview: '#cr-basic-preview',
})

unit.addEventListener('click', (event) => {
    const action = event.target.closest('[data-cr-action]')?.dataset.crAction
    if (action === 'rotate-left') cropper.rotate(-90)
    if (action === 'rotate-right') cropper.rotate(90)
    if (action === 'flip-h') cropper.flipHorizontal()
    if (action === 'flip-v') cropper.flipVertical()
    if (action === 'zoom-out') cropper.zoomBy(1 / 1.1)
    if (action === 'zoom-in') cropper.zoomBy(1.1)
    if (action === 'zoom-2x') {
        cropper.reset()
        cropper.zoomBy(2)
    }
    if (action === 'reset') cropper.reset()
    if (action === 'aspect-square') cropper.setAspect(1)
    if (action === 'aspect-wide') cropper.setAspect(16 / 9)
})

cropper.element.addEventListener('kui:cropper:change', (event) => {
    const data = event.detail.payload
    document.querySelector('[data-cr-unit="basic"] [data-cr-size]').textContent =
        Math.round(data.width) + ' × ' + Math.round(data.height)
    document.querySelector('[data-cr-unit="basic"] [data-cr-output]').textContent =
        data.outputWidth + ' × ' + data.outputHeight
})
`,
    html: `
<div class="kui-split kui-split--main-first" style="--kui-split-sidebar: 15rem" data-cr-unit="basic">
    <div class="kui-stack">
        <div class="kui-cropper" data-cr-stage data-kui-cropper></div>
        <div class="kui-cropper__toolbar">
            <div class="btn-group" role="group" aria-label="旋转与翻转">
                <button type="button" class="btn btn-default btn-sm" data-cr-action="rotate-left" title="左转 90 度" aria-label="左转 90 度"><i class="fa fa-rotate-left" aria-hidden="true"></i></button>
                <button type="button" class="btn btn-default btn-sm" data-cr-action="rotate-right" title="右转 90 度" aria-label="右转 90 度"><i class="fa fa-rotate-right" aria-hidden="true"></i></button>
                <button type="button" class="btn btn-default btn-sm" data-cr-action="flip-h" title="水平翻转" aria-label="水平翻转"><i class="fa fa-arrows-h" aria-hidden="true"></i></button>
                <button type="button" class="btn btn-default btn-sm" data-cr-action="flip-v" title="垂直翻转" aria-label="垂直翻转"><i class="fa fa-arrows-v" aria-hidden="true"></i></button>
            </div>
            <div class="btn-group" role="group" aria-label="缩放与重置">
                <button type="button" class="btn btn-default btn-sm" data-cr-action="zoom-out" title="缩小" aria-label="缩小"><i class="fa fa-search-minus" aria-hidden="true"></i></button>
                <button type="button" class="btn btn-default btn-sm" data-cr-action="zoom-in" title="放大" aria-label="放大"><i class="fa fa-search-plus" aria-hidden="true"></i></button>
                <button type="button" class="btn btn-default btn-sm" data-cr-action="zoom-2x" title="放大到 2 倍并继续拖动画布" aria-label="放大到 2 倍">2×</button>
                <button type="button" class="btn btn-default btn-sm" data-cr-action="reset" title="重置" aria-label="重置"><i class="fa fa-refresh" aria-hidden="true"></i></button>
            </div>
            <div class="kui-segmented" role="group" aria-label="宽高比">
                <button type="button" data-cr-action="aspect-square">1 : 1</button>
                <button type="button" class="is-active" data-cr-action="aspect-wide">16 : 9</button>
            </div>
        </div>
        <p class="form-hint" data-cr-pan-hint><i class="fa fa-hand-paper-o" aria-hidden="true"></i> 放大后按住画布空白处拖动：图片平移，裁剪框不动。</p>
    </div>
    <div class="kui-stack kui-stack--tight">
        <figure class="kui-cropper__preview">
            <img id="cr-basic-preview" src="./images/photos/cropper.jpg" alt="裁剪结果的实时预览">
            <figcaption>预览 · 与导出同源</figcaption>
        </figure>
        <dl class="kui-descriptions">
            <div class="kui-descriptions__item"><dt>裁剪区</dt><dd data-cr-size>—</dd></div>
            <div class="kui-descriptions__item"><dt>输出像素</dt><dd data-cr-output>—</dd></div>
            <div class="kui-descriptions__item"><dt>缩放</dt><dd data-cr-zoom>1.0×</dd></div>
            <div class="kui-descriptions__item"><dt>旋转</dt><dd data-cr-angle>0°</dd></div>
            <div class="kui-descriptions__item"><dt>宽高比</dt><dd data-cr-ratio>16 : 9</dd></div>
        </dl>
    </div>
</div>`,
})}

${demo({
    title: '头像裁剪：方形 / 圆形',
    desc: '同一个人像并排挂两个实例：左边 shape 为 rect，右边 shape 为 circle。右侧各自预览，圆形实例的裁剪框是圆的，导出的 PNG 四角透明。两边的旋转、翻转、缩放、重置与比例按钮都可独立使用。',
    tags: [`shape: 'rect'`, `shape: 'circle'`, 'outputScale: 2'],
    script: `
const rect = Cropper.getOrCreate('[data-cr-unit="avatar-rect"] [data-cr-stage]', {
    src: './images/portraits/7.jpg',
    shape: 'rect',
    aspect: 1,
    height: 300,
    outputScale: 2,
    preview: '#cr-avatar-rect-preview',
})

const circle = Cropper.getOrCreate('[data-cr-unit="avatar-circle"] [data-cr-stage]', {
    src: './images/portraits/7.jpg',
    shape: 'circle',
    aspect: 1,
    height: 300,
    outputScale: 2,
    preview: '#cr-avatar-circle-preview',
})

rect.element.addEventListener('kui:cropper:change', (event) => {
    const data = event.detail.payload
    document.querySelector('#cr-avatar-rect-output').textContent =
        data.outputWidth + ' × ' + data.outputHeight
})

circle.element.addEventListener('kui:cropper:change', (event) => {
    const data = event.detail.payload
    document.querySelector('#cr-avatar-circle-output').textContent =
        data.outputWidth + ' × ' + data.outputHeight
})
`,
    html: `
<div class="kui-grid kui-grid--md">
    <div class="kui-board kui-stack kui-stack--tight" data-cr-unit="avatar-rect">
        <div class="kui-cluster kui-justify-between">
            <strong>方形头像</strong>
            <code class="kui-inline-code kui-nowrap">shape: 'rect'</code>
        </div>
        <div class="kui-cropper" data-cr-stage data-kui-cropper></div>
        <div class="kui-cropper__toolbar">
            <div class="btn-group" role="group" aria-label="方形头像的变换">
                <button type="button" class="btn btn-default btn-sm" data-cr-action="rotate-left" title="左转 90 度" aria-label="左转 90 度"><i class="fa fa-rotate-left" aria-hidden="true"></i></button>
                <button type="button" class="btn btn-default btn-sm" data-cr-action="rotate-right" title="右转 90 度" aria-label="右转 90 度"><i class="fa fa-rotate-right" aria-hidden="true"></i></button>
                <button type="button" class="btn btn-default btn-sm" data-cr-action="flip-h" title="水平翻转" aria-label="水平翻转"><i class="fa fa-arrows-h" aria-hidden="true"></i></button>
                <button type="button" class="btn btn-default btn-sm" data-cr-action="flip-v" title="垂直翻转" aria-label="垂直翻转"><i class="fa fa-arrows-v" aria-hidden="true"></i></button>
                <button type="button" class="btn btn-default btn-sm" data-cr-action="zoom-out" title="缩小" aria-label="缩小"><i class="fa fa-search-minus" aria-hidden="true"></i></button>
                <button type="button" class="btn btn-default btn-sm" data-cr-action="zoom-in" title="放大" aria-label="放大"><i class="fa fa-search-plus" aria-hidden="true"></i></button>
                <button type="button" class="btn btn-default btn-sm" data-cr-action="reset" title="重置" aria-label="重置"><i class="fa fa-refresh" aria-hidden="true"></i></button>
            </div>
            <div class="kui-segmented" role="group" aria-label="方形头像的宽高比">
                <button type="button" class="is-active" data-cr-action="aspect-square">1 : 1</button>
                <button type="button" data-cr-action="aspect-wide">16 : 9</button>
            </div>
        </div>
        <figure class="kui-cropper__preview">
            <img id="cr-avatar-rect-preview" src="./images/portraits/7.jpg" alt="方形头像裁剪结果预览" style="width: 7.5rem; height: 7.5rem; object-fit: cover;">
            <figcaption>方形输出 <span id="cr-avatar-rect-output" data-cr-output>—</span> 像素</figcaption>
        </figure>
    </div>
    <div class="kui-board kui-stack kui-stack--tight" data-cr-unit="avatar-circle">
        <div class="kui-cluster kui-justify-between">
            <strong>圆形头像</strong>
            <code class="kui-inline-code kui-nowrap">shape: 'circle'</code>
        </div>
        <div class="kui-cropper" data-cr-stage data-kui-cropper></div>
        <div class="kui-cropper__toolbar">
            <div class="btn-group" role="group" aria-label="圆形头像的变换">
                <button type="button" class="btn btn-default btn-sm" data-cr-action="rotate-left" title="左转 90 度" aria-label="左转 90 度"><i class="fa fa-rotate-left" aria-hidden="true"></i></button>
                <button type="button" class="btn btn-default btn-sm" data-cr-action="rotate-right" title="右转 90 度" aria-label="右转 90 度"><i class="fa fa-rotate-right" aria-hidden="true"></i></button>
                <button type="button" class="btn btn-default btn-sm" data-cr-action="flip-h" title="水平翻转" aria-label="水平翻转"><i class="fa fa-arrows-h" aria-hidden="true"></i></button>
                <button type="button" class="btn btn-default btn-sm" data-cr-action="flip-v" title="垂直翻转" aria-label="垂直翻转"><i class="fa fa-arrows-v" aria-hidden="true"></i></button>
                <button type="button" class="btn btn-default btn-sm" data-cr-action="zoom-out" title="缩小" aria-label="缩小"><i class="fa fa-search-minus" aria-hidden="true"></i></button>
                <button type="button" class="btn btn-default btn-sm" data-cr-action="zoom-in" title="放大" aria-label="放大"><i class="fa fa-search-plus" aria-hidden="true"></i></button>
                <button type="button" class="btn btn-default btn-sm" data-cr-action="reset" title="重置" aria-label="重置"><i class="fa fa-refresh" aria-hidden="true"></i></button>
            </div>
            <div class="kui-segmented" role="group" aria-label="圆形头像的宽高比">
                <button type="button" class="is-active" data-cr-action="aspect-square">1 : 1</button>
                <button type="button" data-cr-action="aspect-wide">16 : 9</button>
            </div>
        </div>
        <figure class="kui-cropper__preview">
            <img id="cr-avatar-circle-preview" src="./images/portraits/7.jpg" alt="圆形头像裁剪结果预览" style="width: 7.5rem; height: 7.5rem; object-fit: cover; border-radius: 999px;">
            <figcaption>圆形输出 <span id="cr-avatar-circle-output" data-cr-output>—</span> 像素 · 四角透明</figcaption>
        </figure>
    </div>
</div>`,
})}

${demo({
    title: '自由比例',
    desc: 'aspect 为 0 时不限制宽高比，仍受 minSize 约束：框不会被拖成一条线，导出也不会得到 1 像素的图片。这次图片写在裁剪区里，组件读取初始 img 后接管；放大后同样能按住空白处拖动画布。',
    tags: ['aspect: 0', 'minSize: 48', '初始 <img>'],
    script: `
const cropper = Cropper.getOrCreate('[data-cr-unit="free"] [data-cr-stage]', {
    aspect: 0,
    height: 300,
    minSize: 48,
})

document.querySelector('[data-cr-unit="free"] [data-cr-action="aspect-free"]')
    .addEventListener('click', () => cropper.setAspect(0))
document.querySelector('[data-cr-unit="free"] [data-cr-action="aspect-square"]')
    .addEventListener('click', () => cropper.setAspect(1))
document.querySelector('[data-cr-unit="free"] [data-cr-action="zoom-in"]')
    .addEventListener('click', () => cropper.zoomBy(1.1))
document.querySelector('[data-cr-unit="free"] [data-cr-action="zoom-out"]')
    .addEventListener('click', () => cropper.zoomBy(1 / 1.1))
document.querySelector('[data-cr-unit="free"] [data-cr-action="reset"]')
    .addEventListener('click', () => cropper.reset())
`,
    html: `
<div class="kui-stack" data-cr-unit="free">
    <div class="kui-cropper" data-cr-stage data-kui-cropper>
        <img src="./images/photos/city-2.jpg" alt="黑白影调的女性肖像">
    </div>
    <div class="kui-cropper__toolbar">
        <div class="btn-group" role="group" aria-label="变换">
            <button type="button" class="btn btn-default btn-sm" data-cr-action="rotate-right" title="右转 90 度" aria-label="右转 90 度"><i class="fa fa-rotate-right" aria-hidden="true"></i></button>
            <button type="button" class="btn btn-default btn-sm" data-cr-action="flip-v" title="垂直翻转" aria-label="垂直翻转"><i class="fa fa-arrows-v" aria-hidden="true"></i></button>
            <button type="button" class="btn btn-default btn-sm" data-cr-action="zoom-out" title="缩小" aria-label="缩小"><i class="fa fa-search-minus" aria-hidden="true"></i></button>
            <button type="button" class="btn btn-default btn-sm" data-cr-action="zoom-in" title="放大" aria-label="放大"><i class="fa fa-search-plus" aria-hidden="true"></i></button>
            <button type="button" class="btn btn-default btn-sm" data-cr-action="reset" title="重置" aria-label="重置"><i class="fa fa-refresh" aria-hidden="true"></i></button>
        </div>
        <div class="kui-segmented" role="group" aria-label="宽高比">
            <button type="button" class="is-active" data-cr-action="aspect-free">自由</button>
            <button type="button" data-cr-action="aspect-square">1 : 1</button>
        </div>
        <p class="form-hint">裁剪区 <span data-cr-size>—</span> · 输出 <span data-cr-output>—</span></p>
    </div>
</div>`,
})}

${propsTable([
    { name: 'src', type: 'string', defaultValue: `''`, desc: '图片地址；同源或允许跨域的图片才能导出裁剪结果，也可以用 <code>data-src</code> 或初始 <code>&lt;img&gt;</code> 提供。' },
    { name: 'shape', type: `'rect' | 'circle'`, defaultValue: `'rect'`, desc: '裁剪框形状。圆形模式给裁剪框加 <code>.kui-cropper--circle</code>，导出的 PNG 四角透明；需要运行时切换时用新选项重建实例，本页用两个实例并列展示。' },
    { name: 'aspect', type: 'number', defaultValue: '0', desc: '宽高比，0 为自由裁剪；头像常用 1，封面常用 16 / 9。' },
    { name: 'height', type: 'number', defaultValue: '340', desc: '舞台高度（CSS 像素），窄屏下按 0.72 系数收缩。' },
    { name: 'minSize', type: 'number', defaultValue: '36', desc: '裁剪框最小边长，避免拖成一条线。' },
    { name: 'zoom / rotation', type: 'number', defaultValue: '1 / 0', desc: '初始缩放与旋转角度，重置时回到这两个值。' },
    { name: 'outputScale', type: 'number', defaultValue: '1', desc: '导出倍率，2 表示导出像素是裁剪框的两倍。' },
    { name: 'preview', type: 'string', defaultValue: `''`, desc: '预览图选择器，命中后自动写入裁剪结果。' },
    { name: '按住画布空白拖动', type: 'interaction', desc: '放大后按住裁剪框外的画布区域拖动，图片平移而裁剪框不动；裁剪框自身的拖动与八个手柄不受影响。' },
    { name: 'rotate / flipHorizontal / flipVertical', type: 'method', desc: '旋转与两种翻转，翻转是切换而不是累加。' },
    { name: 'zoomBy(factor) / setAspect(n) / reset()', type: 'method', desc: '相对缩放、改宽高比、回到初始变换与居中裁剪框；reset 同时清空画布平移。' },
    { name: 'getData()', type: 'method', desc: '读取当前裁剪结果：坐标、尺寸、输出像素与 PNG dataUrl。' },
    { name: 'kui:cropper:ready', type: 'event', desc: '图片解码完成，<code>getData()</code> 从此可导出。' },
    { name: 'kui:cropper:change', type: 'event', desc: '拖动结束、旋转、翻转、缩放、改比例、重置与平移都会派发。' },
    { name: '.kui-cropper__toolbar / __preview', type: 'class', defaultValue: '—', desc: '工具栏与预览图的既定结构与间距。' },
    { name: '.kui-cropper__box / __handle', type: 'class', defaultValue: '—', desc: '裁剪框与八个手柄，手柄固定 10px，保证可抓取；圆形模式隐藏四角手柄。' },
    { name: '.kui-cropper--circle', type: 'class', defaultValue: '—', desc: '圆形裁剪框：框体与网格变圆，导出时按内切圆裁掉四角。' },
])}

${callout('裁剪框获得焦点后可以用 <span class="kui-kbd">←</span> <span class="kui-kbd">→</span> <span class="kui-kbd">↑</span> <span class="kui-kbd">↓</span> 微调位置，按住 Shift 每次移动 10px；拖拽与键盘操作走同一套边界计算。放大后拖动画布只改变图片位置，不会移动裁剪框。跨域图片需要服务端返回 CORS 头，否则画布导出会被浏览器拦下。')}

`

    const aspectMap: Record<string, { value: number; label: string }> = {
        'aspect-square': { value: 1, label: '1 : 1' },
        'aspect-wide': { value: 16 / 9, label: '16 : 9' },
        'aspect-free': { value: 0, label: '自由' },
    }

    const bindCropper = (unit: string, options: Partial<CropperOptions>): void => {
        const scope = root.querySelector<HTMLElement>(`[data-cr-unit="${unit}"]`)
        const stage = scope?.querySelector<HTMLElement>('[data-cr-stage]')
        if (!scope || !stage) {
            return
        }

        const instance = Cropper.getOrCreate(stage, options)
        trackComponent(instance)

        const preview = options.preview ? scope.querySelector<HTMLImageElement>(options.preview) : null
        const size = scope.querySelector<HTMLElement>('[data-cr-size]')
        const output = scope.querySelector<HTMLElement>('[data-cr-output]')
        const angle = scope.querySelector<HTMLElement>('[data-cr-angle]')
        const ratio = scope.querySelector<HTMLElement>('[data-cr-ratio]')
        const zoom = scope.querySelector<HTMLElement>('[data-cr-zoom]')

        let ratioLabel = options.aspect === 1 ? '1 : 1' : options.aspect ? '16 : 9' : '自由'
        let zoomLevel = options.zoom ?? 1

        const paintZoom = (): void => {
            if (zoom) {
                zoom.textContent = `${zoomLevel.toFixed(1)}×`
            }
        }

        const paint = (data: CropperCropData): void => {
            if (size) {
                size.textContent = `${Math.round(data.width)} × ${Math.round(data.height)}`
            }
            if (output) {
                output.textContent = `${data.outputWidth} × ${data.outputHeight}`
            }
            if (angle) {
                angle.textContent = `${Math.round(((instance.angle % 360) + 360) % 360)}°`
            }
            if (ratio) {
                ratio.textContent = ratioLabel
            }
            paintZoom()
        }

        stage.addEventListener('kui:cropper:change', (event) => {
            const data = (event as CustomEvent<KuiEventDetail<CropperCropData>>).detail.payload
            if (data) {
                paint(data)
            }
        })

        stage.addEventListener('kui:cropper:ready', () => {
            const data = instance.getData()
            if (preview) {
                preview.src = data.dataUrl
            }
            paint(data)
        })

        scope.addEventListener('click', (event) => {
            const target = event.target
            const button = target instanceof Element ? target.closest<HTMLElement>('[data-cr-action]') : null
            const action = button?.dataset.crAction
            if (!action) {
                return
            }

            if (action === 'rotate-left') instance.rotate(-90)
            if (action === 'rotate-right') instance.rotate(90)
            if (action === 'flip-h') instance.flipHorizontal()
            if (action === 'flip-v') instance.flipVertical()
            if (action === 'zoom-in') {
                zoomLevel = Math.min(zoomLevel * 1.1, 4)
                instance.zoomBy(1.1)
            }
            if (action === 'zoom-out') {
                zoomLevel = Math.max(zoomLevel / 1.1, 0.4)
                instance.zoomBy(1 / 1.1)
            }
            if (action === 'zoom-2x') {
                instance.reset()
                instance.zoomBy(2)
                zoomLevel = 2
            }
            if (action === 'reset') {
                instance.reset()
                zoomLevel = options.zoom ?? 1
            }
            if (action in aspectMap) {
                instance.setAspect(aspectMap[action].value)
                ratioLabel = aspectMap[action].label
                scope.querySelectorAll<HTMLElement>('[data-cr-action^="aspect-"]').forEach((item) => {
                    item.classList.toggle('is-active', item === button)
                })
                if (ratio) {
                    ratio.textContent = ratioLabel
                }
            }
            paintZoom()
        })

        paintZoom()
    }

    bindCropper('basic', {
        src: './images/photos/cropper.jpg',
        shape: 'rect',
        aspect: 16 / 9,
        height: 400,
        preview: '#cr-basic-preview',
    })
    bindCropper('avatar-rect', {
        src: './images/portraits/7.jpg',
        shape: 'rect',
        aspect: 1,
        height: 300,
        outputScale: 2,
        preview: '#cr-avatar-rect-preview',
    })
    bindCropper('avatar-circle', {
        src: './images/portraits/7.jpg',
        shape: 'circle',
        aspect: 1,
        height: 300,
        outputScale: 2,
        preview: '#cr-avatar-circle-preview',
    })
    bindCropper('free', { aspect: 0, height: 300, minSize: 48 })
}
