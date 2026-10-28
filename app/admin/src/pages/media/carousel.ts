import { Carousel } from '@kui/core'
import type { CarouselOptions, KuiEventDetail } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 轮播。
 * 每个示例都是一个独立实例：一个轨道只放一组内容，示例之间互不影响。
 * 参数在运行时调整，切换效果、节奏、高度与说明位置都不需要重建实例。
 */

const CAPTION_POSITION_LABELS: Record<CarouselOptions['captionPosition'], string> = {
    'bottom-left': '左下',
    'bottom-right': '右下',
    'top-left': '左上',
    'top-right': '右上',
    center: '居中',
}

const CAPTION_SIZE_LABELS: Record<CarouselOptions['captionSize'], string> = {
    sm: '小',
    md: '中',
    lg: '大',
}

/** 淡入模式不需要横向位移；切换时清掉上一次位移模式留下的 transform，避免整页被推出可视区 */
function clearTrackTransform(element: HTMLElement): void {
    const track = element.querySelector<HTMLElement>('.kui-carousel__track')
    if (track) {
        track.style.transform = ''
    }
}

export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '轮播把多张并列内容压进同一块区域，代价是一次只能看一张。因此它适合「同一主题的并列内容」，不适合必须同时对比的信息。下面每个示例都是独立实例：单图、文字、悬浮说明、多图网格、可变高度、渐变、自动播放、视频与设置面板各占一个轨道。所有图片都用 --kui-carousel-max-height 收住高度；说明文字的位置与字号由 captionPosition / captionSize 控制。',
    tags: ['Carousel', '.kui-carousel', 'captionPosition', 'captionSize', 'setOptions'],
})}

${sectionTitle('基础形态', '四段结构从简到繁：只有图片、图片加说明、说明压在图上、一页放三张图。每张图片都限制在 26rem 以内，比例容器不再把轨道撑高。')}

${demo({
    title: '单张图片',
    desc: '最常用的一页一张：图片铺满宽度，高度由 --kui-carousel-max-height: 26rem 收口，超出部分按 object-fit: cover 裁切；间隔 4200 ms，指针悬停时暂停。',
    tags: ['.kui-carousel', '--kui-carousel-max-height: 26rem', 'interval: 4200'],
    script: `
const carousel = Carousel.getOrCreate('[data-carousel-single]', {
    interval: 4200,
    pauseOnHover: true,
})

carousel.element.addEventListener('kui:carousel:change', (event) => {
    console.log('当前是第', event.detail.payload.index + 1, '张')
})
`,
    html: `
<div class="kui-carousel" data-carousel-single data-kui-carousel>
    <div style="--kui-carousel-max-height: 26rem"><img src="./images/photos/city-1.jpg" alt="街头舞者脚上的运动鞋与地面的涂鸦"></div>
    <div style="--kui-carousel-max-height: 26rem"><img src="./images/photos/city-2.jpg" alt="黑白影调的女性肖像"></div>
    <div style="--kui-carousel-max-height: 26rem"><img src="./images/photos/city-3.jpg" alt="戴耳机闭眼聆听的女性"></div>
</div>`,
})}

