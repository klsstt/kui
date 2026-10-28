import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 消息与任务。
 * 未读消息只加一层浅色底与加粗标题，已读回落到常规列表；
 * 任务用复选框表达完成，完成态降低对比并加删除线，不再额外加状态列。
 */

export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '消息告诉用户「发生了什么」，任务告诉用户「还差什么」。两者都是同一条记录一行的结构，筛选放在顶部工具栏，未读与完成只改变这一行的强调。',
    tags: ['.kui-message', '.kui-task', '.kui-toolbar'],
})}

${sectionTitle('消息', '未读只改变底色与标题字重，筛选与批量已读放在同一行工具栏。')}

${demo({
    title: '消息列表与未读态',
    desc: '未读项浅色底 + 标题加粗，时间固定在右侧；搜索与未读筛选只改变可见性，不重新排序。全部已读后计数消失，筛选到空结果时给出提示。',
    tags: ['.is-unread', 'data-msg-state', '全部已读'],
    script: `
const items = Array.from(document.querySelectorAll<HTMLElement>('[data-msg-item]'))
const search = document.querySelector<HTMLInputElement>('[data-msg-search]')
const badge = document.querySelector<HTMLElement>('[data-msg-unread]')
const empty = document.querySelector<HTMLElement>('[data-msg-empty]')
let mode: 'all' | 'unread' = 'all'

const apply = (): void => {
    const keyword = (search?.value ?? '').trim().toLowerCase()
    let visible = 0

    items.forEach((item) => {
        const unread = item.dataset.msgState === 'unread'
        const matched = (mode === 'all' || unread) &&
            (keyword === '' || (item.textContent ?? '').toLowerCase().includes(keyword))
        item.hidden = !matched
        if (matched) visible += 1
    })

    const unreadCount = items.filter((item) => item.dataset.msgState === 'unread').length
    if (badge) {
        badge.textContent = String(unreadCount)
        badge.hidden = unreadCount === 0
    }
    if (empty) empty.hidden = visible > 0
}

document.querySelectorAll<HTMLElement>('[data-msg-filter]').forEach((button) => {
    button.addEventListener('click', () => {
        mode = button.dataset.msgFilter === 'unread' ? 'unread' : 'all'
        document.querySelectorAll('[data-msg-filter]').forEach((other) => {
            other.classList.toggle('is-active', other === button)
            other.setAttribute('aria-pressed', String(other === button))
        })
        apply()
    })
})

search?.addEventListener('input', apply)

document.querySelector<HTMLElement>('[data-msg-readall]')?.addEventListener('click', () => {
    items.forEach((item) => {
        item.dataset.msgState = 'read'
        item.classList.remove('is-unread')
    })
    apply()
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-toolbar">
        <div class="kui-toolbar__group">
            <div class="input-group kui-max-w-sm">
                <span class="input-addon"><i class="fa fa-search" aria-hidden="true"></i></span>
                <input class="form-control" type="search" placeholder="搜索消息" aria-label="搜索消息" data-msg-search>
            </div>
        </div>
        <div class="kui-toolbar__group">
            <div class="kui-segmented" role="group" aria-label="消息筛选">
                <button type="button" class="is-active" data-msg-filter="all" aria-pressed="true">全部</button>
                <button type="button" data-msg-filter="unread" aria-pressed="false">未读</button>
            </div>
            <span class="badge badge-count" data-msg-unread>2</span>
            <button type="button" class="btn btn-default btn-sm" data-msg-readall>全部已读</button>
        </div>
    </div>
    <div class="kui-stack kui-stack--tight" data-msg-list>
        <article class="kui-message is-unread" data-msg-item data-msg-state="unread">
            <span class="kui-avatar"><img src="./images/portraits/1.jpg" alt="林澈"></span>
            <div class="kui-message__body">
                <p class="kui-message__title">审批通过：华东仓补货申请</p>
                <p class="kui-message__text">周昕提交的 12 个 SKU 补货申请已通过，预计周四完成调拨。</p>
            </div>
            <span class="kui-message__time">9 分钟前</span>
        </article>
        <article class="kui-message is-unread" data-msg-item data-msg-state="unread">
            <span class="kui-avatar kui-avatar--primary"><i class="fa fa-bell-o" aria-hidden="true"></i></span>
            <div class="kui-message__body">
                <p class="kui-message__title">今晚 22:00 系统维护</p>
                <p class="kui-message__text">订单导出会暂停约 20 分钟，已排队的任务会在维护结束后继续。</p>
            </div>
            <span class="kui-message__time">1 小时前</span>
        </article>
        <article class="kui-message" data-msg-item data-msg-state="read">
            <span class="kui-avatar kui-avatar--success"><i class="fa fa-check" aria-hidden="true"></i></span>
            <div class="kui-message__body">
                <p class="kui-message__title">9 月结算单已归档</p>
                <p class="kui-message__text">42 张发票已同步到财务系统，无需再手工核对。</p>
            </div>
            <span class="kui-message__time">昨天 20:14</span>
        </article>
        <article class="kui-message" data-msg-item data-msg-state="read">
            <span class="kui-avatar kui-avatar--warning"><img src="./images/portraits/2.jpg" alt="周昕"></span>
            <div class="kui-message__body">
                <p class="kui-message__title">周昕 提交了补货申请</p>
                <p class="kui-message__text">华东仓 12 个 SKU 低于安全库存，建议本周内完成调拨。</p>
            </div>
            <span class="kui-message__time">昨天 16:08</span>
        </article>
        <article class="kui-message" data-msg-item data-msg-state="read">
            <span class="kui-avatar"><img src="./images/portraits/4.jpg" alt="苏晚"></span>
            <div class="kui-message__body">
                <p class="kui-message__title">苏晚 更新了报价单 v3</p>
                <p class="kui-message__text">华南区三档折扣已调整，新增年度框架价，等待确认。</p>
            </div>
            <span class="kui-message__time">10 月 25 日</span>
        </article>
    </div>
    <p class="form-hint" data-msg-empty hidden>没有匹配的消息，换个关键词或切回「全部」。</p>
</div>`,
})}

