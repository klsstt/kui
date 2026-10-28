import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 列表页面。
 * 列表项只保留「媒体 + 主体 + 辅助 + 操作」四段：头像负责定位，
 * 标题与描述负责扫读，徽章与时间固定在右侧，操作在悬停与聚焦时出现。
 */

export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '列表把同类记录排成一列，用户按头像与标题定位、按描述判断、按右侧状态决定是否进入。密度由信息量决定，而不是靠改变字号与间距硬凑三套样式。',
    tags: ['.kui-list', '.kui-list__actions', '.kui-empty'],
})}

${demo({
    title: '成员列表：头像、状态与右侧操作',
    desc: '头像用本地图片，状态徽章与时间固定在右侧，查看入口常驻；移除按钮在悬停或键盘聚焦时出现，触屏与窄屏常驻。移除后计数同步，全部移除时给出列表内空态。',
    tags: ['.kui-list__item', '.kui-list__actions', '.kui-list__empty'],
    script: `
const list = document.querySelector<HTMLElement>('[data-ls-team]')
const count = document.querySelector<HTMLElement>('[data-ls-count]')
const empty = document.querySelector<HTMLElement>('[data-ls-empty]')

const sync = (): void => {
    const total = list?.querySelectorAll('.kui-list__item').length ?? 0
    if (count) count.textContent = total + ' 位成员'
    if (empty) empty.hidden = total > 0
}

list?.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null
    const remove = target?.closest<HTMLElement>('[data-ls-remove]')

    if (remove) {
        remove.closest('.kui-list__item')?.remove()
        sync()
    }
})
`,
    html: `
<div class="kui-stack kui-stack--tight">
    <div class="kui-toolbar">
        <div class="kui-toolbar__group">
            <span class="badge badge-primary" data-ls-count>5 位成员</span>
            <span class="form-hint">查看常驻，移除在悬停或聚焦时出现</span>
        </div>
        <div class="kui-toolbar__group">
            <button type="button" class="btn btn-default btn-sm"><i class="fa fa-user-plus" aria-hidden="true"></i> 邀请成员</button>
        </div>
    </div>
    <ul class="kui-list" data-ls-team>
        <li class="kui-list__item">
            <span class="kui-list__media"><span class="kui-avatar"><img src="./images/portraits/1.jpg" alt="林澈"></span></span>
            <span class="kui-list__body">
                <span class="kui-list__title">林澈 <span class="badge badge-success">在线</span></span>
                <span class="kui-list__desc">负责华东区客户与渠道，本周有 3 个续约跟进。</span>
                <span class="kui-list__meta"><i class="fa fa-map-marker" aria-hidden="true"></i> 杭州 · 12 个客户</span>
            </span>
            <span class="kui-list__aside"><span>今天 09:12</span><button type="button" class="btn btn-link btn-xs">查看</button></span>
            <span class="kui-list__actions">
                <button type="button" class="btn btn-ghost btn-xs" data-ls-remove aria-label="移除 林澈"><i class="fa fa-times" aria-hidden="true"></i></button>
            </span>
        </li>
        <li class="kui-list__item">
            <span class="kui-list__media"><span class="kui-avatar"><img src="./images/portraits/4.jpg" alt="苏晚"></span></span>
            <span class="kui-list__body">
                <span class="kui-list__title">苏晚 <span class="badge badge-warning">忙碌</span></span>
                <span class="kui-list__desc">正在整理秋季主视觉，报价单封面延到明天确认。</span>
                <span class="kui-list__meta"><i class="fa fa-map-marker" aria-hidden="true"></i> 上海 · 8 个客户</span>
            </span>
            <span class="kui-list__aside"><span>今天 08:40</span><button type="button" class="btn btn-link btn-xs">查看</button></span>
            <span class="kui-list__actions">
                <button type="button" class="btn btn-ghost btn-xs" data-ls-remove aria-label="移除 苏晚"><i class="fa fa-times" aria-hidden="true"></i></button>
            </span>
        </li>
        <li class="kui-list__item">
            <span class="kui-list__media"><span class="kui-avatar"><img src="./images/portraits/2.jpg" alt="周昕"></span></span>
            <span class="kui-list__body">
                <span class="kui-list__title">周昕 <span class="badge badge-success">在线</span></span>
                <span class="kui-list__desc">华东仓 12 个 SKU 的补货单已经提交，等待审批。</span>
                <span class="kui-list__meta"><i class="fa fa-map-marker" aria-hidden="true"></i> 苏州 · 5 个客户</span>
            </span>
            <span class="kui-list__aside"><span>昨天 20:14</span><button type="button" class="btn btn-link btn-xs">查看</button></span>
            <span class="kui-list__actions">
                <button type="button" class="btn btn-ghost btn-xs" data-ls-remove aria-label="移除 周昕"><i class="fa fa-times" aria-hidden="true"></i></button>
            </span>
        </li>
        <li class="kui-list__item">
            <span class="kui-list__media"><span class="kui-avatar"><img src="./images/portraits/7.jpg" alt="何晏"></span></span>
            <span class="kui-list__body">
                <span class="kui-list__title">何晏 <span class="badge badge-primary">跟进中</span></span>
                <span class="kui-list__desc">华南区三家门店的秋季陈列已经排期，等待物料到店。</span>
                <span class="kui-list__meta"><i class="fa fa-map-marker" aria-hidden="true"></i> 广州 · 9 个客户</span>
            </span>
            <span class="kui-list__aside"><span>昨天 18:02</span><button type="button" class="btn btn-link btn-xs">查看</button></span>
            <span class="kui-list__actions">
                <button type="button" class="btn btn-ghost btn-xs" data-ls-remove aria-label="移除 何晏"><i class="fa fa-times" aria-hidden="true"></i></button>
            </span>
        </li>
        <li class="kui-list__item">
            <span class="kui-list__media"><span class="kui-avatar"><img src="./images/portraits/7.jpg" alt="宁夏"></span></span>
            <span class="kui-list__body">
                <span class="kui-list__title">宁夏 <span class="badge badge-neutral">离线</span></span>
                <span class="kui-list__desc">9 月结算单已归档，42 张发票全部同步完成。</span>
                <span class="kui-list__meta"><i class="fa fa-map-marker" aria-hidden="true"></i> 北京 · 3 个客户</span>
            </span>
            <span class="kui-list__aside"><span>10 月 25 日</span><button type="button" class="btn btn-link btn-xs">查看</button></span>
            <span class="kui-list__actions">
                <button type="button" class="btn btn-ghost btn-xs" data-ls-remove aria-label="移除 宁夏"><i class="fa fa-times" aria-hidden="true"></i></button>
            </span>
        </li>
    </ul>
    <p class="form-hint" data-ls-empty hidden>成员已全部移除，可以重新邀请。</p>
</div>`,
})}