${demo({
    title: '文字单图',
    desc: '图片在上、说明在下：内容区用 kui-board 撑出内边距。图片比例容器同时受 26rem 的高度上限约束，一页只多两行文字，轨道不会被 4:3 的图片撑到上千像素。',
    tags: ['.kui-board', '.kui-img-ratio--4x3', 'max-height'],
    script: `
const carousel = Carousel.getOrCreate('[data-carousel-text]', { autoplay: false })
`,
    html: `
<div class="kui-carousel" data-carousel-text data-kui-carousel>
    <div style="--kui-carousel-max-height: 26rem">
        <div class="kui-board kui-w-full">
            <div class="kui-stack kui-stack--tight">
                <div class="kui-img-ratio kui-img-ratio--4x3" style="max-height: var(--kui-carousel-max-height, 26rem)"><img src="./images/photos/city-4.jpg" alt="低头看向侧面的女性"></div>
                <strong>窗边的侧脸 · 01</strong>
                <span class="kui-figure__caption">说明只多一行，切换时轨道高度保持稳定。</span>
            </div>
        </div>
    </div>
    <div style="--kui-carousel-max-height: 26rem">
        <div class="kui-board kui-w-full">
            <div class="kui-stack kui-stack--tight">
                <div class="kui-img-ratio kui-img-ratio--4x3" style="max-height: var(--kui-carousel-max-height, 26rem)"><img src="./images/photos/city-5.jpg" alt="石雕门柱与铁艺大门"></div>
                <strong>石雕门柱与铁艺大门 · 02</strong>
                <span class="kui-figure__caption">同一套结构换素材即可复用到活动、商品与案例页。</span>
            </div>
        </div>
    </div>
    <div style="--kui-carousel-max-height: 26rem">
        <div class="kui-board kui-w-full">
            <div class="kui-stack kui-stack--tight">
                <div class="kui-img-ratio kui-img-ratio--4x3" style="max-height: var(--kui-carousel-max-height, 26rem)"><img src="./images/photos/city-6.jpg" alt="海面上的悬索桥"></div>
                <strong>海面上的悬索桥 · 03</strong>
                <span class="kui-figure__caption">说明放在图片下方，不遮挡画面。</span>
            </div>
        </div>
    </div>
</div>`,
})}

${demo({
    title: '文字悬浮',
    desc: '标题与说明压在图片上，渐变负责保证对比度。下方切换说明位置（左下 / 右下 / 左上 / 右上 / 居中）与字号（小 / 中 / 大），这就是设置面板里两个新增参数的独立演示。',
    tags: ['.kui-carousel__caption', 'captionPosition', 'captionSize'],
    script: `
const carousel = Carousel.getOrCreate('[data-carousel-overlay]', { autoplay: false, interval: 3200 })

const positions = document.querySelectorAll('[data-carousel-overlay-caption]')
positions.forEach((button) => {
    button.addEventListener('click', () => {
        positions.forEach((item) => item.classList.toggle('is-active', item === button))
        carousel.setOptions({ captionPosition: button.dataset.carouselOverlayCaption })
    })
})

const sizes = document.querySelectorAll('[data-carousel-overlay-size]')
sizes.forEach((button) => {
    button.addEventListener('click', () => {
        sizes.forEach((item) => item.classList.toggle('is-active', item === button))
        carousel.setOptions({ captionSize: button.dataset.carouselOverlaySize })
    })
})
`,
    html: `
<div class="kui-stack kui-stack--tight">
    <div class="kui-carousel" data-carousel-overlay data-kui-carousel style="--kui-carousel-max-height: 26rem; --kui-font-size-component-heading: 1rem">
        <div>
            <img src="./images/photos/city-1.jpg" alt="街头舞者脚上的运动鞋与地面的涂鸦">
            <div class="kui-carousel__caption"><strong>街头舞步 · 01</strong><span>标题压在图底，信息更紧凑，适合专题与活动入口。</span></div>
        </div>
        <div>
            <img src="./images/photos/city-2.jpg" alt="黑白影调的女性肖像">
            <div class="kui-carousel__caption"><strong>黑白肖像 · 02</strong><span>说明只保留一行，窄屏下自动隐藏，标题始终可读。</span></div>
        </div>
        <div>
            <img src="./images/photos/city-3.jpg" alt="戴耳机闭眼聆听的女性">
            <div class="kui-carousel__caption"><strong>耳机与午后 · 03</strong><span>浮层不接收指针事件，图片上的操作不会被挡住。</span></div>
        </div>
    </div>
    <div class="kui-cluster kui-justify-between">
        <div class="kui-cluster" style="--kui-cluster-gap: var(--kui-space-2)">
            <span class="kui-stat__label">说明位置</span>
            <div class="kui-segmented" role="group" aria-label="说明位置">
                <button type="button" class="is-active" data-carousel-overlay-caption="bottom-left">左下</button>
                <button type="button" data-carousel-overlay-caption="bottom-right">右下</button>
                <button type="button" data-carousel-overlay-caption="top-left">左上</button>
                <button type="button" data-carousel-overlay-caption="top-right">右上</button>
                <button type="button" data-carousel-overlay-caption="center">居中</button>
            </div>
        </div>
        <div class="kui-cluster" style="--kui-cluster-gap: var(--kui-space-2)">
            <span class="kui-stat__label">说明字号</span>
            <div class="kui-segmented" role="group" aria-label="说明字号">
                <button type="button" data-carousel-overlay-size="sm">小</button>
                <button type="button" class="is-active" data-carousel-overlay-size="md">中</button>
                <button type="button" data-carousel-overlay-size="lg">大</button>
            </div>
        </div>
    </div>
</div>`,
})}

