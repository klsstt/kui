import type { DocPageContext } from '../../docs/types'
import { demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 模板页面。
 * 三套可复用的骨架：两栏（左栏 + 顶栏 + 内容）、单栏（纯顶栏 + 内容）、三区（内容 + 右侧辅助栏）。
 * 每套都只由布局原语拼成，换业务时换内容，不换结构。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '模板把常见页面的骨架固定下来：导航在哪、标题在哪、主内容占多宽。这三套骨架都由 .kui-split、.kui-page-header、.kui-board 组合而成，可以直接替换内容。',
    tags: ['.kui-split', '.kui-page-header', '.kui-board'],
})}

${demo({
    title: '两栏：左栏 + 顶栏 + 内容',
    desc: '左侧是常驻的一级导航，顶栏放工作区与账号，内容区先给页头再给指标与列表。适合管理后台、运营系统。',
    stage: 'center',
    tags: ['.kui-split', '.navbar', '--kui-split-sidebar'],
    html: `
<div class="kui-device kui-device--desktop">
    <div class="kui-device__screen">
        <div class="kui-device__content">
            <div class="kui-container kui-stack kui-stack--tight">
                <header class="navbar navbar--bordered">
                    <a class="navbar-brand" href="javascript:void(0)"><span class="navbar-brand__mark">K</span> 运营后台</a>
                    <ul class="navbar-nav">
                        <li class="active"><a href="javascript:void(0)">概览</a></li>
                        <li><a href="javascript:void(0)">订单</a></li>
                    </ul>
                    <span class="navbar-spacer"></span>
                    <div class="navbar-actions"><span class="kui-avatar kui-avatar--sm kui-avatar--primary">林</span></div>
                </header>
                <div class="kui-split" style="--kui-split-sidebar: 9rem">
                    <aside class="kui-board">
                        <div class="kui-stack kui-stack--tight">
                            <span class="kui-stat__label">工作区</span>
                            <a class="navbar-link is-active" href="javascript:void(0)"><i class="fa fa-th-large" aria-hidden="true"></i> 概览</a>
                            <a class="navbar-link" href="javascript:void(0)"><i class="fa fa-list" aria-hidden="true"></i> 订单</a>
                            <a class="navbar-link" href="javascript:void(0)"><i class="fa fa-users" aria-hidden="true"></i> 客户</a>
                            <a class="navbar-link" href="javascript:void(0)"><i class="fa fa-cog" aria-hidden="true"></i> 设置</a>
                        </div>
                    </aside>
                    <div class="kui-stack kui-stack--tight">
                        <header class="kui-page-header">
                            <div class="kui-page-header__text">
                                <h2 class="kui-page-header__title">订单概览</h2>
                                <p class="kui-page-header__desc">今日 1,284 单，3 单待人工审核。</p>
                            </div>
                            <div class="kui-page-header__actions">
                                <button type="button" class="btn btn-primary btn-sm">新建订单</button>
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
                        <ul class="kui-list">
                            <li class="kui-list__item">
                                <span class="kui-list__body">
                                    <span class="kui-list__title">K-2481 · 澄明科技</span>
                                    <span class="kui-list__meta">12,400 元 · 已支付</span>
                                </span>
                                <span class="kui-list__aside">刚刚</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <span class="kui-device__label"><i class="fa fa-columns" aria-hidden="true"></i> 两栏 · 720 × 440</span>
</div>`,
})}

${demo({
    title: '单栏：纯顶栏 + 内容',
    desc: '只有一条顶栏和一条内容列，读者从上往下读。适合文档、帮助中心、设置页与营销落地页。',
    stage: 'center',
    tags: ['.kui-container', '.kui-page-header', '.panel'],
    html: `
<div class="kui-device kui-device--pad">
    <div class="kui-device__screen">
        <div class="kui-device__content">
            <div class="kui-container kui-stack kui-stack--tight">
                <header class="navbar navbar--bordered">
                    <a class="navbar-brand" href="javascript:void(0)"><span class="navbar-brand__mark">K</span> 帮助中心</a>
                    <span class="navbar-spacer"></span>
                    <ul class="navbar-nav">
                        <li class="active"><a href="javascript:void(0)">指南</a></li>
                        <li><a href="javascript:void(0)">更新</a></li>
                    </ul>
                </header>
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
                    <p class="kui-page-header__desc">需要并排比较时再加一栏辅助信息，而不是把正文压缩成两列。</p>
                </article>
                <section class="panel">
                    <div class="panel-heading"><h3 class="panel-title">下一步</h3></div>
                    <div class="panel-body">继续阅读「容器」与「响应式」，了解容器宽度与断点如何配合。</div>
                </section>
            </div>
        </div>
    </div>
    <span class="kui-device__label"><i class="fa fa-tablet" aria-hidden="true"></i> 单栏 · 520 × 680</span>
</div>`,
})}

