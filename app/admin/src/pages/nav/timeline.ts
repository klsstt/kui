import { Timeline } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 时间线。
 * 用一条轴线串起事件序列：节点只承担状态语义，正文只说发生了什么，
 * 时间戳放在标题之下，形成稳定的阅读顺序。间距由组件统一，紧凑档只收间距。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '时间线用一条轴线串起按时间发生的事件：节点颜色只表达状态，标题说发生了什么、时间说明何时、正文补充影响范围。节点与轴线的间距、条目与条目的间距都由组件决定，页面只提供事件本身。',
    tags: ['Timeline', '.kui-timeline', 'tone', 'dense'],
})}

${demo({
    title: '基础时间线',
    desc: '一条轴线、若干条目；时间放在标题下方作为副信息，长文本自动换行，不挤压轴线与节点。板面负责 16px 内边距，轴线与节点再向内收，标题不会贴住卡片边框。',
    tags: ['.kui-timeline', '.kui-timeline__item', '.kui-timeline__dot'],
    script: `
document.querySelectorAll<HTMLElement>('[data-tl-basic]').forEach((element) => {
    Timeline.getOrCreate(element, {
        items: [
            { title: '发布 2.4.0', time: '今天 10:24', description: '新增面板全屏与抽屉筛选，文档同步更新。' },
            { title: '修复移动端折叠菜单', time: '昨天 18:02', description: '窄屏下导航不再遮挡内容区。' },
            { title: '开放内测', time: '10 月 20 日', description: '首批 12 个团队接入，收集到 38 条反馈。' },
        ],
    })
})
`,
    html: `
<div class="kui-board">
    <div data-tl-basic></div>
</div>`,
})}

${demo({
    title: '交替布局',
    desc: '条目较多且每条都带说明时改为左右交替：轴线居中，奇偶行各占一半宽度，40rem 以下自动退回单列。轴线与第一行文字都留在板面内边距之内。',
    tags: ['.kui-timeline--alternating', 'alternating'],
    script: `
document.querySelectorAll<HTMLElement>('[data-tl-alternating]').forEach((element) => {
    Timeline.getOrCreate(element, {
        alternating: true,
        items: [
            { title: '立项', time: '2026 年 3 月', description: '确定令牌方案与四端适配范围。' },
            { title: '首个可用版本', time: '2026 年 6 月', description: '布局原语与 12 个基础组件落地。' },
            { title: '文档站上线', time: '2026 年 9 月', description: '示例与源码同源，全部可复制。' },
            { title: '2.4 版本', time: '2026 年 10 月', description: '补齐引导、步骤条与时间线。' },
        ],
    })
})
`,
    html: `
<div class="kui-board">
    <div data-tl-alternating></div>
</div>`,
})}

${demo({
    title: '紧凑：日志视图',
    desc: 'dense 只收条目之间的间距与节点上方留白，轴线与节点的关系不变；适合放在面板内部展示一段连续操作。面板正文同样保留 16px 内边距。',
    tags: ['.kui-timeline--dense', 'dense'],
    script: `
document.querySelectorAll<HTMLElement>('[data-tl-dense]').forEach((element) => {
    Timeline.getOrCreate(element, {
        dense: true,
        items: [
            { title: '同步了 1,284 条库存', time: '11:32', tone: 'success' },
            { title: '灰度比例提升到 50%', time: '11:05', tone: 'primary' },
            { title: '监控出现 3 次超时', time: '10:48', tone: 'warning' },
            { title: '回滚到 2.3.9', time: '10:41', tone: 'danger' },
            { title: '值班同学确认恢复', time: '10:36' },
        ],
    })
})
`,
    html: `
<section class="panel">
    <div class="panel-heading">
        <h3 class="panel-title">发布记录</h3>
        <div class="panel-actions"><span class="badge badge-neutral">最近 1 小时</span></div>
    </div>
    <div class="panel-body">
        <div data-tl-dense></div>
    </div>
</section>`,
})}