${demo({
    title: '多张图片',
    desc: '一页放三张同尺寸图片：网格负责排列，轮播只负责在「组」之间切换。每个 1:1 比例格子同样套了 --kui-carousel-max-height，窄屏换行时也不会把轨道越撑越高。',
    tags: ['.kui-grid--sm', '.kui-img-ratio--1x1', 'max-height'],
    script: `
const carousel = Carousel.getOrCreate('[data-carousel-multi]', { autoplay: false })
`,
    html: `
<div class="kui-carousel" data-carousel-multi data-kui-carousel>
    <div style="--kui-carousel-max-height: 26rem">
        <div class="kui-board kui-w-full">
            <div class="kui-grid kui-grid--sm">
                <div class="kui-img-ratio kui-img-ratio--1x1" style="max-height: var(--kui-carousel-max-height, 26rem)"><img src="./images/portraits/1.jpg" alt="手绘的卡通人脸"></div>
                <div class="kui-img-ratio kui-img-ratio--1x1" style="max-height: var(--kui-carousel-max-height, 26rem)"><img src="./images/portraits/2.jpg" alt="趴在桌边的橘猫"></div>
                <div class="kui-img-ratio kui-img-ratio--1x1" style="max-height: var(--kui-carousel-max-height, 26rem)"><img src="./images/portraits/7.jpg" alt="动漫风格的女性肖像"></div>
            </div>
        </div>
    </div>
    <div style="--kui-carousel-max-height: 26rem">
        <div class="kui-board kui-w-full">
            <div class="kui-grid kui-grid--sm">
                <div class="kui-img-ratio kui-img-ratio--1x1" style="max-height: var(--kui-carousel-max-height, 26rem)"><img src="./images/portraits/4.jpg" alt="戴头盔与面罩的人"></div>
                <div class="kui-img-ratio kui-img-ratio--1x1" style="max-height: var(--kui-carousel-max-height, 26rem)"><img src="./images/portraits/5.jpg" alt="雾中的人影"></div>
                <div class="kui-img-ratio kui-img-ratio--1x1" style="max-height: var(--kui-carousel-max-height, 26rem)"><img src="./images/portraits/6.jpg" alt="戴狮子鬃毛头套的猫"></div>
            </div>
        </div>
    </div>
</div>`,
})}

${sectionTitle('效果与节奏', '渐变改变切换方式，高度决定轨道怎么测量，自动播放与手动控制都落在实例参数上。')}

${demo({
    title: '可变高度',
    desc: '淡入模式下轨道按当前页测量高度：图片页最高 26rem，文字页矮，切换时轨道跟着收放。高度上限只裁图片，不会把文字页也拉到图片的高度。',
    tags: [`effect: 'fade'`, `height: 'auto'`, '--kui-carousel-max-height'],
    script: `
const carousel = Carousel.getOrCreate('[data-carousel-variable]', {
    effect: 'fade',
    height: 'auto',
    autoplay: false,
})
`,
    html: `
<div class="kui-carousel" data-carousel-variable data-kui-carousel>
    <div style="--kui-carousel-max-height: 26rem"><img src="./images/photos/city-1.jpg" alt="街头舞者脚上的运动鞋与地面的涂鸦"></div>
    <div>
        <div class="kui-board kui-w-full">
            <div class="kui-stack kui-stack--tight">
                <span class="kui-page-header__eyebrow">只有文字的一页</span>
                <strong>轨道跟着当前页变高</strong>
                <span class="kui-figure__caption">每一页单独测量高度：内容少时轨道收紧，内容多时轨道展开，不写死高度。</span>
            </div>
        </div>
    </div>
    <div style="--kui-carousel-max-height: 26rem"><img src="./images/portraits/4.jpg" alt="戴头盔与面罩的人"></div>
</div>`,
})}

