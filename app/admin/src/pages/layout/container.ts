import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 容器。
 * 两个容器各管一件事：.kui-container 只负责把内容收进可读宽度并居中，
 * .kui-board 只负责给出一个可信的内容面（边框、圆角、背景与内边距）。
 * 滚动也只交给 .kui-scroll-auto，页面本身不出现第三种宽度规则。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '容器决定内容离屏幕边缘有多远。.kui-container 把内容收进可读宽度并居中，.kui-board 提供一张有边界的内容面；宽度、内边距与滚动各由一个类负责，页面里不再出现第二套定宽与 margin。',
    tags: ['.kui-container', '.kui-board', '.kui-scroll-auto'],
})}

${demo({
    title: '固定宽度：把内容收进可读区间',
    desc: '外层浅底代表可用的全部宽度，白色内容面代表容器收进来的宽度：默认上限 1200px，表单页收到 22–26rem。上限只在宽屏生效，窄屏由两侧留白兜底。',
    tags: ['.kui-container', '--kui-container-max-width'],
    html: `
<div class="kui-stack kui-stack--tight">
    <div class="kui-board panel--muted kui-stack kui-stack--tight">
        <span class="kui-stat__label">--kui-container-max-width: 22rem</span>
        <div class="kui-container" style="--kui-container-max-width: 22rem">
            <div class="kui-board kui-stack kui-stack--tight">
                <strong>22rem 读宽</strong>
                <span class="form-hint">表单页与设置页把上限收到 26rem 以内，一行文字不需要转头。</span>
            </div>
        </div>
        <span class="form-hint">两侧剩下的浅底，就是容器主动放弃的宽度。</span>
    </div>
    <div class="kui-board panel--muted kui-stack kui-stack--tight">
        <span class="kui-stat__label">默认上限 1200px</span>
        <div class="kui-container kui-stack kui-stack--tight">
            <div class="kui-board">可用宽度小于上限时，容器等于满宽，不会二次收窄。</div>
            <div class="kui-board">容器只做居中与限宽，不参与栅格与分栏计算。</div>
        </div>
    </div>
</div>`,
})}

${demo({
    title: '流式宽度：跟着父级走',
    desc: '不套容器时，内容面直接铺满父级：表格、看板、时间线这类「看」的区域需要更多列，收窄反而降低信息密度。',
    tags: ['.kui-w-full', '.kui-grid'],
    html: `
<div class="kui-board panel--muted kui-stack kui-stack--tight">
    <span class="kui-stat__label">不套容器 · 100% 宽</span>
    <div class="kui-board kui-w-full kui-stack kui-stack--tight">
        <strong>流式内容</strong>
        <span class="form-hint">父级多宽就用多宽；列数仍然交给栅格，而不是靠宽度写死。</span>
        <div class="kui-grid kui-grid--sm">
            <div class="kui-board panel--muted">一周</div>
            <div class="kui-board panel--muted">一月</div>
            <div class="kui-board panel--muted">一季</div>
            <div class="kui-board panel--muted">一年</div>
        </div>
    </div>
    <span class="form-hint">同一段内容换成固定读宽，只在外层加一个 .kui-container 即可。</span>
</div>`,
})}

${sectionTitle('嵌套与滚动', '容器可以嵌套，但只保留一层限宽意图；滚动则永远只发生在明确标注的那一块。')}

${demo({
    title: '嵌套容器：外层读宽，内层收窄',
    desc: '外层容器负责整页读宽，内层容器只负责一段表单的读宽。两层各自居中，不会因为嵌套而再次扣掉留白。',
    tags: ['.kui-container', '.kui-board', '嵌套'],
    html: `
<div class="kui-board panel--muted">
    <div class="kui-container kui-stack kui-stack--tight" style="--kui-container-max-width: 40rem">
        <span class="kui-stat__label">外层容器 · 40rem</span>
        <div class="kui-board kui-stack kui-stack--tight">
            <strong>团队设置</strong>
            <span class="form-hint">外层容器只负责整页读宽，标题与说明跟着它走。</span>
            <div class="kui-container kui-stack kui-stack--tight" style="--kui-container-max-width: 22rem">
                <div class="kui-board panel--muted">内层容器 · 22rem</div>
                <div class="kui-board panel--muted">只负责这一段表单的读宽</div>
            </div>
        </div>
    </div>
</div>`,
})}