${sectionTitle('节点语义', '节点颜色只区分结果：成功、进行中、警告、失败。同一屏里不同色的节点不超过三类。')}

${demo({
    title: '语义色节点',
    desc: '不配图标时，节点只剩一个色点：颜色越少，读者越容易把它当成状态而不是装饰；同一份数据换成文字描述也完全成立。左侧留白仍由板面与组件两层共同保证。',
    tags: ['tone', '.is-success', '.is-danger'],
    script: `
document.querySelectorAll<HTMLElement>('[data-tl-tone]').forEach((element) => {
    Timeline.getOrCreate(element, {
        items: [
            { title: '订单已签收', time: '今天 09:20', tone: 'success', description: '客户确认收货，评价已同步。' },
            { title: '仓库开始拣货', time: '今天 08:40', tone: 'primary', description: '预计 2 小时内出库。' },
            { title: '地址校验未通过', time: '昨天 21:10', tone: 'warning', description: '收件人电话缺失，已通知客户补充。' },
            { title: '支付超时关闭', time: '昨天 20:32', tone: 'danger', description: '下单 30 分钟内未支付，库存已释放。' },
        ],
    })
})
`,
    html: `
<div class="kui-board">
    <div data-tl-tone></div>
</div>`,
})}

${demo({
    title: '带图标的节点',
    desc: '图标放在节点内部，尺寸固定为 7–8px：它说明「哪一类事件」，颜色说明「结果如何」，两者可以同时出现，也可以只保留一个。节点仍完整落在板面留白之内。',
    tags: ['items[].icon', 'Font Awesome 4.7', 'tone + icon'],
    script: `
document.querySelectorAll<HTMLElement>('[data-tl-icon]').forEach((element) => {
    Timeline.getOrCreate(element, {
        items: [
            { title: '部署完成', time: '11:20', tone: 'success', icon: 'fa fa-rocket', description: '三个服务全部就绪，健康检查通过。' },
            { title: '数据库迁移', time: '10:12', tone: 'primary', icon: 'fa fa-database', description: '新增两张表，未改动既有字段。' },
            { title: '构建失败', time: '09:48', tone: 'danger', icon: 'fa fa-bug', description: '类型检查未通过，已回滚到上一个构建。' },
            { title: '配置已更新', time: '09:15', icon: 'fa fa-cog', description: '限流阈值从 200 调整到 320。' },
        ],
    })
})
`,
    html: `
<div class="kui-board">
    <div data-tl-icon></div>
</div>`,
})}

${callout('时间线与步骤条共用一条轴线，但回答的问题不同：时间线回答「已经发生了什么」，步骤条回答「还要走几步」。示例统一把组件放进 <code>.kui-board</code>（内边距 16px），组件自己再留出轴线与文字的间距；两层留白叠加后，轴线、节点与标题都不会贴住卡片边框。')}

${propsTable([
    { name: 'items', type: 'TimelineItem[]', defaultValue: '[]', desc: '事件数组，按传入顺序渲染。' },
    { name: 'items[].title', type: 'string', defaultValue: '—', desc: '事件标题，一行说清发生了什么。' },
    { name: 'items[].time', type: 'string', defaultValue: '—', desc: '时间或阶段标签，显示在标题下方。' },
    { name: 'items[].description', type: 'string', defaultValue: '—', desc: '影响范围、原因或后续动作。' },
    { name: 'items[].tone', type: 'string', defaultValue: 'default', desc: '节点语义：<code>default</code> / <code>primary</code> / <code>success</code> / <code>warning</code> / <code>danger</code>。' },
    { name: 'items[].icon', type: 'string', defaultValue: '—', desc: '节点内图标，取自 Font Awesome 4.7，字号 7px。' },
    { name: 'alternating', type: 'boolean', defaultValue: 'false', desc: '左右交替布局，40rem 以下自动退回单列。' },
    { name: 'dense', type: 'boolean', defaultValue: 'false', desc: '收紧条目间距，用于面板内部或日志视图。' },
    { name: '.kui-timeline', type: 'class', defaultValue: '20px', desc: '条目间距取 <code>--kui-space-5</code>，dense 时取 <code>--kui-space-3</code>；上下留 12px、左侧留 24px 给轴线与节点。' },
    { name: '.kui-timeline__dot', type: 'class', defaultValue: '17px', desc: '节点：17px 圆点 + 3px 表面色描边，颜色由 tone 决定；相对条目左移 24px 落在轴线上。' },
])}

