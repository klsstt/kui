import type { DocPageContext } from '../../docs/types'
import { demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 内容区。
 * 内容区回答三个问题：页头说什么、主体怎么排、超出时在哪里滚动。
 * 留白只取两级：区块之间用宽松节奏，区块内部用紧凑节奏。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '内容区是页面最常重复的那一段结构：页头给出语境与主操作，主体承载信息，侧栏放补充说明。留白分两级、滚动只发生在一个明确标注的区域，用户才不会在长页面里迷路。',
    tags: ['.kui-page-header', '.kui-split', '.kui-scroll-auto'],
})}

${demo({
    title: '内容区骨架',
    desc: '页头、主体、侧栏三段各就各位；侧栏宽度固定，主体吃掉剩余空间。',
    tags: ['.kui-page-header', '.kui-split'],
    html: `
<div class="kui-stack kui-stack--loose">
    <header class="kui-page-header">
        <div class="kui-page-header__text">
            <p class="kui-page-header__eyebrow">订单中心 · 今日</p>
            <h2 class="kui-page-header__title">待发货订单</h2>
            <p class="kui-page-header__desc">共 42 单待处理，其中 6 单超过承诺发货时间。</p>
        </div>
        <div class="kui-page-header__actions">
            <button type="button" class="btn btn-default btn-sm">批量打印</button>
            <button type="button" class="btn btn-primary btn-sm"><i class="fa fa-truck" aria-hidden="true"></i> 一键发货</button>
        </div>
    </header>
    <div class="kui-split kui-split--main-first" style="--kui-split-sidebar: 13rem">
        <section class="kui-board">
            <ul class="kui-list kui-list--flush">
                <li class="kui-list__item">
                    <span class="kui-list__body">
                        <span class="kui-list__title">KUI-20481 · 秋季满减套装</span>
                        <span class="kui-list__meta">林澈 · 2 件 · 已付款</span>
                    </span>
                    <span class="kui-list__aside">09:24</span>
                </li>
                <li class="kui-list__item">
                    <span class="kui-list__body">
                        <span class="kui-list__title">KUI-20479 · 桌面收纳组合</span>
                        <span class="kui-list__meta">周昕 · 1 件 · 已付款</span>
                    </span>
                    <span class="kui-list__aside">09:02</span>
                </li>
            </ul>
        </section>
        <aside class="kui-board kui-stack kui-stack--tight">
            <strong>发货提示</strong>
            <p class="form-hint">同一收货地址的订单会合并为一个包裹。</p>
            <p class="form-hint">修改地址后需要重新打印面单。</p>
        </aside>
    </div>
</div>`,
})}

${sectionTitle('留白节奏', '区块之间松、区块内部紧；两级节奏覆盖绝大多数页面，不再逐处微调。')}

${demo({
    title: '两级留白',
    desc: '外层 stack 用 loose 拉开三个区块，区块内部用 tight 收紧标题与说明。',
    tags: ['.kui-stack--loose', '.kui-stack--tight'],
    html: `
<div class="kui-stack kui-stack--loose">
    <section class="kui-board kui-stack kui-stack--tight">
        <strong>第一段：结论</strong>
        <p class="form-hint">区块之间松，读者能一眼看出段落边界。</p>
    </section>
    <section class="kui-board kui-stack kui-stack--tight">
        <strong>第二段：拆解</strong>
        <p class="form-hint">区块内部紧，标题与说明仍然属于同一个信息单元。</p>
    </section>
    <section class="kui-board kui-stack kui-stack--tight">
        <strong>第三段：动作</strong>
        <p class="form-hint">两级节奏之外不再出现第三种间距。</p>
    </section>
</div>`,
})}

${demo({
    title: '滚动区',
    desc: '只让表格或列表滚动，页头与工具栏保持不动；滚动容器会保留滚动条位置，避免内容左右跳动。',
    tags: ['.kui-scroll-auto'],
    html: `
<section class="panel">
    <div class="panel-heading">
        <h3 class="panel-title">操作日志</h3>
        <div class="panel-actions"><span class="badge badge-neutral">共 24 条</span></div>
    </div>
    <div class="kui-scroll-auto" style="max-height: 12rem" tabindex="0" role="region" aria-label="可滚动内容区">
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
        </ul>
    </div>
</section>`,
})}

${demo({
    title: '空态与加载态',
    desc: '没有数据时说明原因与下一步；数据在路上时用骨架占住结构，避免内容到位时整页跳动。',
    tags: ['.kui-empty', '.kui-skeleton'],
    html: `
<div class="kui-grid kui-grid--md">
    <section class="panel">
        <div class="panel-body">
            <div class="kui-empty">
                <i class="fa fa-inbox" aria-hidden="true"></i>
                <strong>暂无待处理工单</strong>
                <p>新的工单会出现在这里，处理完成后自动归档。</p>
            </div>
        </div>
    </section>
    <section class="panel">
        <div class="panel-body">
            <div class="kui-stack kui-stack--tight">
                <div class="kui-skeleton kui-skeleton--title"></div>
                <div class="kui-skeleton kui-skeleton--text"></div>
                <div class="kui-skeleton kui-skeleton--text"></div>
                <div class="kui-skeleton kui-skeleton--text"></div>
                <div class="kui-skeleton kui-skeleton--text"></div>
            </div>
        </div>
    </section>
</div>`,
})}

${propsTable([
    { name: '.kui-page-header', type: 'class', defaultValue: '—', desc: '页头容器：文字区与动作区两端对齐，窄屏自动换行。' },
    { name: '.kui-page-header__eyebrow', type: 'class', defaultValue: '—', desc: '页头上方的一行语境，例如时间范围或所属模块。' },
    { name: '.kui-page-header__actions', type: 'class', defaultValue: '—', desc: '右侧动作区，主操作只放一个。' },
    { name: '.kui-scroll-auto', type: 'class', defaultValue: '—', desc: '独立滚动区：内容超出自适应，并保留滚动条槽位。' },
    { name: 'overscroll-behavior', type: 'attribute', defaultValue: 'contain', desc: '滚动到边界时不带动整页，长内容不会「滚穿」。' },
    { name: '.kui-empty', type: 'class', defaultValue: '—', desc: '空态：一个图标、一句结论、一句下一步。' },
    { name: '.kui-skeleton--text / --title', type: 'class', defaultValue: '—', desc: '占位块高度，与真实文本行高保持一致。' },
])}

`
}