${demo({
    title: '渐变切换',
    desc: '幻灯片叠放在同一位置，用透明度过渡；适合宽度一致、需要强调「同一位置换内容」的场景。图片高度同样限制在 26rem，切换后仍能看到完整画面。',
    tags: [`effect: 'fade'`, 'interval: 3200'],
    script: `
const carousel = Carousel.getOrCreate('[data-carousel-fade]', {
    effect: 'fade',
    interval: 3200,
})
`,
    html: `
<div class="kui-carousel" data-carousel-fade data-kui-carousel>
    <div style="--kui-carousel-max-height: 26rem">
        <img src="./images/photos/city-2.jpg" alt="黑白影调的女性肖像">
        <div class="kui-carousel__caption"><strong>渐变 · 01</strong><span>位置不动，只换内容。</span></div>
    </div>
    <div style="--kui-carousel-max-height: 26rem">
        <img src="./images/photos/city-3.jpg" alt="戴耳机闭眼聆听的女性">
        <div class="kui-carousel__caption"><strong>渐变 · 02</strong><span>叠放的两页共用一次透明度过渡。</span></div>
    </div>
    <div style="--kui-carousel-max-height: 26rem">
        <img src="./images/photos/city-4.jpg" alt="低头看向侧面的女性">
        <div class="kui-carousel__caption"><strong>渐变 · 03</strong><span>不产生横向位移，阅读焦点更稳定。</span></div>
    </div>
</div>`,
})}

${demo({
    title: '自动播放开关',
    desc: '播放与暂停按钮直接改实例的 autoplay 参数：暂停后指针移出也不会自己恢复，按下播放才重新计时。只关闭左右控件，底部指示器仍然可见并可点击。',
    tags: ['play() / pause()', 'autoplay', 'showIndicators'],
    script: `
const carousel = document.querySelector('[data-carousel-toggle]')
const state = document.querySelector('[data-carousel-state]')
const instance = Carousel.getOrCreate(carousel, { autoplay: false, interval: 2200, showControls: false })

document.querySelector('[data-carousel-play]').addEventListener('click', () => {
    instance.setOptions({ autoplay: true })
    instance.play()
    state.textContent = '自动播放中：间隔 2200 ms，指针移入时暂停。'
})

document.querySelector('[data-carousel-pause]').addEventListener('click', () => {
    instance.setOptions({ autoplay: false })
    instance.pause()
    state.textContent = '已暂停：点「播放」继续。'
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-carousel" data-carousel-toggle data-kui-carousel>
        <div style="--kui-carousel-max-height: 26rem"><img src="./images/photos/city-5.jpg" alt="石雕门柱与铁艺大门"></div>
        <div style="--kui-carousel-max-height: 26rem"><img src="./images/photos/city-6.jpg" alt="海面上的悬索桥"></div>
        <div style="--kui-carousel-max-height: 26rem"><img src="./images/portraits/7.jpg" alt="动漫风格的女性肖像"></div>
    </div>
    <div class="kui-toolbar">
        <div class="kui-toolbar__group">
            <button type="button" class="btn btn-default btn-sm" data-carousel-play><i class="fa fa-play" aria-hidden="true"></i> 播放</button>
            <button type="button" class="btn btn-default btn-sm" data-carousel-pause><i class="fa fa-pause" aria-hidden="true"></i> 暂停</button>
        </div>
        <p class="form-hint" data-carousel-state>已暂停：点「播放」开始自动切换。</p>
    </div>
</div>`,
})}

${demo({
    title: '视频',
    desc: '视频占一页，海报帧用图片占位，避免第一帧黑屏；离开当前页时组件自动暂停播放，声音不会在后台继续。视频高度同样受 26rem 上限约束。',
    tags: ['<video controls>', 'poster', 'max-height'],
    script: `
const carousel = Carousel.getOrCreate('[data-carousel-video]', { autoplay: false })
`,
    html: `
<div class="kui-carousel" data-carousel-video data-kui-carousel>
    <div style="--kui-carousel-max-height: 26rem">
        <video controls preload="metadata" poster="./images/photos/city-2.jpg" src="https://www.w3schools.com/html/mov_bbb.mp4" title="示例短片：草地上的兔子"></video>
    </div>
    <div style="--kui-carousel-max-height: 26rem">
        <img src="./images/photos/city-6.jpg" alt="海面上的悬索桥">
        <div class="kui-carousel__caption"><strong>剧照</strong><span>视频与图片共用同一套幻灯片结构，控件不需要额外配置。</span></div>
    </div>
</div>`,
})}

