import type { DocPageContext } from '../../docs/types'
import { demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 行布局。
 * 一行放几列由可用宽度决定：等分交给 grid 与 split 的 1fr，
 * 主次交给 split 的两列模板，行内元素的换行与对齐交给 cluster。
 * 每个区块用不同底色标出边界，读者不必读文字也能看出这一行想表达什么。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '行布局只回答一个问题：这一行放几列。列数由可用宽度推导，主次由分栏模板决定，行内元素的对齐交给横向簇；KUI 没有 12 列栅格类，也就不需要为每个断点重写列宽。',
    tags: ['.kui-grid', '.kui-split', '.kui-cluster'],
})}

${demo({
    title: '等分：每一列同样重要',
    desc: '两等分用 split 的 1fr，三列及以上用 grid；相邻两列一白一浅，边界不用看文字也能分辨。',
    tags: ['--kui-split-sidebar: 1fr', '.kui-grid--sm'],
    html: `
<div class="kui-stack kui-stack--tight">
    <div class="kui-split" style="--kui-split-sidebar: 1fr; --kui-split-gap: var(--kui-space-3)">
        <div class="kui-board kui-stack kui-stack--tight">
            <span class="kui-stat__label">两等分 · 左</span>
            <strong>成交额</strong>
            <span class="form-hint">两条轨道都是 1fr，宽度天然相等。</span>
        </div>
        <div class="kui-board panel--muted kui-stack kui-stack--tight">
            <span class="kui-stat__label">两等分 · 右</span>
            <strong>订单数</strong>
            <span class="form-hint">换成浅底只表达「这是另一块」，不改变宽度。</span>
        </div>
    </div>
    <div class="kui-grid kui-grid--sm">
        <div class="kui-board kui-stack kui-stack--tight"><span class="kui-stat__label">四等分 · 01</span><strong>渠道</strong></div>
        <div class="kui-board panel--muted kui-stack kui-stack--tight"><span class="kui-stat__label">四等分 · 02</span><strong>转化率</strong></div>
        <div class="kui-board kui-stack kui-stack--tight"><span class="kui-stat__label">四等分 · 03</span><strong>客单价</strong></div>
        <div class="kui-board panel--muted kui-stack kui-stack--tight"><span class="kui-stat__label">四等分 · 04</span><strong>复购</strong></div>
    </div>
</div>`,
})}

${demo({
    title: '主次：一列固定，一列吃掉剩余',
    desc: '侧栏宽度固定、主体随窗口收缩；需要主内容在左时加 --main-first。浅底永远落在「次要」的那一列。',
    tags: ['.kui-split', '--kui-split-sidebar', '.kui-split--main-first'],
    html: `
<div class="kui-stack kui-stack--tight">
    <div class="kui-split" style="--kui-split-sidebar: 11rem; --kui-split-gap: var(--kui-space-3)">
        <aside class="kui-board panel--muted kui-stack kui-stack--tight">
            <span class="kui-stat__label">侧栏 · 11rem</span>
            <strong>筛选条件</strong>
            <span class="form-hint">渠道 · 全部</span>
            <span class="form-hint">状态 · 进行中</span>
        </aside>
        <section class="kui-board kui-stack kui-stack--tight">
            <span class="kui-stat__label">主体 · 1fr</span>
            <strong>订单列表</strong>
            <span class="form-hint">宽度随窗口变化，但不会窄于内容可读的下限。</span>
        </section>
    </div>
    <div class="kui-split kui-split--main-first" style="--kui-split-sidebar: 11rem; --kui-split-gap: var(--kui-space-3)">
        <section class="kui-board kui-stack kui-stack--tight">
            <span class="kui-stat__label">主体在左</span>
            <strong>工单详情</strong>
            <span class="form-hint">--main-first 把主内容放到第一列。</span>
        </section>
        <aside class="kui-board panel--muted kui-stack kui-stack--tight">
            <span class="kui-stat__label">辅助栏 · 11rem</span>
            <strong>属性</strong>
            <span class="form-hint">放说明与次要动作，随时可以整块消失。</span>
        </aside>
    </div>
</div>`,
})}