${demo({
    title: '三区：内容 + 右侧辅助栏',
    desc: '主内容在左，右侧辅助栏放属性、目录或相关链接；辅助栏可以整体消失而不影响阅读。适合详情页与工单。',
    stage: 'center',
    tags: ['.kui-split--main-first', '.kui-descriptions'],
    html: `
<div class="kui-device kui-device--desktop">
    <div class="kui-device__screen">
        <div class="kui-device__content">
            <div class="kui-container kui-stack kui-stack--tight">
                <header class="kui-page-header">
                    <div class="kui-page-header__text">
                        <p class="kui-page-header__eyebrow">工单 · #4821</p>
                        <h2 class="kui-page-header__title">导出任务偶发失败</h2>
                        <p class="kui-page-header__desc">影响 3 个租户，最近的失败发生在 09:24。</p>
                    </div>
                    <div class="kui-page-header__actions">
                        <button type="button" class="btn btn-default btn-sm">转交</button>
                        <button type="button" class="btn btn-primary btn-sm">标记解决</button>
                    </div>
                </header>
                <div class="kui-split kui-split--main-first" style="--kui-split-sidebar: 11rem">
                    <div class="kui-stack kui-stack--tight">
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
                    <aside class="kui-stack kui-stack--tight">
                        <section class="panel">
                            <div class="panel-heading"><h3 class="panel-title">属性</h3></div>
                            <div class="panel-body">
                                <dl class="kui-descriptions">
                                    <div class="kui-descriptions__item"><dt>负责人</dt><dd>林澈</dd></div>
                                    <div class="kui-descriptions__item"><dt>优先级</dt><dd>P1</dd></div>
                                    <div class="kui-descriptions__item"><dt>创建于</dt><dd>2 小时前</dd></div>
                                </dl>
                            </div>
                        </section>
                        <section class="panel">
                            <div class="panel-heading"><h3 class="panel-title">相关</h3></div>
                            <div class="panel-body">导出任务性能优化 · 队列容量评估</div>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    </div>
    <span class="kui-device__label"><i class="fa fa-columns" aria-hidden="true"></i> 三区 · 720 × 440</span>
</div>`,
})}

${sectionTitle('怎么选', '先看用户在一次会话里要不要来回切换上下文，再决定栏数与辅助栏的位置。')}

${demo({
    title: '骨架选型对照',
    desc: '导航密度决定栏数，阅读时长决定辅助栏：需要频繁跳转就常驻导航，需要连续阅读就收掉辅助栏。',
    tags: ['.kui-split', '.kui-device'],
    html: `
<table class="table">
    <thead><tr><th>骨架</th><th>结构</th><th>适用业务</th><th>窄屏行为</th></tr></thead>
    <tbody>
        <tr><td>两栏</td><td>左栏导航 + 顶栏 + 内容</td><td>管理后台、运营系统、数据看板</td><td>左栏收进抽屉</td></tr>
        <tr><td>单栏</td><td>顶栏 + 单列内容</td><td>文档、帮助中心、设置页、落地页</td><td>行长自动收窄</td></tr>
        <tr><td>三区</td><td>主内容 + 右侧辅助栏</td><td>详情页、阅读页、工单、商品详情</td><td>辅助栏落到文末</td></tr>
    </tbody>
</table>`,
})}

${propsTable([
    { name: '.kui-split', type: 'class', defaultValue: '16rem', desc: '两列网格，左列宽度取 <code>--kui-split-sidebar</code>。' },
    { name: '--kui-split-sidebar', type: 'length', defaultValue: '16rem', desc: '侧栏宽度，按导航字数在 9–19rem 之间取值。' },
    { name: '.kui-split--main-first', type: 'class', defaultValue: '—', desc: '主内容在左、辅助栏在右，用于详情页。' },
    { name: '.kui-page-header', type: 'class', defaultValue: '—', desc: '页头：标题、说明与操作同一行，底部带分隔线。' },
    { name: '.kui-board', type: 'class', defaultValue: '—', desc: '通用容器：一像素描边、6px 圆角、16px 内边距。' },
    { name: '.kui-container', type: 'class', defaultValue: '1200px', desc: '内容宽度上限并居中，两侧自动留白。' },
    { name: '.kui-device / __screen / __content', type: 'class', defaultValue: '—', desc: '把骨架放进固定尺寸的屏幕里预览，尺寸取自修饰类。' },
    { name: '.kui-device--phone / -pad / -tv / -desktop', type: 'class', defaultValue: 'desktop', desc: '四档屏幕尺寸：320×560 / 520×680 / 640×360 / 720×440。' },
    { name: '.navbar / .navbar-nav / .navbar-link', type: 'class', defaultValue: '—', desc: '应用级横向导航，窄屏折叠为抽屉。' },
    { name: '.kui-stack / .kui-grid', type: 'class', defaultValue: '16px', desc: '纵向堆叠与自适应网格，间距由 <code>--kui-stack-gap</code> 控制。' },
])}

`
}