${sectionTitle('三档密度', '单行只放定位信息，双行补一句描述，三行再给元信息；同一屏内不要混用超过两档密度。')}

${demo({
    title: '单行、双行与三行',
    desc: '三档密度共用同一套内边距与分隔线，只改变主体列里放几段文字。头像只在三行密度里出现，避免单行列表被缩略图撑高。',
    tags: ['.kui-list--flush', '.kui-list__meta', '.kui-list__desc'],
    html: `
<div class="kui-grid kui-grid--lg">
    <section class="panel">
        <div class="panel-heading"><h3 class="panel-title">单行</h3><span class="badge badge-neutral">3 项</span></div>
        <div class="panel-body">
            <ul class="kui-list kui-list--flush">
                <li class="kui-list__item"><span class="kui-list__body"><span class="kui-list__title">渠道复盘</span></span><span class="kui-list__aside">今天</span></li>
                <li class="kui-list__item"><span class="kui-list__body"><span class="kui-list__title">库存预警</span></span><span class="kui-list__aside">昨天</span></li>
                <li class="kui-list__item"><span class="kui-list__body"><span class="kui-list__title">结算归档</span></span><span class="kui-list__aside">周一</span></li>
            </ul>
        </div>
    </section>
    <section class="panel">
        <div class="panel-heading"><h3 class="panel-title">双行</h3><span class="badge badge-neutral">2 项</span></div>
        <div class="panel-body">
            <ul class="kui-list kui-list--flush">
                <li class="kui-list__item">
                    <span class="kui-list__body">
                        <span class="kui-list__title">华东仓补货计划</span>
                        <span class="kui-list__desc">12 个 SKU 需要在本周内完成调拨。</span>
                    </span>
                    <span class="kui-list__aside"><span class="badge badge-warning">待处理</span></span>
                </li>
                <li class="kui-list__item">
                    <span class="kui-list__body">
                        <span class="kui-list__title">十月渠道复盘</span>
                        <span class="kui-list__desc">投放数据与转化漏斗已经合并到同一张看板。</span>
                    </span>
                    <span class="kui-list__aside"><span class="badge badge-success">已完成</span></span>
                </li>
            </ul>
        </div>
    </section>
    <section class="panel">
        <div class="panel-heading"><h3 class="panel-title">三行</h3><span class="badge badge-primary">1 项</span></div>
        <div class="panel-body">
            <ul class="kui-list kui-list--flush">
                <li class="kui-list__item">
                    <span class="kui-list__media"><span class="kui-avatar kui-avatar--sm"><img src="./images/portraits/4.jpg" alt="苏晚"></span></span>
                    <span class="kui-list__body">
                        <span class="kui-list__title">苏晚 更新了报价单 <span class="badge badge-info">v3</span></span>
                        <span class="kui-list__desc">调整了华南区三档折扣，新增年度框架价。</span>
                        <span class="kui-list__meta"><i class="fa fa-clock-o" aria-hidden="true"></i> 18 分钟前 · 2 处修改</span>
                    </span>
                </li>
            </ul>
        </div>
    </section>
</div>`,
})}