${sectionTitle('设置面板', '面板只调用实例方法：setOptions 改参数，play / pause 改播放状态。六项设置都落在同一个主轮播上，其中说明位置与字号会立即改变图上文字。')}

${demo({
    title: '实时调整参数',
    desc: '自动播放、渐变、切换间隔、高度、说明位置与说明字号全部写回同一个实例。这个示例只保留指示器，把注意力放在参数上；高度用 --kui-carousel-max-height 收口，固定时把画面压到 13rem。',
    tags: ['setOptions', 'showControls: false', 'captionPosition', 'captionSize', '--kui-carousel-max-height'],
    script: `
const carousel = document.querySelector('[data-carousel-main]')
const state = document.querySelector('[data-carousel-main-state]')
const instance = Carousel.getOrCreate(carousel, { autoplay: false, effect: 'fade', interval: 3600, height: 'auto', showControls: false })

let heightMode = 'auto'

const paint = () => {
    state.textContent = '第 ' + (instance.active + 1) + ' / ' + instance.length + ' 张 · '
        + (instance.options.effect === 'fade' ? '渐变' : '位移')
        + ' · 间隔 ' + instance.options.interval + ' ms · 高度 ' + heightMode
        + ' · 说明 ' + instance.options.captionPosition + ' / ' + instance.options.captionSize
}

document.querySelector('[data-carousel-main-autoplay]').addEventListener('change', (event) => {
    instance.setOptions({ autoplay: event.target.checked })
    event.target.checked ? instance.play() : instance.pause()
    paint()
})

document.querySelector('[data-carousel-main-fade]').addEventListener('change', (event) => {
    instance.setOptions({ effect: event.target.checked ? 'fade' : 'slide' })
    if (event.target.checked) {
        document.querySelector('[data-carousel-main] .kui-carousel__track').style.transform = ''
    }
    paint()
})

document.querySelector('[data-carousel-main-interval]').addEventListener('input', (event) => {
    instance.setOptions({ interval: Number(event.target.value) })
    paint()
})

document.querySelector('[data-carousel-main-caption-position]').addEventListener('change', (event) => {
    instance.setOptions({ captionPosition: event.target.value })
    paint()
})

document.querySelectorAll('[data-carousel-main-caption-size]').forEach((button) => {
    button.addEventListener('click', () => {
        document.querySelectorAll('[data-carousel-main-caption-size]').forEach((item) => item.classList.toggle('is-active', item === button))
        instance.setOptions({ captionSize: button.dataset.carouselMainCaptionSize })
        paint()
    })
})

document.querySelectorAll('[data-carousel-main-height]').forEach((button) => {
    button.addEventListener('click', () => {
        heightMode = button.dataset.carouselMainHeight
        if (heightMode === 'fixed') carousel.style.setProperty('--kui-carousel-max-height', '13rem')
        else carousel.style.removeProperty('--kui-carousel-max-height')
        instance.setOptions({ height: heightMode })
        paint()
    })
})

carousel.addEventListener('kui:carousel:change', paint)
paint()
`,
    html: `
<div class="kui-split kui-split--main-first" style="--kui-split-sidebar: 15rem">
    <div class="kui-stack kui-stack--tight">
        <div class="kui-carousel" data-carousel-main data-kui-carousel style="--kui-carousel-max-height: 26rem; --kui-font-size-component-heading: 1rem">
            <div>
                <img src="./images/photos/city-3.jpg" alt="戴耳机闭眼聆听的女性">
                <div class="kui-carousel__caption"><strong>主轮播 · 01</strong><span>设置面板控制的始终是这一个实例。</span></div>
            </div>
            <div>
                <img src="./images/photos/city-4.jpg" alt="低头看向侧面的女性">
                <div class="kui-carousel__caption"><strong>主轮播 · 02</strong><span>切换效果与间隔改完立即生效。</span></div>
            </div>
            <div>
                <img src="./images/photos/city-5.jpg" alt="石雕门柱与铁艺大门">
                <div class="kui-carousel__caption"><strong>主轮播 · 03</strong><span>高度、说明位置与字号都能中途修改。</span></div>
            </div>
        </div>
        <p class="form-hint" data-carousel-main-state>第 1 / 3 张 · 渐变 · 间隔 3600 ms · 高度 auto · 说明 左下 / 中</p>
    </div>
    <aside class="panel" data-carousel-panel>
        <div class="panel-heading">
            <h3 class="panel-title">设置</h3>
            <span class="badge badge-neutral">实时生效</span>
        </div>
        <div class="panel-body kui-stack kui-stack--tight">
            <label class="form-check"><input type="checkbox" data-carousel-main-autoplay> 自动播放</label>
            <label class="form-check"><input type="checkbox" data-carousel-main-fade checked> 渐变切换</label>
            <label class="form-group">
                <span class="form-label">切换间隔 <output data-carousel-main-interval-label>3600 ms</output></span>
                <input class="kui-w-full" type="range" min="1600" max="6000" step="200" value="3600" data-carousel-main-interval aria-label="自动切换间隔（毫秒）">
            </label>
            <div class="form-group">
                <span class="form-label">高度</span>
                <div class="kui-segmented" role="group" aria-label="轨道高度">
                    <button type="button" class="is-active" data-carousel-main-height="auto">跟随内容</button>
                    <button type="button" data-carousel-main-height="fixed">固定 13rem</button>
                </div>
            </div>
            <label class="form-group">
                <span class="form-label">说明位置</span>
                <select class="form-control" data-carousel-main-caption-position aria-label="说明位置">
                    <option value="bottom-left" selected>左下</option>
                    <option value="bottom-right">右下</option>
                    <option value="top-left">左上</option>
                    <option value="top-right">右上</option>
                    <option value="center">居中</option>
                </select>
            </label>
            <div class="form-group">
                <span class="form-label">说明字号</span>
                <div class="kui-segmented" role="group" aria-label="说明字号">
                    <button type="button" data-carousel-main-caption-size="sm">小</button>
                    <button type="button" class="is-active" data-carousel-main-caption-size="md">中</button>
                    <button type="button" data-carousel-main-caption-size="lg">大</button>
                </div>
            </div>
        </div>
    </aside>
</div>`,
})}

