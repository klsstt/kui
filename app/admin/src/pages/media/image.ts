import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 图片。
 * 响应式是默认行为，圆角、缩略图、比例容器与浮层各自只做一件事：
 * 同一份素材在列表、卡片与详情页里复用，不重新裁图，也不改变页面布局。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '图片决定内容页面的第一印象。KUI 让图片默认随容器缩放，圆角、缩略图、比例容器与浮层是可以任意叠加的单一修饰：同一份素材放进缩略图列表、封面卡片或专题浮层，都不需要重新导出。',
    tags: ['Image', '.kui-img-responsive', '.kui-img-ratio', '.kui-media-overlay'],
})}

${sectionTitle('基础用法', '先让图片自己适应宽度，再按场景加一层修饰：圆角切边、缩略图加内边距与细边框。')}

${demo({
    title: '响应式与圆角',
    desc: '不写宽度，图片跟随容器伸缩，高度按原比例换算；圆角只切边缘，不改变占位。带 width / height 的图片在解码完成前就占好位置，列表不会跳行。',
    tags: ['.kui-img-responsive', '.kui-img-rounded'],
    html: `
<div class="kui-grid kui-grid--lg">
    <figure class="kui-figure">
        <img class="kui-img-responsive kui-img-rounded" src="./images/photos/city-1.jpg" alt="街头舞者脚上的运动鞋与地面的涂鸦" width="1920" height="1200" decoding="async">
        <figcaption class="kui-figure__caption">响应式 + 圆角：宽度跟随容器，高度按 8 : 5 换算，窄到 320px 也不溢出。</figcaption>
    </figure>
    <figure class="kui-figure">
        <img class="kui-img-responsive kui-img-rounded" src="./images/photos/city-2.jpg" alt="黑白影调的女性肖像" width="1440" height="900" decoding="async">
        <figcaption class="kui-figure__caption">同一组类名换一张素材即可复用，卡片与详情页共用一条规则。</figcaption>
    </figure>
</div>`,
})}

${demo({
    title: '缩略图',
    desc: '缩略图在原图外再包一层内边距与细边框，用于附件预览与相册列表；它仍然等比缩小，不裁切内容。',
    tags: ['.kui-img-thumbnail', '.kui-max-w-xs'],
    html: `
<div class="kui-cluster">
    <figure class="kui-figure kui-max-w-xs">
        <img class="kui-img-thumbnail" src="./images/photos/city-3.jpg" alt="戴耳机闭眼聆听的女性" width="1280" height="720" decoding="async">
        <figcaption class="kui-figure__caption">附件预览 · city-3</figcaption>
    </figure>
    <figure class="kui-figure kui-max-w-xs">
        <img class="kui-img-thumbnail" src="./images/photos/city-4.jpg" alt="低头看向侧面的女性" width="1920" height="1200" decoding="async">
        <figcaption class="kui-figure__caption">缩略图不裁切，只等比缩小。</figcaption>
    </figure>
    <figure class="kui-figure kui-max-w-xs">
        <img class="kui-img-thumbnail" src="./images/portraits/1.jpg" alt="手绘的卡通人脸" width="526" height="525" decoding="async">
        <figcaption class="kui-figure__caption">方形素材同样完整显示。</figcaption>
    </figure>
    <figure class="kui-figure kui-max-w-xs">
        <img class="kui-img-thumbnail" src="./images/portraits/2.jpg" alt="趴在桌边的橘猫" width="480" height="480" decoding="async">
        <figcaption class="kui-figure__caption">四个缩略图在窄屏自动折行。</figcaption>
    </figure>
</div>`,
})}

${sectionTitle('比例与交互', '封面位需要固定的形状时，用比例容器先占位；需要提示可点击时，再加悬停放大或压一层文字。')}

${demo({
    title: '比例裁切',
    desc: '比例容器先按比例占出空间，图片以 cover 填满：原图尺寸不一致也不会撑乱栅格，加载过程中不跳行。预设 16 : 9、4 : 3、1 : 1，其余比例用 --kui-img-ratio 就地覆盖。',
    tags: ['.kui-img-ratio', '--kui-img-ratio', '.kui-img-ratio--4x3'],
    html: `
<div class="kui-grid">
    <figure class="kui-figure">
        <div class="kui-img-ratio"><img src="./images/photos/city-5.jpg" alt="石雕门柱与铁艺大门" decoding="async"></div>
        <figcaption class="kui-figure__caption">默认 16 : 9，用于封面与视频位。</figcaption>
    </figure>
    <figure class="kui-figure">
        <div class="kui-img-ratio kui-img-ratio--4x3"><img src="./images/photos/city-6.jpg" alt="海面上的悬索桥" decoding="async"></div>
        <figcaption class="kui-figure__caption">4 : 3，用于图文卡片。</figcaption>
    </figure>
    <figure class="kui-figure">
        <div class="kui-img-ratio kui-img-ratio--1x1"><img src="./images/portraits/7.jpg" alt="动漫风格的女性肖像" decoding="async"></div>
        <figcaption class="kui-figure__caption">1 : 1，用于商品与头像。</figcaption>
    </figure>
    <figure class="kui-figure">
        <div class="kui-img-ratio" style="--kui-img-ratio: 21 / 9"><img src="./images/portraits/4.jpg" alt="戴头盔与面罩的人" decoding="async"></div>
        <figcaption class="kui-figure__caption">局部比例用自定义属性覆盖，不新增类名。</figcaption>
    </figure>
</div>`,
})}