${demo({
    title: '空状态',
    desc: '列表内空态只说明「这里暂时没有」，整块空态再给一个下一步动作；两者都不使用插画，也不改变列表本身的高度逻辑。',
    tags: ['.kui-list__empty', '.kui-empty'],
    stage: 'tinted',
    html: `
<div class="kui-grid">
    <div class="kui-list">
        <div class="kui-list__empty">还没有收到协作邀请</div>
    </div>
    <div class="panel">
        <div class="kui-empty">
            <i class="fa fa-inbox" aria-hidden="true"></i>
            <strong>暂无待办任务</strong>
            <p>新任务会出现在这里，也可以先创建一个属于团队的模板。</p>
            <button type="button" class="btn btn-primary btn-sm"><i class="fa fa-plus" aria-hidden="true"></i> 新建任务</button>
        </div>
    </div>
</div>`,
})}

${callout('行内操作默认透明，只在悬停与 focus-within 时出现；触屏与窄屏会常驻显示。若操作是这一行的主要目的，改为右侧常驻按钮，不要依赖悬停。')}

${propsTable([
    { name: '.kui-list', type: 'class', defaultValue: '—', desc: '列表根容器：一像素边框、圆角与白色底，可包在面板里。' },
    { name: '.kui-list--flush', type: 'class', desc: '去掉边框、圆角与底色，用于面板内部或与其它容器同底。' },
    { name: '.kui-list__header', type: 'class', desc: '列表页头，左侧标题右侧计数或筛选入口。' },
    { name: '.kui-list__item', type: 'class', desc: '列表项，横向排布媒体、主体、辅助与操作四段。' },
    { name: '.kui-list__media / __body', type: 'class', desc: '左侧头像或图标，以及可伸缩的主体列。' },
    { name: '.kui-list__title / __desc / __meta', type: 'class', desc: '标题（可内嵌徽章）、最多两行的描述与元信息。' },
    { name: '.kui-list__aside', type: 'class', desc: '右侧固定列：时间、状态徽章或数值，窄屏时自动换行到下方。' },
    { name: '.kui-list__actions', type: 'class', desc: '行内操作，默认透明，悬停或聚焦时出现，窄屏常驻。' },
    { name: '.is-unread / .is-active', type: 'class', desc: '未读只加粗标题；当前项加左侧色条与浅色底。' },
    { name: '.kui-list__empty / .kui-empty', type: 'class', desc: '列表内联空态与整块空态，后者可带图标、说明与主操作。' },
])}

`

    const list = root.querySelector<HTMLElement>('[data-ls-team]')
    const count = root.querySelector<HTMLElement>('[data-ls-count]')
    const empty = root.querySelector<HTMLElement>('[data-ls-empty]')

    const sync = (): void => {
        const total = list?.querySelectorAll('.kui-list__item').length ?? 0
        if (count) {
            count.textContent = `${total} 位成员`
        }
        if (empty) {
            empty.hidden = total > 0
        }
    }

    list?.addEventListener('click', (event) => {
        const target = event.target instanceof Element ? event.target : null
        const remove = target?.closest<HTMLElement>('[data-ls-remove]')
        if (!remove) {
            return
        }
        remove.closest('.kui-list__item')?.remove()
        sync()
    })

    sync()
}