`

    root.querySelectorAll<HTMLElement>('[data-tl-basic]').forEach(element => {
        trackComponent(
            Timeline.getOrCreate(element, {
                items: [
                    { title: '发布 2.4.0', time: '今天 10:24', description: '新增面板全屏与抽屉筛选，文档同步更新。' },
                    { title: '修复移动端折叠菜单', time: '昨天 18:02', description: '窄屏下导航不再遮挡内容区。' },
                    { title: '开放内测', time: '10 月 20 日', description: '首批 12 个团队接入，收集到 38 条反馈。' }
                ]
            }),
        )
    })

    root.querySelectorAll<HTMLElement>('[data-tl-alternating]').forEach(element => {
        trackComponent(
            Timeline.getOrCreate(element, {
                alternating: true,
                items: [
                    { title: '立项', time: '2026 年 3 月', description: '确定令牌方案与四端适配范围。' },
                    { title: '首个可用版本', time: '2026 年 6 月', description: '布局原语与 12 个基础组件落地。' },
                    { title: '文档站上线', time: '2026 年 9 月', description: '示例与源码同源，全部可复制。' },
                    { title: '2.4 版本', time: '2026 年 10 月', description: '补齐引导、步骤条与时间线。' }
                ]
            }),
        )
    })

    root.querySelectorAll<HTMLElement>('[data-tl-dense]').forEach(element => {
        trackComponent(
            Timeline.getOrCreate(element, {
                dense: true,
                items: [
                    { title: '同步了 1,284 条库存', time: '11:32', tone: 'success' },
                    { title: '灰度比例提升到 50%', time: '11:05', tone: 'primary' },
                    { title: '监控出现 3 次超时', time: '10:48', tone: 'warning' },
                    { title: '回滚到 2.3.9', time: '10:41', tone: 'danger' },
                    { title: '值班同学确认恢复', time: '10:36' }
                ]
            }),
        )
    })

    root.querySelectorAll<HTMLElement>('[data-tl-tone]').forEach(element => {
        trackComponent(
            Timeline.getOrCreate(element, {
                items: [
                    { title: '订单已签收', time: '今天 09:20', tone: 'success', description: '客户确认收货，评价已同步。' },
                    { title: '仓库开始拣货', time: '今天 08:40', tone: 'primary', description: '预计 2 小时内出库。' },
                    { title: '地址校验未通过', time: '昨天 21:10', tone: 'warning', description: '收件人电话缺失，已通知客户补充。' },
                    { title: '支付超时关闭', time: '昨天 20:32', tone: 'danger', description: '下单 30 分钟内未支付，库存已释放。' }
                ]
            }),
        )
    })

    root.querySelectorAll<HTMLElement>('[data-tl-icon]').forEach(element => {
        trackComponent(
            Timeline.getOrCreate(element, {
                items: [
                    { title: '部署完成', time: '11:20', tone: 'success', icon: 'fa fa-rocket', description: '三个服务全部就绪，健康检查通过。' },
                    { title: '数据库迁移', time: '10:12', tone: 'primary', icon: 'fa fa-database', description: '新增两张表，未改动既有字段。' },
                    { title: '构建失败', time: '09:48', tone: 'danger', icon: 'fa fa-bug', description: '类型检查未通过，已回滚到上一个构建。' },
                    { title: '配置已更新', time: '09:15', icon: 'fa fa-cog', description: '限流阈值从 200 调整到 320。' }
                ]
            }),
        )
    })
}
