import type { DocPageContext } from '../../docs/types'
import { demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 徽章与标签。
 * 徽章只回答「是什么状态」，标签回答「属于哪个集合」，chip 才是可点击的筛选；
 * 三者都不承载主操作，颜色只用来区分语义，不用来表达数量。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '徽章用来标注状态，标签用来归类，chip 用来筛选。这一页把三种标记放回表格行、列表项和卡片角标里，说明它们各自只承担一件事。',
    tags: ['Badge', '.tag', '.chip'],
})}

${demo({
    title: '语义徽章',
    desc: '六种语义色对应六种业务状态；实心版本只用在需要压过底色的地方，尺寸只有默认与 lg 两档。',
    tags: ['.badge', '.badge-solid'],
    html: `
<div class="kui-stack">
    <div class="kui-cluster">
        <span class="badge badge-primary">进行中</span>
        <span class="badge badge-success">已发布</span>
        <span class="badge badge-warning">待审核</span>
        <span class="badge badge-danger">已退回</span>
        <span class="badge badge-info">草稿</span>
        <span class="badge badge-neutral">已归档</span>
    </div>
    <div class="kui-cluster">
        <span class="badge badge-solid badge-primary">主版本</span>
        <span class="badge badge-solid badge-success">健康</span>
        <span class="badge badge-solid badge-warning">有待办</span>
        <span class="badge badge-solid badge-danger">已超限</span>
        <span class="badge badge-solid">默认</span>
        <span class="badge badge-lg badge-neutral">只读</span>
    </div>
</div>`,
})}

${demo({
    title: '状态点与计数',
    desc: '状态点用于持续存在的运行态，计数徽章用于入口旁的未读数；两者都不能替代文字说明。',
    tags: ['.kui-dot', '.badge-dot', '.badge-count'],
    html: `
<div class="kui-stack">
    <div class="kui-cluster">
        <span class="kui-cluster kui-nowrap"><span class="kui-dot kui-dot--success kui-dot--pulse"></span> 运行中</span>
        <span class="kui-cluster kui-nowrap"><span class="kui-dot kui-dot--warning"></span> 排队中</span>
        <span class="kui-cluster kui-nowrap"><span class="kui-dot kui-dot--danger"></span> 已中断</span>
        <span class="kui-cluster kui-nowrap"><span class="kui-dot kui-dot--primary"></span> 处理中</span>
        <span class="kui-cluster kui-nowrap"><span class="kui-dot"></span> 未启用</span>
    </div>
    <div class="kui-cluster">
        <span class="badge badge-dot badge-success" role="img" aria-label="在线"></span>
        <span class="badge badge-dot badge-warning" role="img" aria-label="繁忙"></span>
        <span class="badge badge-dot badge-danger" role="img" aria-label="离线"></span>
        <span class="badge badge-count">12</span>
        <span class="badge badge-count">99+</span>
        <button type="button" class="btn btn-default btn-sm">审批中心 <span class="badge badge-count">6</span></button>
    </div>
</div>`,
})}

${sectionTitle('标签、chip 与移除', '标签是静态归类，chip 是可切换的筛选，移除按钮只出现在用户自己维护的集合里。')}

${demo({
    title: '可移除标签',
    desc: '点击右侧叉号移除标签，计数同步更新；标签本身保留最小高度，移除时整行不跳动。',
    tags: ['.tag', '.tag__remove'],
    script: `
const tagList = document.querySelector<HTMLElement>('[data-badge-tags]')
const tagCount = document.querySelector<HTMLElement>('[data-badge-count]')

tagList?.addEventListener('click', (event) => {
    const remove = (event.target as HTMLElement).closest('[data-badge-remove]')
    if (!remove) {
        return
    }
    remove.closest('.tag')?.remove()
    if (tagCount) {
        tagCount.textContent = String(tagList.querySelectorAll('.tag').length)
    }
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-cluster">
        <span class="kui-stat__label">已选条件</span>
        <span class="badge badge-neutral" data-badge-count>3</span>
    </div>
    <div class="kui-cluster" data-badge-tags>
        <span class="tag">华东仓 <button type="button" class="tag__remove" data-badge-remove aria-label="移除 华东仓"><i class="fa fa-times" aria-hidden="true"></i></button></span>
        <span class="tag tag--primary">重点客户 <button type="button" class="tag__remove" data-badge-remove aria-label="移除 重点客户"><i class="fa fa-times" aria-hidden="true"></i></button></span>
        <span class="tag">双十一 <button type="button" class="tag__remove" data-badge-remove aria-label="移除 双十一"><i class="fa fa-times" aria-hidden="true"></i></button></span>
    </div>
</div>`,
})}

${demo({
    title: 'chip 过滤',
    desc: '同一组 chip 一次只选中一个，计数写在 chip 内部；切换时更新结果区文案，而不是重排整页。',
    tags: ['.chip', '.is-active'],
    script: `
const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-badge-chip]'))
const result = document.querySelector<HTMLElement>('[data-badge-result]')

chips.forEach((chip) => {
    chip.addEventListener('click', () => {
        chips.forEach((item) => {
            const active = item === chip
            item.classList.toggle('is-active', active)
            item.setAttribute('aria-pressed', String(active))
        })
        if (result) {
            result.textContent = '当前筛选：' + (chip.dataset.badgeLabel ?? '') + ' · ' + (chip.dataset.badgeTotal ?? '') + ' 条记录'
        }
    })
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-cluster">
        <button type="button" class="chip is-active" data-badge-chip data-badge-label="全部" data-badge-total="48" aria-pressed="true">全部 <em>48</em></button>
        <button type="button" class="chip" data-badge-chip data-badge-label="待审核" data-badge-total="6" aria-pressed="false">待审核 <em>6</em></button>
        <button type="button" class="chip" data-badge-chip data-badge-label="已发布" data-badge-total="39" aria-pressed="false">已发布 <em>39</em></button>
        <button type="button" class="chip" data-badge-chip data-badge-label="已退回" data-badge-total="3" aria-pressed="false">已退回 <em>3</em></button>
    </div>
    <p class="kui-page-header__desc" data-badge-result>当前筛选：全部 · 48 条记录</p>
</div>`,
})}

