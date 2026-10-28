import type { DocPageContext } from '../../docs/types'
import { demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 首页工作台。
 * 用真实业务密度展示「指标 → 结构 → 动作」的排布：先把结论放在最上面，
 * 再给拆解路径，最后才是可执行的操作入口。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '工作台是用户每天打开系统的第一屏：先把结论放在最上层，再给拆解路径与可执行的动作。下面的示例全部由布局原语与组件组合而成，没有一行页面级私有样式。',
    tags: ['.kui-page-header', '.kui-stat', '.kui-split', '.kui-task'],
})}

${sectionTitle('工作台布局', '从欢迎语、指标卡到拆解与待办，四段结构可以直接套用到任何后台首页。')}

${demo({
    title: '运营工作台首屏',
    desc: '页头给出时间语境与主操作，四张指标卡给出结论，下方左右分栏分别承载拆解与待办。',
    tags: ['Workbench', '.kui-stat'],
    html: `
<div class="kui-stack kui-stack--loose">
    <header class="kui-page-header">
        <div class="kui-page-header__text">
            <p class="kui-page-header__eyebrow">运营中心 · 2026 年 10 月 27 日 周二</p>
            <h2 class="kui-page-header__title">下午好，林澈</h2>
            <p class="kui-page-header__desc">今天有 3 个审批待处理，2 项指标越界，最近一次数据同步在 9 分钟前。</p>
        </div>
        <div class="kui-page-header__actions">
            <button type="button" class="btn btn-default btn-sm"><i class="fa fa-download" aria-hidden="true"></i> 导出日报</button>
            <button type="button" class="btn btn-primary btn-sm"><i class="fa fa-plus" aria-hidden="true"></i> 新建活动</button>
        </div>
    </header>

    <div class="kui-grid kui-grid--metrics">
        <article class="kui-stat">
            <div class="kui-stat__head">
                <span class="kui-stat__label">今日成交额</span>
                <span class="kui-stat__icon"><i class="fa fa-line-chart" aria-hidden="true"></i></span>
            </div>
            <p class="kui-stat__value">486,210<small>元</small></p>
            <p class="kui-stat__foot"><span class="kui-stat__delta is-up"><i class="fa fa-arrow-up" aria-hidden="true"></i>12.4%</span> 较昨日</p>
        </article>
        <article class="kui-stat">
            <div class="kui-stat__head">
                <span class="kui-stat__label">支付订单</span>
                <span class="kui-stat__icon"><i class="fa fa-shopping-bag" aria-hidden="true"></i></span>
            </div>
            <p class="kui-stat__value">1,284<small>单</small></p>
            <p class="kui-stat__foot"><span class="kui-stat__delta is-up"><i class="fa fa-arrow-up" aria-hidden="true"></i>6.1%</span> 较昨日</p>
        </article>
        <article class="kui-stat">
            <div class="kui-stat__head">
                <span class="kui-stat__label">新增客户</span>
                <span class="kui-stat__icon"><i class="fa fa-user-plus" aria-hidden="true"></i></span>
            </div>
            <p class="kui-stat__value">216<small>人</small></p>
            <p class="kui-stat__foot"><span class="kui-stat__delta is-down"><i class="fa fa-arrow-down" aria-hidden="true"></i>2.3%</span> 较昨日</p>
        </article>
        <article class="kui-stat">
            <div class="kui-stat__head">
                <span class="kui-stat__label">退款率</span>
                <span class="kui-stat__icon"><i class="fa fa-undo" aria-hidden="true"></i></span>
            </div>
            <p class="kui-stat__value">0.82<small>%</small></p>
            <p class="kui-stat__foot"><span class="kui-stat__delta is-down"><i class="fa fa-arrow-up" aria-hidden="true"></i>0.14%</span> 高于阈值需关注</p>
        </article>
    </div>

    <div class="kui-split kui-split--main-first" style="--kui-split-sidebar: 19rem">
        <section class="panel">
            <div class="panel-heading">
                <h3 class="panel-title">渠道表现</h3>
                <div class="panel-actions">
                    <div class="kui-segmented">
                        <button type="button" class="is-active">近 7 天</button>
                        <button type="button">近 30 天</button>
                    </div>
                </div>
            </div>
            <div class="panel-body">
                <ul class="kui-list kui-list--flush">
                    <li class="kui-list__item">
                        <span class="kui-list__media"><span class="kui-avatar kui-avatar--sm kui-avatar--primary">直</span></span>
                        <span class="kui-list__body">
                            <span class="kui-list__title">直营小程序 <span class="badge badge-success">领先</span></span>
                            <span class="kui-list__meta">转化率 4.8% · 客单价 326 元</span>
                        </span>
                        <span class="kui-list__aside">
                            <strong>182,400</strong>
                            <span class="progress progress-xs" style="width: 96px"><span class="progress-bar" style="width: 78%"></span></span>
                        </span>
                    </li>
                    <li class="kui-list__item">
                        <span class="kui-list__media"><span class="kui-avatar kui-avatar--sm">门</span></span>
                        <span class="kui-list__body">
                            <span class="kui-list__title">门店自提</span>
                            <span class="kui-list__meta">转化率 3.1% · 客单价 214 元</span>
                        </span>
                        <span class="kui-list__aside">
                            <strong>126,800</strong>
                            <span class="progress progress-xs" style="width: 96px"><span class="progress-bar" style="width: 54%"></span></span>
                        </span>
                    </li>
                    <li class="kui-list__item">
                        <span class="kui-list__media"><span class="kui-avatar kui-avatar--sm">渠</span></span>
                        <span class="kui-list__body">
                            <span class="kui-list__title">分销渠道</span>
                            <span class="kui-list__meta">转化率 2.4% · 客单价 189 元</span>
                        </span>
                        <span class="kui-list__aside">
                            <strong>98,600</strong>
                            <span class="progress progress-xs" style="width: 96px"><span class="progress-bar" style="width: 42%"></span></span>
                        </span>
                    </li>
                </ul>
            </div>
        </section>

        <section class="panel">
            <div class="panel-heading">
                <h3 class="panel-title">今日待办</h3>
                <span class="badge badge-warning">3</span>
            </div>
            <div class="panel-body">
                <div class="kui-stack kui-stack--tight">
                    <label class="kui-task">
                        <input type="checkbox" class="kui-task__check">
                        <span class="kui-task__body">
                            <span class="kui-task__title">审核「秋季满减」活动预算</span>
                            <span class="kui-task__meta"><i class="fa fa-clock-o" aria-hidden="true"></i> 今天 18:00 前</span>
                        </span>
                    </label>
                    <label class="kui-task">
                        <input type="checkbox" class="kui-task__check">
                        <span class="kui-task__body">
                            <span class="kui-task__title">确认华东仓补货计划</span>
                            <span class="kui-task__meta"><i class="fa fa-user" aria-hidden="true"></i> 供应链 · 周昕</span>
                        </span>
                    </label>
                    <label class="kui-task is-done">
                        <input type="checkbox" class="kui-task__check" checked>
                        <span class="kui-task__body">
                            <span class="kui-task__title">回复渠道商报价咨询</span>
                            <span class="kui-task__meta"><i class="fa fa-check" aria-hidden="true"></i> 已完成</span>
                        </span>
                    </label>
                </div>
            </div>
        </section>
    </div>
</div>`,
})}