${demo({
    title: '悬停放大',
    desc: '指针进入时把图片放大 4%，用极小的位移提示「可以打开」；外层容器负责裁掉溢出，图片本身不改变尺寸。',
    tags: ['.kui-img-hover', '.kui-img-ratio--4x3'],
    html: `
<div class="kui-grid kui-grid--md">
    <figure class="kui-figure">
        <div class="kui-img-hover">
            <div class="kui-img-ratio kui-img-ratio--4x3"><img src="./images/portraits/5.jpg" alt="雾中的人影" decoding="async"></div>
        </div>
        <figcaption class="kui-figure__caption">作品集封面</figcaption>
    </figure>
    <figure class="kui-figure">
        <div class="kui-img-hover">
            <div class="kui-img-ratio kui-img-ratio--4x3"><img src="./images/portraits/6.jpg" alt="戴狮子鬃毛头套的猫" decoding="async"></div>
        </div>
        <figcaption class="kui-figure__caption">活动回顾</figcaption>
    </figure>
    <figure class="kui-figure">
        <div class="kui-img-hover">
            <div class="kui-img-ratio kui-img-ratio--4x3"><img src="./images/portraits/7.jpg" alt="动漫风格的女性肖像" decoding="async"></div>
        </div>
        <figcaption class="kui-figure__caption">目的地相册</figcaption>
    </figure>
</div>`,
})}

${demo({
    title: '图文浮层',
    desc: '标题与一行说明压在图片底部，用渐变压暗保证对比度；浮层只回答「这是什么」，不放操作按钮，避免把入口拆成两个点击区。',
    tags: ['.kui-media-overlay', '.kui-media-overlay__body'],
    stage: 'tinted',
    html: `
<div class="kui-grid kui-grid--md">
    <figure class="kui-media-overlay">
        <img src="./images/photos/city-1.jpg" alt="街头舞者脚上的运动鞋与地面的涂鸦" decoding="async">
        <figcaption class="kui-media-overlay__body">
            <strong>城市声场</strong>
            <span>露天演出 · 9 月 18 日</span>
        </figcaption>
    </figure>
    <figure class="kui-media-overlay">
        <img src="./images/photos/city-4.jpg" alt="低头看向侧面的女性" decoding="async">
        <figcaption class="kui-media-overlay__body">
            <strong>窗边的工作台</strong>
            <span>专题 · 12 张照片</span>
        </figcaption>
    </figure>
    <figure class="kui-media-overlay">
        <img src="./images/portraits/8.jpg" alt="手绘的人物侧脸" decoding="async">
        <figcaption class="kui-media-overlay__body">
            <strong>织物与光</strong>
            <span>2026 秋季展 · 32 件作品</span>
        </figcaption>
    </figure>
</div>`,
})}

${propsTable([
    { name: '.kui-img-responsive', type: 'class', desc: '宽度跟随容器、高度按原比例，是图片的默认用法。' },
    { name: '.kui-img-rounded', type: 'class', desc: '按大圆角裁边，可与响应式、比例容器叠加。' },
    { name: '.kui-img-circle', type: 'class', desc: '正圆头像：固定 1 : 1 并 cover 填满。' },
    { name: '.kui-img-thumbnail', type: 'class', defaultValue: '—', desc: '内边距 + 细边框 + 轻投影，用于列表与附件预览。' },
    { name: '.kui-img-ratio', type: 'class', desc: '先占比例再裁切，子级 img / video 自动 cover 填满。' },
    { name: '--kui-img-ratio', type: 'custom property', defaultValue: '16 / 9', desc: '自定义比例，写法如 <code>21 / 9</code>；预设类有 <code>--2x1</code>、<code>--4x3</code>、<code>--1x1</code>。' },
    { name: '.kui-img-hover', type: 'class', desc: '悬停时放大 4%，需要外包一层容器来裁掉溢出。' },
    { name: '.kui-media-overlay', type: 'class', desc: '图文浮层容器，内部 <code>kui-media-overlay__body</code> 固定贴在底部。' },
    { name: 'alt', type: 'attribute', desc: '必填，用中文描述图片内容；纯装饰图片写空值以表明意图。' },
    { name: 'loading / decoding', type: 'attribute', defaultValue: 'eager / auto', desc: '首屏以下的图片用 <code>lazy</code> + <code>async</code>，减少首屏解码开销。' },
    { name: 'width / height', type: 'attribute', desc: '声明原始像素尺寸，浏览器提前按比例占位；列表与栅格里的图片必须带上。' },
])}

${callout('比例容器与 <code>width</code> / <code>height</code> 解决的是同一个问题：在图片到达前把位置占住。列表与卡片优先给尺寸，封面位优先用比例容器；两者同时存在时，比例容器决定显示形状。')}

`
}