${propsTable([
    { name: 'active', type: 'number', defaultValue: '0', desc: '当前页下标，越界时会被夹回有效范围。' },
    { name: 'autoplay', type: 'boolean', defaultValue: 'true', desc: '是否自动切换；文档、列表与视频页建议关闭。' },
    { name: 'interval', type: 'number', defaultValue: '3600', desc: '切换间隔（毫秒），播放中修改会重新计时。' },
    { name: 'effect', type: `'slide' | 'fade'`, defaultValue: `'slide'`, desc: '位移或淡入淡出；渐变模式下幻灯片叠放。' },
    { name: 'height', type: `'auto' | 'fixed'`, defaultValue: `'auto'`, desc: 'auto 按当前页测量轨道高度；fixed 不写入测量值，并配合 <code>--kui-carousel-max-height</code> 固定高度。' },
    { name: 'loop / pauseOnHover', type: 'boolean', defaultValue: 'true', desc: '首尾循环，以及指针进入时暂停、离开恢复。' },
    { name: 'showControls / showIndicators', type: 'boolean', defaultValue: 'true', desc: '左右控件与底部指示器；只关左右控件时，指示器仍可点击切换。' },
    { name: 'captionPosition', type: `'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'center'`, defaultValue: `'bottom-left'`, desc: '说明文字贴着图片的哪个位置；挂载时映射成 <code>.kui-carousel--caption-*</code>，可运行中切换。' },
    { name: 'captionSize', type: `'sm' | 'md' | 'lg'`, defaultValue: `'md'`, desc: '说明标题与正文的字号档位，映射成 <code>.kui-carousel--caption-sm / -md / -lg</code>。' },
    { name: 'setOptions(options)', type: 'method', desc: '合并参数并重新挂载，效果、节奏、高度与说明样式都可以中途修改。' },
    { name: 'play() / pause() / to(index)', type: 'method', desc: '控制播放与定位；<code>to</code> 会派发 <code>kui:carousel:change</code>。' },
    { name: 'kui:carousel:change', type: 'event', desc: '<code>detail.payload.index</code> 为切换后的下标。' },
    { name: '--kui-carousel-max-height', type: 'custom property', defaultValue: '26rem', desc: '幻灯片内直接子级 img / video 的高度上限；页面里的图片、图片网格与视觉容器都显式设置了 26rem。' },
    { name: '.kui-carousel__caption', type: 'class', desc: '贴在幻灯片上的图文浮层，内含 <code>strong</code> 与 <code>span</code> 两行；位置与字号由实例参数决定。' },
])}