${demo({
    title: '自动换行：先换行，再压缩',
    desc: '同一组标签，宽的一侧一行排开，窄的一侧自动折行；容器没有写任何断点，换行由 cluster 自己处理。',
    tags: ['.kui-cluster', '.kui-max-w-sm'],
    html: `
<div class="kui-split" style="--kui-split-sidebar: 1fr; --kui-split-gap: var(--kui-space-3)">
    <div class="kui-board kui-stack kui-stack--tight">
        <span class="kui-stat__label">宽度够时一行排开</span>
        <div class="kui-cluster" style="--kui-cluster-gap: var(--kui-space-2)">
            <span class="tag">待付款</span>
            <span class="tag">待发货</span>
            <span class="tag">运输中</span>
            <span class="tag">已签收</span>
            <span class="tag">退款中</span>
            <span class="tag">已关闭</span>
        </div>
    </div>
    <div class="kui-board panel--muted kui-stack kui-stack--tight">
        <span class="kui-stat__label">宽度不够时折行</span>
        <div class="kui-max-w-sm kui-stack kui-stack--tight">
            <div class="kui-cluster" style="--kui-cluster-gap: var(--kui-space-2)">
                <span class="tag">待付款</span>
                <span class="tag">待发货</span>
                <span class="tag">运输中</span>
                <span class="tag">已签收</span>
                <span class="tag">退款中</span>
                <span class="tag">已关闭</span>
            </div>
        </div>
    </div>
</div>`,
})}

${demo({
    title: '行内对齐：主轴与基线',
    desc: '主轴对齐交给 --kui-cluster-justify（flex-start / center / flex-end），文字混排时交叉轴用 baseline，不同字号才会落在同一条基线上。',
    tags: ['--kui-cluster-justify', '--kui-cluster-align'],
    html: `
<div class="kui-stack kui-stack--tight">
    <div class="kui-board panel--muted">
        <div class="kui-cluster" style="--kui-cluster-justify: flex-start">
            <span class="badge badge-primary">start</span>
            <strong>从行首开始</strong>
            <span class="form-hint">默认对齐，标题与动作都靠左。</span>
        </div>
    </div>
    <div class="kui-board panel--muted">
        <div class="kui-cluster" style="--kui-cluster-justify: center">
            <span class="badge badge-primary">center</span>
            <strong>整行居中</strong>
            <span class="form-hint">用于一句结论或空态里的操作。</span>
        </div>
    </div>
    <div class="kui-board panel--muted">
        <div class="kui-cluster" style="--kui-cluster-justify: flex-end">
            <span class="form-hint">说明在前、动作靠右</span>
            <span class="badge badge-primary">end</span>
            <button type="button" class="btn btn-primary btn-sm">保存</button>
        </div>
    </div>
    <div class="kui-board">
        <div class="kui-cluster" style="--kui-cluster-align: baseline">
            <span class="kui-stat__label">baseline</span>
            <span class="kui-stat__value">12,480</span>
            <small class="form-hint">不同字号按基线排在同一行，数字与说明不会上下错位。</small>
        </div>
    </div>
</div>`,
})}

${demo({
    title: '行间距：一个变量控制整行',
    desc: '同一组元素只换 --kui-cluster-gap，行与行之间不需要额外 margin；分栏与栅格也各有自己的 gap 变量，互不叠加。',
    tags: ['--kui-cluster-gap', '--kui-split-gap', '--kui-grid-gap'],
    html: `
<div class="kui-stack kui-stack--tight">
    <div class="kui-board kui-stack kui-stack--tight">
        <span class="kui-stat__label">--kui-cluster-gap: var(--kui-space-2) · 8px</span>
        <div class="kui-cluster" style="--kui-cluster-gap: var(--kui-space-2)">
            <span class="badge badge-neutral">近 7 天</span>
            <span class="badge badge-neutral">近 30 天</span>
            <span class="badge badge-neutral">本季度</span>
        </div>
    </div>
    <div class="kui-board kui-stack kui-stack--tight">
        <span class="kui-stat__label">默认 · var(--kui-space-3)</span>
        <div class="kui-cluster">
            <span class="badge badge-neutral">近 7 天</span>
            <span class="badge badge-neutral">近 30 天</span>
            <span class="badge badge-neutral">本季度</span>
        </div>
    </div>
    <div class="kui-board kui-stack kui-stack--tight">
        <span class="kui-stat__label">--kui-cluster-gap: var(--kui-space-5) · 20px</span>
        <div class="kui-cluster" style="--kui-cluster-gap: var(--kui-space-5)">
            <span class="badge badge-neutral">近 7 天</span>
            <span class="badge badge-neutral">近 30 天</span>
            <span class="badge badge-neutral">本季度</span>
        </div>
    </div>
</div>`,
})}