${demo({
    title: '局部滚动：只滚这一块',
    desc: '给滚动块加 tabindex="0" 与 role="region"，键盘可以进入并滚动它；max-height 决定滚动从哪里开始，页头与工具栏保持不动。',
    tags: ['.kui-scroll-auto', 'tabindex="0"', 'max-height'],
    html: `
<section class="panel">
    <div class="panel-heading">
        <h3 class="panel-title">操作日志</h3>
        <div class="panel-actions"><span class="badge badge-neutral">共 24 条</span></div>
    </div>
    <div class="kui-scroll-auto" style="max-height: 11rem" tabindex="0" role="region" aria-label="操作日志，可滚动">
        <ul class="kui-list kui-list--flush">
            <li class="kui-list__item">
                <span class="kui-list__media"><span class="kui-avatar kui-avatar--sm">林</span></span>
                <span class="kui-list__body">
                    <span class="kui-list__title">修改了发货地址</span>
                    <span class="kui-list__meta">09:41 · 订单 KUI-20481</span>
                </span>
            </li>
            <li class="kui-list__item">
                <span class="kui-list__media"><span class="kui-avatar kui-avatar--sm">周</span></span>
                <span class="kui-list__body">
                    <span class="kui-list__title">批量导入了 18 个订单</span>
                    <span class="kui-list__meta">09:12 · 文件 orders-1027.csv</span>
                </span>
            </li>
            <li class="kui-list__item">
                <span class="kui-list__media"><span class="kui-avatar kui-avatar--sm">系</span></span>
                <span class="kui-list__body">
                    <span class="kui-list__title">自动合并了 3 个包裹</span>
                    <span class="kui-list__meta">08:50 · 同一收货地址</span>
                </span>
            </li>
            <li class="kui-list__item">
                <span class="kui-list__media"><span class="kui-avatar kui-avatar--sm">林</span></span>
                <span class="kui-list__body">
                    <span class="kui-list__title">打印了 12 张面单</span>
                    <span class="kui-list__meta">08:31 · 打印机 A-02</span>
                </span>
            </li>
            <li class="kui-list__item">
                <span class="kui-list__media"><span class="kui-avatar kui-avatar--sm">周</span></span>
                <span class="kui-list__body">
                    <span class="kui-list__title">退回了 1 个异常订单</span>
                    <span class="kui-list__meta">08:05 · 地址无法识别</span>
                </span>
            </li>
            <li class="kui-list__item">
                <span class="kui-list__media"><span class="kui-avatar kui-avatar--sm">系</span></span>
                <span class="kui-list__body">
                    <span class="kui-list__title">同步了渠道库存</span>
                    <span class="kui-list__meta">07:58 · 全量 1,284 条</span>
                </span>
            </li>
        </ul>
    </div>
</section>`,
})}

${demo({
    title: '内边距与背景：同一张内容面的四种密度',
    desc: '四个块共用一像素描边，只换内边距与底色：默认呼吸、紧凑分栏、零内边距的整行点击，以及第二层的浅底。',
    tags: ['--kui-board-padding', '.panel--muted'],
    html: `
<div class="kui-grid kui-grid--md">
    <div class="kui-board kui-stack kui-stack--tight">
        <strong>默认内边距</strong>
        <span class="form-hint">取 --kui-space-4，独立内容块四周留出统一呼吸。</span>
    </div>
    <div class="kui-board kui-stack kui-stack--tight" style="--kui-board-padding: var(--kui-space-2)">
        <strong>紧凑内边距</strong>
        <span class="form-hint">放在分栏或列表里的内容块，减少二次缩进。</span>
    </div>
    <div class="kui-board kui-stack kui-stack--tight" style="--kui-board-padding: 0">
        <strong>内边距为 0</strong>
        <span class="form-hint">交给子元素贴边，例如整行可点击的列表。</span>
    </div>
    <div class="kui-board panel--muted kui-stack kui-stack--tight">
        <strong>浅底内容面</strong>
        <span class="form-hint">同样是一像素描边，换成浅底就成了第二层。</span>
    </div>
</div>`,
})}

${callout('滚动块需要<strong>同时</strong>给出 <code>tabindex="0"</code>、<code>role="region"</code> 与可读的 <code>aria-label</code>：前两者让键盘用户进得去、退得出，后者让屏幕阅读器知道这块区域是什么。')}

${propsTable([
    { name: '.kui-container', type: 'class', defaultValue: '1200px', desc: '居中并限宽，宽度为 <code>min(100% - 32px, 上限)</code>。' },
    { name: '--kui-container-max-width', type: 'attribute', defaultValue: '1200px', desc: '覆盖读宽上限，例如 <code>22rem</code> 的表单页或 <code>40rem</code> 的设置页。' },
    { name: '.kui-w-full', type: 'class', defaultValue: '—', desc: '流式宽度：跟随父级，不设上限。' },
    { name: '.kui-board', type: 'class', defaultValue: '—', desc: '内容面：一像素描边、6px 圆角、背景、容器阴影与内边距。' },
    { name: '--kui-board-padding', type: 'attribute', defaultValue: 'var(--kui-space-4)', desc: '内容面内边距；设为 <code>0</code> 时交给子元素贴边。' },
    { name: '.panel--muted', type: 'class', defaultValue: '—', desc: '浅底内容面：去掉阴影与描边，表达第二层信息。' },
    { name: '.kui-scroll-auto', type: 'class', defaultValue: '—', desc: '局部滚动：内容超出自适应，并保留滚动条槽位。' },
    { name: 'max-height', type: 'attribute', defaultValue: '内容高度', desc: '滚动从哪里开始，写在滚动块上；不要给整页加滚动。' },
    { name: 'tabindex="0" + role="region"', type: 'attribute', defaultValue: '—', desc: '让滚动块可被键盘聚焦，并带 <code>aria-label</code> 说明内容。' },
])}

`
}