${sectionTitle('快捷入口', '入口卡片只放名称、一句话解释和一个动作，避免把导航做成功能菜单。')}

${demo({
    title: '快捷操作与最近访问',
    desc: '左侧是高频动作，右侧是带状态的历史记录；两者密度不同，用间距而不是分割线区分。',
    html: `
<div class="kui-stack">
    <div class="kui-grid kui-grid--sm">
        <a class="kui-board kui-shortcut" href="javascript:void(0)">
            <span class="kui-stat__icon"><i class="fa fa-bullhorn" aria-hidden="true"></i></span>
            <strong>发起活动</strong>
            <small>从模板创建，3 分钟上线</small>
        </a>
        <a class="kui-board kui-shortcut" href="javascript:void(0)">
            <span class="kui-stat__icon"><i class="fa fa-file-text-o" aria-hidden="true"></i></span>
            <strong>创建报表</strong>
            <small>选择指标，自动生成看板</small>
        </a>
        <a class="kui-board kui-shortcut" href="javascript:void(0)">
            <span class="kui-stat__icon"><i class="fa fa-users" aria-hidden="true"></i></span>
            <strong>邀请成员</strong>
            <small>按角色分配可见范围</small>
        </a>
        <a class="kui-board kui-shortcut" href="javascript:void(0)">
            <span class="kui-stat__icon"><i class="fa fa-cog" aria-hidden="true"></i></span>
            <strong>系统设置</strong>
            <small>审批流、通知与权限</small>
        </a>
    </div>

    <ul class="kui-list">
        <li class="kui-list__item">
            <span class="kui-list__media"><span class="kui-avatar kui-avatar--sm kui-avatar--primary"><i class="fa fa-line-chart" aria-hidden="true"></i></span></span>
            <span class="kui-list__body">
                <span class="kui-list__title">十月渠道复盘 <span class="badge badge-neutral">报表</span></span>
                <span class="kui-list__meta">你和 3 位成员共同编辑 · 2 小时前</span>
            </span>
            <span class="kui-list__aside">继续编辑</span>
        </li>
        <li class="kui-list__item">
            <span class="kui-list__media"><span class="kui-avatar kui-avatar--sm"><i class="fa fa-folder-o" aria-hidden="true"></i></span></span>
            <span class="kui-list__body">
                <span class="kui-list__title">双十一素材库</span>
                <span class="kui-list__meta">共 48 个文件 · 昨天 20:14</span>
            </span>
            <span class="kui-list__aside">打开</span>
        </li>
        <li class="kui-list__item">
            <span class="kui-list__media"><span class="kui-avatar kui-avatar--sm kui-avatar--success"><i class="fa fa-check" aria-hidden="true"></i></span></span>
            <span class="kui-list__body">
                <span class="kui-list__title">9 月结算单已归档</span>
                <span class="kui-list__meta">财务 · 系统自动归档 · 3 天前</span>
            </span>
            <span class="kui-list__aside">查看</span>
        </li>
    </ul>
</div>`,
})}

${propsTable([
    { name: '.kui-page-header', type: 'class', defaultValue: '—', desc: '页头：标题、说明与主操作三段，底部有一条分隔线。' },
    { name: '.kui-stat', type: 'class', defaultValue: '—', desc: '指标卡；内部用 <code>__label</code> / <code>__value</code> / <code>__delta</code> 组织。' },
    { name: '.kui-grid--metrics', type: 'class', defaultValue: '—', desc: '指标行栅格：一行最多四张，容器变窄自动折行。' },
    { name: '.kui-split--main-first', type: 'class', defaultValue: '—', desc: '主内容在左、辅助栏在右的两栏结构。' },
    { name: '--kui-split-sidebar', type: 'attribute', defaultValue: '16rem', desc: '辅助栏宽度；主栏吃掉剩余空间。' },
    { name: '.kui-shortcut', type: 'class', defaultValue: '—', desc: '快捷入口卡片：图标 + 名称 + 一句话说明。' },
    { name: '.kui-toolbar', type: 'class', defaultValue: '—', desc: '页面级操作条：左侧筛选、右侧批量动作。' },
])}
`
}