${sectionTitle('任务', '完成态是复选框的结果，不再额外增加状态列或第二套行高。')}

${demo({
    title: '任务清单与完成态',
    desc: '复选框是唯一的状态入口；完成后整行降低对比并加删除线，计数在工具栏左侧同步。任务的标题与截止时间保持同一行高度，不因完成态而塌陷。',
    tags: ['.kui-task', '.is-done', 'aria-label'],
    script: `
const tasks = Array.from(document.querySelectorAll<HTMLElement>('[data-msg-task]'))
const doneLabel = document.querySelector<HTMLElement>('[data-msg-done]')

const syncDone = (): void => {
    const done = tasks.filter((task) => task.querySelector<HTMLInputElement>('.kui-task__check')?.checked).length
    if (doneLabel) doneLabel.textContent = '已完成 ' + done + ' / ' + tasks.length
}

tasks.forEach((task) => {
    const check = task.querySelector<HTMLInputElement>('.kui-task__check')
    check?.addEventListener('change', () => {
        task.classList.toggle('is-done', Boolean(check.checked))
        syncDone()
    })
})

syncDone()
`,
    html: `
<div class="kui-stack">
    <div class="kui-toolbar">
        <div class="kui-toolbar__group">
            <span class="badge badge-warning">今天截止</span>
            <span class="form-hint" data-msg-done>已完成 2 / 5</span>
        </div>
        <div class="kui-toolbar__group">
            <button type="button" class="btn btn-default btn-sm"><i class="fa fa-plus" aria-hidden="true"></i> 新建任务</button>
        </div>
    </div>
    <label class="kui-task is-done" data-msg-task>
        <input type="checkbox" class="kui-task__check" checked aria-label="完成：回复渠道商报价咨询">
        <span class="kui-task__body">
            <span class="kui-task__title">回复渠道商报价咨询</span>
            <span class="kui-task__meta"><i class="fa fa-check" aria-hidden="true"></i> 已于 11:20 完成</span>
        </span>
    </label>
    <label class="kui-task is-done" data-msg-task>
        <input type="checkbox" class="kui-task__check" checked aria-label="完成：确认秋季物料到仓时间">
        <span class="kui-task__body">
            <span class="kui-task__title">确认秋季物料到仓时间</span>
            <span class="kui-task__meta"><i class="fa fa-check" aria-hidden="true"></i> 已于 10:05 完成</span>
        </span>
    </label>
    <label class="kui-task" data-msg-task>
        <input type="checkbox" class="kui-task__check" aria-label="完成：审核「秋季满减」活动预算">
        <span class="kui-task__body">
            <span class="kui-task__title">审核「秋季满减」活动预算</span>
            <span class="kui-task__meta"><i class="fa fa-clock-o" aria-hidden="true"></i> 今天 18:00 前 · 市场部</span>
        </span>
    </label>
    <label class="kui-task" data-msg-task>
        <input type="checkbox" class="kui-task__check" aria-label="完成：整理华南区门店陈列清单">
        <span class="kui-task__body">
            <span class="kui-task__title">整理华南区门店陈列清单</span>
            <span class="kui-task__meta"><i class="fa fa-clock-o" aria-hidden="true"></i> 今天 20:00 前 · 渠道部</span>
        </span>
    </label>
    <label class="kui-task" data-msg-task>
        <input type="checkbox" class="kui-task__check" aria-label="完成：核对 10 月渠道返点">
        <span class="kui-task__body">
            <span class="kui-task__title">核对 10 月渠道返点</span>
            <span class="kui-task__meta"><i class="fa fa-calendar" aria-hidden="true"></i> 周五前 · 财务部</span>
        </span>
    </label>
</div>`,
})}