${sectionTitle('实际落位', '徽章几乎从不单独出现，它总贴在表格行、列表右侧或卡片标题上。')}

${demo({
    title: '表格行、列表右侧与卡片角标',
    desc: '表格行内用徽章标注状态，列表右侧用计数徽章收起次要信息，卡片标题旁只留一个语义徽章。',
    stage: 'tinted',
    tags: ['.table', '.kui-list__aside', '.kui-board'],
    html: `
<div class="kui-stack kui-stack--loose">
    <table class="table">
        <thead><tr><th>订单号</th><th>客户</th><th>状态</th><th class="kui-text-right">金额</th></tr></thead>
        <tbody>
            <tr><td>K-2481</td><td>澄明科技</td><td><span class="badge badge-success">已支付</span></td><td class="kui-text-right">12,400</td></tr>
            <tr><td>K-2480</td><td>远山文创</td><td><span class="badge badge-warning">待审核</span></td><td class="kui-text-right">8,260</td></tr>
            <tr><td>K-2479</td><td>南屿供应链</td><td><span class="badge badge-danger">已退款</span></td><td class="kui-text-right">3,180</td></tr>
        </tbody>
    </table>
    <ul class="kui-list">
        <li class="kui-list__item">
            <span class="kui-list__media"><span class="kui-avatar kui-avatar--sm kui-avatar--primary"><i class="fa fa-inbox" aria-hidden="true"></i></span></span>
            <span class="kui-list__body">
                <span class="kui-list__title">待处理审批</span>
                <span class="kui-list__meta">最近一条 12 分钟前</span>
            </span>
            <span class="kui-list__aside"><span class="badge badge-count">6</span></span>
        </li>
    </ul>
    <div class="kui-grid kui-grid--md">
        <article class="kui-board kui-shortcut">
            <div class="kui-cluster kui-justify-between">
                <strong>渠道看板</strong>
                <span class="badge badge-primary">推荐</span>
            </div>
            <small>按渠道拆解转化与客单价</small>
        </article>
    </div>
</div>`,
})}

${propsTable([
    { name: '.badge', type: 'class', defaultValue: '—', desc: '基础徽章，高 20px、圆角胶囊、单行不换行。' },
    { name: '.badge-primary / -success / -warning / -danger / -info', type: 'class', defaultValue: '—', desc: '五种语义底色，由令牌色按 12% 混入表面色派生。' },
    { name: '.badge-neutral', type: 'class', defaultValue: '—', desc: '中性徽章，用于归档、只读等无风险状态。' },
    { name: '.badge-solid', type: 'class', defaultValue: '—', desc: '与语义色组合成实心徽章，前景自动切换为反白。' },
    { name: '.badge-dot', type: 'class', defaultValue: '—', desc: '只显示一个 6px 圆点，需配合 <code>aria-label</code> 说明状态。' },
    { name: '.badge-count', type: 'class', defaultValue: '—', desc: '计数徽章，数字等宽，最小宽度 20px。' },
    { name: '.badge-lg', type: 'class', defaultValue: '—', desc: '放大一档，用在页面级筛选或详情页标题旁。' },
    { name: '.tag / .tag--primary', type: 'class', defaultValue: '—', desc: '直角标签，可放图标与移除按钮。' },
    { name: '.tag__remove', type: 'class', defaultValue: '—', desc: '16px 移除按钮，必须带可读的 <code>aria-label</code>。' },
    { name: '.chip / .chip.is-active', type: 'class', defaultValue: '—', desc: '胶囊筛选片，选中态由主色 10% 混色表达。' },
    { name: '.kui-dot', type: 'class', defaultValue: '8px', desc: '状态圆点，尺寸取自 <code>--kui-dot-size</code>，可加 <code>kui-dot--pulse</code>。' },
])}

`

    const tagList = root.querySelector<HTMLElement>('[data-badge-tags]')
    const tagCount = root.querySelector<HTMLElement>('[data-badge-count]')
    tagList?.addEventListener('click', (event) => {
        const remove = (event.target as HTMLElement).closest('[data-badge-remove]')
        if (!remove) {
            return
        }
        remove.closest('.tag')?.remove()
        if (tagCount) {
            tagCount.textContent = String(tagList.querySelectorAll('.tag').length)
        }
    })

    const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-badge-chip]'))
    const chipResult = root.querySelector<HTMLElement>('[data-badge-result]')
    chips.forEach((chip) => {
        chip.addEventListener('click', () => {
            chips.forEach((item) => {
                const active = item === chip
                item.classList.toggle('is-active', active)
                item.setAttribute('aria-pressed', String(active))
            })
            if (chipResult) {
                chipResult.textContent = `当前筛选：${chip.dataset.badgeLabel ?? ''} · ${chip.dataset.badgeTotal ?? ''} 条记录`
            }
        })
    })
}
