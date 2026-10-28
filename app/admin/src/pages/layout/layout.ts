import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable } from '../../docs/ui'

/**
 * 布局。
 * 页面先选骨架，再决定骨架里用哪种排列原语：
 * 骨架只由 .kui-split、.kui-page-header 与 .kui-board 拼成，
 * 栅格负责列数、容器负责宽度，四件事各管一段，不互相叠加。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '布局先回答「页面分几栏」，再回答「每栏里怎么排」。三种骨架都由 .kui-split、.kui-page-header 与 .kui-board 组合而成；自动栅格只决定列数，容器只决定宽度，四件事各管一段，页面里不会出现第二套间距。',
    tags: ['.kui-split', '.kui-page-header', '.kui-board', '.kui-grid--sm'],
})}

${demo({
    title: '骨架一：侧栏 + 顶栏 + 内容',
    desc: '左侧常驻一级导航，顶栏放品牌与全局动作，内容区从页头开始。侧栏用浅底、内容面用白底，两层底色把「导航」和「工作区」分开。适合管理后台、运营系统。',
    tags: ['.kui-split', '.navbar', '.kui-page-header'],
    html: `
<div class="kui-split" style="--kui-split-sidebar: 9rem; --kui-split-gap: var(--kui-space-3)">
    <aside class="kui-board panel--muted kui-stack kui-stack--tight">
        <span class="kui-stat__label">工作区</span>
        <a class="navbar-link is-active" href="javascript:void(0)"><i class="fa fa-th-large" aria-hidden="true"></i> 概览</a>
        <a class="navbar-link" href="javascript:void(0)"><i class="fa fa-list" aria-hidden="true"></i> 订单</a>
        <a class="navbar-link" href="javascript:void(0)"><i class="fa fa-users" aria-hidden="true"></i> 客户</a>
        <a class="navbar-link" href="javascript:void(0)"><i class="fa fa-cog" aria-hidden="true"></i> 设置</a>
    </aside>
    <div class="kui-board kui-stack kui-stack--tight">
        <header class="navbar navbar--bordered">
            <a class="navbar-brand" href="javascript:void(0)"><span class="navbar-brand__mark">K</span> 运营后台</a>
            <ul class="navbar-nav">
                <li class="active"><a href="javascript:void(0)">概览</a></li>
                <li><a href="javascript:void(0)">订单</a></li>
            </ul>
            <span class="navbar-spacer"></span>
            <span class="kui-avatar kui-avatar--sm kui-avatar--primary">林</span>
        </header>
        <header class="kui-page-header">
            <div class="kui-page-header__text">
                <p class="kui-page-header__eyebrow">今日 · 10 月 27 日</p>
                <h2 class="kui-page-header__title">订单概览</h2>
                <p class="kui-page-header__desc">今日 1,284 单，3 单待人工审核。</p>
            </div>
            <div class="kui-page-header__actions">
                <button type="button" class="btn btn-primary btn-sm"><i class="fa fa-plus" aria-hidden="true"></i> 新建订单</button>
            </div>
        </header>
        <div class="kui-grid kui-grid--sm">
            <article class="kui-stat">
                <div class="kui-stat__head"><span class="kui-stat__label">成交额</span><span class="kui-stat__icon"><i class="fa fa-line-chart" aria-hidden="true"></i></span></div>
                <p class="kui-stat__value">486,210<small>元</small></p>
            </article>
            <article class="kui-stat">
                <div class="kui-stat__head"><span class="kui-stat__label">待审核</span><span class="kui-stat__icon"><i class="fa fa-clock-o" aria-hidden="true"></i></span></div>
                <p class="kui-stat__value">3<small>单</small></p>
            </article>
        </div>
    </div>
</div>`,
})}

${demo({
    title: '骨架二：纯顶栏 + 内容',
    desc: '只有一条顶栏和一条内容列。外层用浅底托住整块，内容列再用 .kui-container 收到固定读宽，两侧留白一眼可见。适合文档、帮助中心、设置页。',
    tags: ['.kui-container', '.navbar--bordered', '.kui-page-header'],
    html: `
<div class="kui-board panel--muted kui-stack kui-stack--tight">
    <header class="navbar navbar--bordered">
        <a class="navbar-brand" href="javascript:void(0)"><span class="navbar-brand__mark">K</span> 帮助中心</a>
        <ul class="navbar-nav">
            <li class="active"><a href="javascript:void(0)">指南</a></li>
            <li><a href="javascript:void(0)">更新</a></li>
        </ul>
        <span class="navbar-spacer"></span>
        <button type="button" class="btn btn-default btn-sm"><i class="fa fa-search" aria-hidden="true"></i> 搜索</button>
    </header>
    <div class="kui-container kui-stack kui-stack--tight" style="--kui-container-max-width: 32rem">
        <header class="kui-page-header">
            <div class="kui-page-header__text">
                <p class="kui-page-header__eyebrow">指南 · 布局</p>
                <h2 class="kui-page-header__title">从一套骨架开始</h2>
                <p class="kui-page-header__desc">先确定页面有几栏，再决定每一栏放什么内容。</p>
            </div>
        </header>
        <article class="kui-board kui-stack kui-stack--tight">
            <h3 class="panel-title">先定栏数，再定密度</h3>
            <p class="kui-page-header__desc">单栏页面的行长控制在 30–40 个汉字，段落之间用间距分隔，不靠分割线。</p>
            <p class="kui-page-header__desc">需要并排比较时再加一栏辅助信息，而不是把正文压成两列。</p>
        </article>
        <section class="panel">
            <div class="panel-heading"><h3 class="panel-title">下一步</h3></div>
            <div class="panel-body">继续阅读「容器」与「响应式」，了解宽度上限与断点如何配合。</div>
        </section>
    </div>
</div>`,
})}

${demo({
    title: '骨架三：内容 + 辅助栏',
    desc: '主内容在左、辅助栏在右；辅助栏整体换成浅底，读者一眼就知道它随时可以消失而不影响阅读。适合详情页、阅读页与工单。',
    tags: ['.kui-split--main-first', '.kui-descriptions', '.panel--muted'],
    html: `
<div class="kui-split kui-split--main-first" style="--kui-split-sidebar: 12rem; --kui-split-gap: var(--kui-space-3)">
    <div class="kui-stack kui-stack--tight">
        <header class="kui-page-header">
            <div class="kui-page-header__text">
                <p class="kui-page-header__eyebrow">工单 · #4821</p>
                <h2 class="kui-page-header__title">导出任务偶发失败</h2>
                <p class="kui-page-header__desc">影响 3 个租户，最近的失败发生在 09:24。</p>
            </div>
            <div class="kui-page-header__actions">
                <button type="button" class="btn btn-primary btn-sm">标记解决</button>
            </div>
        </header>
        <article class="kui-board kui-stack kui-stack--tight">
            <h3 class="panel-title">现象</h3>
            <p class="kui-page-header__desc">批量导出超过 5 万行时任务中断，重试后仍然失败，日志中只有一条超时记录。</p>
        </article>
        <ul class="kui-list">
            <li class="kui-list__item">
                <span class="kui-list__body">
                    <span class="kui-list__title">09:24 复现一次</span>
                    <span class="kui-list__meta">由值班同学在测试租户上触发</span>
                </span>
            </li>
        </ul>
    </div>
    <aside class="kui-board panel--muted kui-stack kui-stack--tight">
        <strong>属性</strong>
        <dl class="kui-descriptions">
            <div class="kui-descriptions__item"><dt>负责人</dt><dd>林澈</dd></div>
            <div class="kui-descriptions__item"><dt>优先级</dt><dd>P1</dd></div>
            <div class="kui-descriptions__item"><dt>创建于</dt><dd>2 小时前</dd></div>
        </dl>
    </aside>
</div>`,
})}

${demo({
    title: '自动栅格：列数由宽度决定',
    desc: '三档密度只换最小列宽，不写列定义：--sm 放小卡、--md 放指标卡、--lg 放宽内容。每行都套一层浅底，行与行之间的分组因此一眼可辨。',
    tags: ['.kui-grid--sm', '.kui-grid--md', '.kui-grid--lg'],
    html: `
<div class="kui-stack kui-stack--tight">
    <div class="kui-board panel--muted kui-stack kui-stack--tight">
        <span class="kui-stat__label">.kui-grid--sm · 最小列宽 9rem</span>
        <div class="kui-grid kui-grid--sm">
            <div class="kui-board">接口</div>
            <div class="kui-board">权限</div>
            <div class="kui-board">通知</div>
            <div class="kui-board">审计</div>
            <div class="kui-board">备份</div>
        </div>
    </div>
    <div class="kui-board panel--muted kui-stack kui-stack--tight">
        <span class="kui-stat__label">.kui-grid--md · 最小列宽 13rem</span>
        <div class="kui-grid kui-grid--md">
            <div class="kui-board">成交额</div>
            <div class="kui-board">订单数</div>
            <div class="kui-board">退款率</div>
        </div>
    </div>
    <div class="kui-board panel--muted kui-stack kui-stack--tight">
        <span class="kui-stat__label">.kui-grid--lg · 最小列宽 18rem</span>
        <div class="kui-grid kui-grid--lg">
            <div class="kui-board">渠道表现</div>
            <div class="kui-board">地区分布</div>
        </div>
    </div>
</div>`,
})}

${demo({
    title: '固定宽度与流式宽度',
    desc: '同一行里放两块：左边是固定读宽，超出的空间留在浅底上；右边是流式宽度，白底始终铺满。选哪一种取决于内容是「读」还是「看」。',
    tags: ['.kui-container', '.kui-w-full', '--kui-container-max-width'],
    html: `
<div class="kui-split" style="--kui-split-sidebar: 1fr; --kui-split-gap: var(--kui-space-3)">
    <section class="kui-board panel--muted kui-stack kui-stack--tight">
        <span class="kui-stat__label">固定宽度 · .kui-container</span>
        <div class="kui-container" style="--kui-container-max-width: 15rem">
            <div class="kui-board kui-stack kui-stack--tight">
                <strong>15rem 上限</strong>
                <span class="form-hint">内容居中，两侧留白由容器自己算。</span>
            </div>
        </div>
        <span class="form-hint">浅底上的空白就是被容器收掉的宽度。</span>
    </section>
    <section class="kui-board panel--muted kui-stack kui-stack--tight">
        <span class="kui-stat__label">流式宽度 · 不套容器</span>
        <div class="kui-board kui-w-full kui-stack kui-stack--tight">
            <strong>100% 铺满</strong>
            <span class="form-hint">表格、看板与数据区不设读宽，窗口多宽就用多宽。</span>
        </div>
        <span class="form-hint">没有留白，也就没有「收窄」这一步。</span>
    </section>
</div>`,
})}

${demo({
    title: '面板容器：标题、主体与底栏',
    desc: '面板是内容区的标准卡片：标题区只放标题与状态，主体承载内容，底栏只放与整块内容相关的动作。右侧的弱化面板没有阴影，用来表达第二层信息。',
    tags: ['.panel', '.panel-heading', '.panel-footer', '.panel--muted'],
    html: `
<div class="kui-grid kui-grid--md">
    <section class="panel">
        <div class="panel-heading">
            <h3 class="panel-title">渠道表现</h3>
            <div class="panel-actions"><span class="badge badge-neutral">近 7 天</span></div>
        </div>
        <div class="panel-body">
            <div class="kui-stack kui-stack--tight">
                <div class="kui-cluster" style="--kui-cluster-justify: space-between">
                    <span class="form-hint">直营小程序</span>
                    <strong>182,400</strong>
                </div>
                <div class="progress progress-xs"><span class="progress-bar" style="width: 78%"></span></div>
                <div class="kui-cluster" style="--kui-cluster-justify: space-between">
                    <span class="form-hint">门店自提</span>
                    <strong>126,800</strong>
                </div>
                <div class="progress progress-xs"><span class="progress-bar" style="width: 54%"></span></div>
            </div>
        </div>
        <div class="panel-footer">
            <button type="button" class="btn btn-default btn-sm">导出</button>
            <button type="button" class="btn btn-primary btn-sm">查看明细</button>
        </div>
    </section>
    <section class="panel panel--muted">
        <div class="panel-heading"><h3 class="panel-title">说明</h3></div>
        <div class="panel-body">弱化面板没有描边与阴影，适合嵌套在分栏里承载解释、备注与次要动作。</div>
    </section>
</div>`,
})}

${callout('骨架只有两档断点：<code>40rem</code> 以下分栏堆叠为单列，<code>48rem</code> 以下导航条折叠成菜单。列数与留白其余部分交给 <code>auto-fit</code> 栅格与容器查询，不需要为每个设备再写一套骨架。')}

${propsTable([
    { name: '.kui-split', type: 'class', defaultValue: '16rem', desc: '两列骨架，左列宽度取 <code>--kui-split-sidebar</code>。' },
    { name: '--kui-split-sidebar', type: 'attribute', defaultValue: '16rem', desc: '侧栏宽度，按导航字数在 9–19rem 之间取值。' },
    { name: '.kui-split--main-first', type: 'class', defaultValue: '—', desc: '主内容在左、辅助栏在右，用于详情页。' },
    { name: '.kui-page-header', type: 'class', defaultValue: '—', desc: '页头：标题、说明与操作同一行，底部带分隔线。' },
    { name: '.kui-board', type: 'class', defaultValue: '—', desc: '内容面：一像素描边、6px 圆角、16px 内边距。' },
    { name: '.panel--muted', type: 'class', defaultValue: '—', desc: '浅底内容面：去掉阴影与描边，用来区分导航、辅助栏等第二层区域。' },
    { name: '.kui-grid--sm / --md / --lg', type: 'class', defaultValue: '16rem', desc: '三档最小列宽：9rem / 13rem / 18rem，列数随可用宽度推导。' },
    { name: '.kui-container', type: 'class', defaultValue: '1200px', desc: '内容宽度上限并居中，用 <code>--kui-container-max-width</code> 覆盖。' },
    { name: '.kui-w-full', type: 'class', defaultValue: '—', desc: '流式宽度：跟着父级走，不设上限。' },
    { name: '.panel', type: 'class', defaultValue: '—', desc: '面板：标题区、主体与底栏三段，细节见「面板」页。' },
])}

`
}