${demo({
    title: '未读与完成的状态对照',
    desc: '同一个列表只允许两种强调：未读与已读、进行中与已完成；两侧并排时，差距应当一眼可辨，而不是靠额外的状态文案解释。',
    tags: ['.is-unread', '.is-done'],
    stage: 'grid',
    html: `
<div class="kui-stack kui-stack--tight">
    <article class="kui-message is-unread">
        <span class="kui-avatar"><img src="./images/portraits/1.jpg" alt="林澈"></span>
        <div class="kui-message__body"><p class="kui-message__title">审批通过：华东仓补货申请</p><p class="kui-message__text">未读：标题加粗，整行浅主色底。</p></div>
        <span class="kui-message__time">9 分钟前</span>
    </article>
    <article class="kui-message">
        <span class="kui-avatar kui-avatar--success"><i class="fa fa-envelope-o" aria-hidden="true"></i></span>
        <div class="kui-message__body"><p class="kui-message__title">9 月结算单已归档</p><p class="kui-message__text">已读：回到常规列表行。</p></div>
        <span class="kui-message__time">昨天</span>
    </article>
</div>
<div class="kui-stack kui-stack--tight">
    <label class="kui-task"><input type="checkbox" class="kui-task__check" aria-label="完成：审核活动预算"><span class="kui-task__body"><span class="kui-task__title">审核活动预算</span><span class="kui-task__meta">进行中：边框 + 白色底</span></span></label>
    <label class="kui-task is-done"><input type="checkbox" class="kui-task__check" checked aria-label="完成：回复报价咨询"><span class="kui-task__body"><span class="kui-task__title">回复报价咨询</span><span class="kui-task__meta">已完成：灰底 + 删除线</span></span></label>
</div>`,
})}

${callout('未读态只改变底色与标题字重，不额外增加圆点或数量列；任务完成只改变这一行的对比与删除线，不把复选框换成新的图标。状态入口越少，列表越容易扫读。')}

${propsTable([
    { name: '.kui-message / __title / __text', type: 'class', desc: '单条消息：头像或图标、主体两行、右侧时间；标题与正文都只占一行。' },
    { name: '.is-unread', type: 'class', desc: '未读态：浅主色底 + 标题加粗；已读不保留任何底色。' },
    { name: '.kui-task', type: 'class', desc: '任务行：复选框 + 标题 + 元信息，默认带一像素边框。' },
    { name: '.kui-task__check', type: 'class', desc: '完成开关，使用原生复选框与 accent-color。' },
    { name: '.is-done', type: 'class', desc: '完成态：底色转为灰底，标题加删除线并降低对比。' },
    { name: '.kui-toolbar / __group', type: 'class', desc: '顶部工具栏，左侧筛选、右侧批量动作与计数。' },
    { name: 'data-msg-item / data-msg-state', type: 'attribute', desc: '示例页用来筛选未读的钩子，业务里换成接口返回的状态字段。' },
    { name: 'aria-pressed', type: 'attribute', desc: '分段筛选按钮的选中状态；未读计数用 badge-count 展示。' },
])}

`

    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-msg-item]'))
    const search = root.querySelector<HTMLInputElement>('[data-msg-search]')
    const badge = root.querySelector<HTMLElement>('[data-msg-unread]')
    const empty = root.querySelector<HTMLElement>('[data-msg-empty]')
    let mode: 'all' | 'unread' = 'all'

    const apply = (): void => {
        const keyword = (search?.value ?? '').trim().toLowerCase()
        let visible = 0

        items.forEach((item) => {
            const unread = item.dataset.msgState === 'unread'
            const matched = (mode === 'all' || unread) && (keyword === '' || (item.textContent ?? '').toLowerCase().includes(keyword))
            item.hidden = !matched
            if (matched) {
                visible += 1
            }
        })

        const unreadCount = items.filter((item) => item.dataset.msgState === 'unread').length
        if (badge) {
            badge.textContent = String(unreadCount)
            badge.hidden = unreadCount === 0
        }
        if (empty) {
            empty.hidden = visible > 0
        }
    }

    root.querySelectorAll<HTMLElement>('[data-msg-filter]').forEach((button) => {
        button.addEventListener('click', () => {
            mode = button.dataset.msgFilter === 'unread' ? 'unread' : 'all'
            root.querySelectorAll('[data-msg-filter]').forEach((other) => {
                other.classList.toggle('is-active', other === button)
                other.setAttribute('aria-pressed', String(other === button))
            })
            apply()
        })
    })

    search?.addEventListener('input', apply)

    root.querySelector<HTMLElement>('[data-msg-readall]')?.addEventListener('click', () => {
        items.forEach((item) => {
            item.dataset.msgState = 'read'
            item.classList.remove('is-unread')
        })
        apply()
    })

    const tasks = Array.from(root.querySelectorAll<HTMLElement>('[data-msg-task]'))
    const doneLabel = root.querySelector<HTMLElement>('[data-msg-done]')

    const syncDone = (): void => {
        const done = tasks.filter((task) => task.querySelector<HTMLInputElement>('.kui-task__check')?.checked).length
        if (doneLabel) {
            doneLabel.textContent = `已完成 ${done} / ${tasks.length}`
        }
    }

    tasks.forEach((task) => {
        const check = task.querySelector<HTMLInputElement>('.kui-task__check')
        check?.addEventListener('change', () => {
            task.classList.toggle('is-done', Boolean(check.checked))
            syncDone()
        })
    })

    apply()
    syncDone()
}