${callout('自动播放只用于并列内容。视频页把 <code>autoplay</code> 关掉，组件仍在切换时暂停不在当前页的视频；设置面板里的六项参数都调用 <code>setOptions</code>，不会重建实例。图片与比例容器都受 <code>--kui-carousel-max-height</code> 约束，竖图与 4:3 图片不会再把轨道撑高。')}

`

    const mount = (selector: string, options: Partial<CarouselOptions> = {}): Carousel | null => {
        const element = root.querySelector<HTMLElement>(selector)
        if (!element) {
            return null
        }
        const instance = Carousel.getOrCreate(element, options)
        trackComponent(instance)
        return instance
    }

    mount('[data-carousel-single]', { interval: 4200, pauseOnHover: true })
    mount('[data-carousel-text]', { autoplay: false })
    mount('[data-carousel-multi]', { autoplay: false })
    mount('[data-carousel-variable]', { effect: 'fade', height: 'auto', autoplay: false })
    mount('[data-carousel-fade]', { effect: 'fade', interval: 3200 })
    mount('[data-carousel-video]', { autoplay: false })

    /* ---------- 文字悬浮：说明位置与字号 ---------- */
    const overlayElement = root.querySelector<HTMLElement>('[data-carousel-overlay]')
    if (overlayElement) {
        const overlay = Carousel.getOrCreate(overlayElement, { autoplay: false, interval: 3200 })
        trackComponent(overlay)

        const positionButtons = Array.from(
            root.querySelectorAll<HTMLButtonElement>('[data-carousel-overlay-caption]'),
        )
        const sizeButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-carousel-overlay-size]'))

        positionButtons.forEach((button) => {
            button.addEventListener('click', () => {
                positionButtons.forEach((item) => item.classList.toggle('is-active', item === button))
                const position = (button.dataset.carouselOverlayCaption ??
                    'bottom-left') as CarouselOptions['captionPosition']
                overlay.setOptions({ captionPosition: position })
            })
        })

        sizeButtons.forEach((button) => {
            button.addEventListener('click', () => {
                sizeButtons.forEach((item) => item.classList.toggle('is-active', item === button))
                const size = (button.dataset.carouselOverlaySize ?? 'md') as CarouselOptions['captionSize']
                overlay.setOptions({ captionSize: size })
            })
        })
    }

    /* ---------- 自动播放开关 ---------- */
    const toggleElement = root.querySelector<HTMLElement>('[data-carousel-toggle]')
    const toggleState = root.querySelector<HTMLElement>('[data-carousel-state]')
    if (toggleElement) {
        const instance = Carousel.getOrCreate(toggleElement, { autoplay: false, interval: 2200, showControls: false })
        trackComponent(instance)

        const paint = (): void => {
            if (!toggleState) {
                return
            }
            toggleState.textContent = instance.options.autoplay
                ? `自动播放中 · 第 ${instance.active + 1} / ${instance.length} 张 · 间隔 2200 ms`
                : `已暂停 · 第 ${instance.active + 1} / ${instance.length} 张`
        }

        root.querySelector<HTMLElement>('[data-carousel-play]')?.addEventListener('click', () => {
            instance.setOptions({ autoplay: true })
            instance.play()
            paint()
        })
        root.querySelector<HTMLElement>('[data-carousel-pause]')?.addEventListener('click', () => {
            instance.setOptions({ autoplay: false })
            instance.pause()
            paint()
        })
        toggleElement.addEventListener('kui:carousel:change', paint)
        paint()
    }

    /* ---------- 设置面板 ---------- */
    const panelElement = root.querySelector<HTMLElement>('[data-carousel-main]')
    if (panelElement) {
        const instance = Carousel.getOrCreate(panelElement, {
            autoplay: false,
            effect: 'fade',
            interval: 3600,
            height: 'auto',
            showControls: false,
        })
        trackComponent(instance)

        const autoplayInput = root.querySelector<HTMLInputElement>('[data-carousel-main-autoplay]')
        const fadeInput = root.querySelector<HTMLInputElement>('[data-carousel-main-fade]')
        const intervalInput = root.querySelector<HTMLInputElement>('[data-carousel-main-interval]')
        const intervalLabel = root.querySelector<HTMLOutputElement>('[data-carousel-main-interval-label]')
        const heightButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-carousel-main-height]'))
        const captionPositionInput = root.querySelector<HTMLSelectElement>('[data-carousel-main-caption-position]')
        const captionSizeButtons = Array.from(
            root.querySelectorAll<HTMLButtonElement>('[data-carousel-main-caption-size]'),
        )
        const stateText = root.querySelector<HTMLElement>('[data-carousel-main-state]')
        let heightMode: 'auto' | 'fixed' = 'auto'

        const paint = (): void => {
            if (instance.options.effect === 'fade') {
                clearTrackTransform(panelElement)
            }
            if (!stateText) {
                return
            }
            const effect = instance.options.effect === 'fade' ? '渐变' : '位移'
            const position = CAPTION_POSITION_LABELS[instance.options.captionPosition]
            const size = CAPTION_SIZE_LABELS[instance.options.captionSize]
            stateText.textContent = `第 ${instance.active + 1} / ${instance.length} 张 · ${effect} · 间隔 ${instance.options.interval} ms · 高度 ${heightMode} · 说明 ${position} / ${size}`
        }

        autoplayInput?.addEventListener('change', () => {
            instance.setOptions({ autoplay: autoplayInput.checked })
            if (autoplayInput.checked) {
                instance.play()
            } else {
                instance.pause()
            }
            paint()
        })

        fadeInput?.addEventListener('change', () => {
            instance.setOptions({ effect: fadeInput.checked ? 'fade' : 'slide' })
            if (fadeInput.checked) {
                clearTrackTransform(panelElement)
            }
            paint()
        })

        intervalInput?.addEventListener('input', () => {
            if (intervalLabel) {
                intervalLabel.textContent = `${intervalInput.value} ms`
            }
            instance.setOptions({ interval: Number(intervalInput.value) })
            paint()
        })

        heightButtons.forEach((button) => {
            button.addEventListener('click', () => {
                heightMode = button.dataset.carouselMainHeight === 'fixed' ? 'fixed' : 'auto'
                heightButtons.forEach((item) => item.classList.toggle('is-active', item === button))
                if (heightMode === 'fixed') {
                    panelElement.style.setProperty('--kui-carousel-max-height', '13rem')
                } else {
                    panelElement.style.removeProperty('--kui-carousel-max-height')
                }
                instance.setOptions({ height: heightMode })
                paint()
            })
        })

        captionPositionInput?.addEventListener('change', () => {
            const position = captionPositionInput.value as CarouselOptions['captionPosition']
            instance.setOptions({ captionPosition: position })
            paint()
        })

        captionSizeButtons.forEach((button) => {
            button.addEventListener('click', () => {
                captionSizeButtons.forEach((item) => item.classList.toggle('is-active', item === button))
                const size = (button.dataset.carouselMainCaptionSize ?? 'md') as CarouselOptions['captionSize']
                instance.setOptions({ captionSize: size })
                paint()
            })
        })

        panelElement.addEventListener('kui:carousel:change', (event) => {
            const index = (event as CustomEvent<KuiEventDetail<{ index: number }>>).detail.payload?.index
            if (typeof index === 'number') {
                paint()
            }
        })

        paint()
    }
}