${sectionTitle('区块底色', '四种底色各对应一种意图：白底是主体，浅底是次要，主色浅底是当前项，语义浅底是结果。')}

${demo({
    title: '底色与意图的对照',
    desc: '四个块宽度相同、文字结构相同，只有底色不同：读者先看到色块的层级，再读到内容，布局意图在阅读之前就已经传达。',
    tags: ['surface', 'surface-muted', 'primary', 'success'],
    html: `
<div class="kui-stack kui-stack--tight">
    <div class="kui-board kui-stack kui-stack--tight">
        <span class="kui-stat__label">surface · 主体</span>
        <strong>默认内容面</strong>
        <span class="form-hint">白色底 + 一像素描边，承载主要信息。</span>
    </div>
    <div class="kui-board panel--muted kui-stack kui-stack--tight">
        <span class="kui-stat__label">surface-muted · 次要</span>
        <strong>浅底内容面</strong>
        <span class="form-hint">导航、辅助栏与第二层信息；去掉了阴影，层级更低。</span>
    </div>
    <ul class="kui-list">
        <li class="kui-list__item is-active">
            <span class="kui-list__body">
                <span class="kui-list__title">primary 浅底 · 当前</span>
                <span class="kui-list__meta">当前行用主色浅底加左缘色条标出，一屏只出现一处。</span>
            </span>
        </li>
    </ul>
    <div class="alert alert-success kui-stack kui-stack--tight" role="status">
        <strong>success 浅底 · 结果</strong>
        <span class="form-hint">语义浅底只标注结果（成功、警告、失败），不用来装饰普通区块。</span>
    </div>
</div>`,
})}

${propsTable([
    { name: '.kui-grid', type: 'class', defaultValue: '—', desc: '自动列网格，每列宽度相等（1fr）。' },
    { name: '--kui-grid-min', type: 'attribute', defaultValue: '16rem', desc: '最小列宽，决定一行最多能放几列。' },
    { name: '.kui-grid--sm / --md / --lg', type: 'class', defaultValue: '—', desc: '预设最小列宽 9rem / 13rem / 18rem。' },
    { name: '--kui-grid-gap', type: 'attribute', defaultValue: 'var(--kui-space-4)', desc: '栅格的行列间距。' },
    { name: '--kui-split-sidebar', type: 'attribute', defaultValue: '16rem', desc: '侧栏列宽；设为 <code>1fr</code> 即两等分。' },
    { name: '--kui-split-gap', type: 'attribute', defaultValue: 'var(--kui-space-4)', desc: '两列之间的间距。' },
    { name: '.kui-split--main-first', type: 'class', defaultValue: '—', desc: '交换两列顺序，主内容在左。' },
    { name: '--kui-cluster-justify', type: 'attribute', defaultValue: 'flex-start', desc: '行内主轴对齐：<code>flex-start</code> / <code>center</code> / <code>flex-end</code> / <code>space-between</code>。' },
    { name: '--kui-cluster-align', type: 'attribute', defaultValue: 'center', desc: '行内交叉轴对齐，文字混排可用 <code>baseline</code>。' },
    { name: '--kui-cluster-gap', type: 'attribute', defaultValue: 'var(--kui-space-3)', desc: '行内元素间距，只改这一个变量。' },
    { name: '.kui-board / .panel--muted', type: 'class', defaultValue: '—', desc: '白底与浅底两种内容面，用来区分主体与次要区块。' },
    { name: '.kui-list__item.is-active', type: 'class', defaultValue: '—', desc: '主色浅底 + 左缘色条，用于「当前行」。' },
])}

`
}
