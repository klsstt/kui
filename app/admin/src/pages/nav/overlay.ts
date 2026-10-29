import { Dropdown, Popover, Tooltip, type PopoverOptions } from '@kui/core'
import { trackComponent, trackDispose } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 悬浮组件。
 * 浮层按「承载什么」分工：tooltip 只解释一句词，dropdown 给一组同级动作，
 * popover 承载一段可以继续操作的内容——按钮组、列表、表格或一张小表单。
 * 三者都跟随触发器定位，都在 Esc 或点击外部时关闭。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '悬浮不是只有提示语。按承载的信息量分三档：<code>Tooltip</code> 解释一个词或一个图标，<code>Dropdown</code> 给出一组同级动作，<code>Popover</code> 承载一整段可以继续操作的内容——按钮组、列表、表格、图文，甚至一张小表单。所有触发器都是 <code>&lt;button type="button"&gt;</code>，不使用 <code>#</code> 锚点，因此打开浮层不会改变页面滚动位置。',
    tags: ['Dropdown', 'Tooltip', 'Popover', 'button'],
})}

${demo({
    title: '悬浮菜单：一组同级动作',
    desc: '触发器是普通按钮，点开菜单；菜单项按「常用 → 危险」排列，危险项放在分隔线之后。点任意一项菜单收起，页面上的提示同步读出选择结果；地址栏与滚动位置都不变。',
    tags: ['Dropdown', '.dropdown-menu', '.dropdown-item'],
    script: `
document.querySelectorAll<HTMLElement>('[data-ov-menu]').forEach((trigger) => {
    Dropdown.getOrCreate(trigger, { placement: 'bottom-start' })
})

document.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const item = target.closest<HTMLElement>('[data-ov-menu-action]')
    if (!item) return
    const note = document.querySelector<HTMLElement>('[data-ov-menu-note]')
    if (note) note.textContent = '已选择：' + (item.textContent ?? '').trim()
})
`,
    html: `
<section class="kui-board kui-stack kui-stack--tight">
    <div class="kui-toolbar">
        <div class="kui-toolbar__group">
            <strong>待处理 · 3</strong>
            <span class="form-hint" data-ov-menu-note>点开菜单，选择一项。</span>
        </div>
        <div class="kui-toolbar__group">
            <div class="dropdown">
                <button type="button" class="btn btn-default btn-sm" data-toggle="dropdown" data-ov-menu aria-haspopup="menu">
                    更多操作 <i class="fa fa-caret-down" aria-hidden="true"></i>
                </button>
                <ul class="dropdown-menu">
                    <li><button type="button" class="dropdown-item" data-ov-menu-action><i class="fa fa-check" aria-hidden="true"></i> 标记为已处理</button></li>
                    <li><button type="button" class="dropdown-item" data-ov-menu-action><i class="fa fa-user" aria-hidden="true"></i> 转交同事</button></li>
                    <li><button type="button" class="dropdown-item" data-ov-menu-action><i class="fa fa-clock-o" aria-hidden="true"></i> 稍后提醒</button></li>
                    <li class="divider"></li>
                    <li><button type="button" class="dropdown-item is-danger" data-ov-menu-action><i class="fa fa-trash-o" aria-hidden="true"></i> 删除订单</button></li>
                </ul>
            </div>
            <div class="dropdown">
                <button type="button" class="btn btn-default btn-sm btn-icon" data-toggle="dropdown" data-ov-menu aria-label="更多批量操作" aria-haspopup="menu">
                    <i class="fa fa-ellipsis-h" aria-hidden="true"></i>
                </button>
                <ul class="dropdown-menu">
                    <li><button type="button" class="dropdown-item" data-ov-menu-action><i class="fa fa-download" aria-hidden="true"></i> 导出所选</button></li>
                    <li><button type="button" class="dropdown-item" data-ov-menu-action><i class="fa fa-print" aria-hidden="true"></i> 打印面单</button></li>
                </ul>
            </div>
        </div>
    </div>
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
</section>`,
})}

${demo({
    title: '悬浮文字：解释一个词或一个图标',
    desc: '悬停或键盘聚焦时出现，离开即消失；只放一句话，不放按钮与链接。四个方向各来一个，图标按钮用 aria-label 说明自己是什么，触发器全部是 button。',
    tags: ['Tooltip', 'placement', 'delay'],
    script: `
document.querySelectorAll<HTMLElement>('[data-ov-tooltip]').forEach((trigger) => {
    const placement = (trigger.dataset.ovPlacement ?? 'top') as 'top' | 'right' | 'bottom' | 'left'
    Tooltip.getOrCreate(trigger, { container: 'body', placement, delay: 120 })
})
`,
    html: `
<div class="kui-cluster">
    <button type="button" class="btn btn-default" data-toggle="tooltip" data-ov-tooltip data-ov-placement="top" title="上方提示：解释一个词或一个图标">上方</button>
    <button type="button" class="btn btn-default" data-toggle="tooltip" data-ov-tooltip data-ov-placement="right" title="右侧提示：不超过一句话">右侧</button>
    <button type="button" class="btn btn-default" data-toggle="tooltip" data-ov-tooltip data-ov-placement="bottom" title="下方提示：不放需要点击的内容">下方</button>
    <button type="button" class="btn btn-default btn-icon" data-toggle="tooltip" data-ov-tooltip data-ov-placement="left" aria-label="查看同步状态" title="左侧提示：最后同步于 9 分钟前">
        <i class="fa fa-refresh" aria-hidden="true"></i>
    </button>
</div>`,
})}

${demo({
    title: '悬浮图标：图标按钮 + 一段说明',
    desc: '目标只有 24–32px 时，用图标按钮承担触发器；气泡里给标题与两行说明，点开后可继续读，按 Esc 或点外部关闭。图标按钮仍然是 type="button"，不会触发页面跳转。',
    tags: ['Popover', '.btn-icon', 'title'],
    script: `
document.querySelectorAll<HTMLElement>('[data-ov-icon]').forEach((trigger) => {
    const popover = Popover.getOrCreate(trigger, { container: 'body', placement: 'bottom', mode: 'dialog', trigger: 'manual' })
    trigger.addEventListener('click', () => {
        const top = window.scrollY
        popover.toggle()
        window.scrollTo({ top })
    })
})
`,
    html: `
<div class="kui-cluster">
    <button type="button" class="btn btn-default btn-icon" data-toggle="popover" data-ov-icon aria-label="查看同步说明"
        title="同步说明" data-content="每小时自动同步一次；手动同步会立即推送当前页面的全部变更。">
        <i class="fa fa-refresh" aria-hidden="true"></i>
    </button>
    <button type="button" class="btn btn-default btn-icon" data-toggle="popover" data-ov-icon aria-label="查看权限说明"
        title="权限说明" data-content="成员默认只能查看自己创建的内容，管理员可以调整可见范围。">
        <i class="fa fa-shield" aria-hidden="true"></i>
    </button>
    <button type="button" class="btn btn-default btn-icon" data-toggle="popover" data-ov-icon aria-label="查看账单说明"
        title="账单说明" data-content="本月按实际用量结算，账单在次月 3 日生成。">
        <i class="fa fa-file-text-o" aria-hidden="true"></i>
    </button>
</div>`,
})}

${sectionTitle('承载内容', 'Popover 的边界是「一小段」：按钮组、列表、表格、图文与表单都能放，但都要能在两三行内读完。')}

${demo({
    title: '悬浮按钮组：当场做决定',
    desc: '需要用户在气泡里立刻选一个动作时，把按钮竖着排在同一条宽度上；点完按钮后气泡收起，结果写回页面。气泡里的按钮同样是 type="button"。',
    tags: ['Popover', 'html', '.btn'],
    script: `
const template = document.querySelector<HTMLTemplateElement>('[data-ov-template="actions"]')
const trigger = document.querySelector<HTMLElement>('[data-ov-actions]')
if (trigger && template) {
    const popover = Popover.getOrCreate(trigger, {
        container: 'body',
        html: true,
        placement: 'bottom',
        mode: 'dialog', trigger: 'manual',
        content: template.innerHTML,
    })
    trigger.addEventListener('click', () => {
        const top = window.scrollY
        popover.toggle()
        window.scrollTo({ top })
    })
}
`,
    html: `
<section class="kui-board kui-stack kui-stack--tight">
    <div class="kui-cluster">
        <button type="button" class="btn btn-primary" data-toggle="popover" data-ov-actions aria-haspopup="dialog">
            处理工单 <i class="fa fa-caret-down" aria-hidden="true"></i>
        </button>
        <span class="form-hint" data-ov-group-note>选择动作后，这里会显示处理结果。</span>
    </div>
</section>
<template data-ov-template="actions">
    <div class="kui-stack kui-stack--tight" style="min-width: 12rem">
        <button type="button" class="btn btn-primary btn-sm" data-ov-group-action="通过"><i class="fa fa-check" aria-hidden="true"></i> 通过</button>
        <button type="button" class="btn btn-default btn-sm" data-ov-group-action="转交"><i class="fa fa-user" aria-hidden="true"></i> 转交同事</button>
        <button type="button" class="btn btn-danger btn-outline btn-sm" data-ov-group-action="驳回"><i class="fa fa-times" aria-hidden="true"></i> 驳回</button>
    </div>
</template>`,
})}

${demo({
    title: '悬浮面板：列表、表格与图文',
    desc: '同一套气泡可以承载三种内容：三行列表说明进展，小幅表格对比数字，图文块给出一条带标记的说明。内容超过气泡高度时内部滚动。三个触发器都是 button。',
    tags: ['Popover', '.kui-list', '.table', '图文'],
    script: `
const readTemplate = (name: string): string => {
    const element = document.querySelector<HTMLTemplateElement>('[data-ov-template="' + name + '"]')
    return element ? element.innerHTML : ''
}
document.querySelectorAll<HTMLElement>('[data-ov-panel]').forEach((trigger) => {
    const placement = (trigger.dataset.ovPlacement ?? 'bottom') as 'top' | 'right' | 'bottom' | 'left'
    const popover = Popover.getOrCreate(trigger, {
        container: 'body',
        html: true,
        placement,
        mode: 'dialog', trigger: 'manual',
        content: readTemplate(trigger.dataset.ovPanel ?? ''),
    })
    trigger.addEventListener('click', () => {
        const top = window.scrollY
        popover.toggle()
        window.scrollTo({ top })
    })
})
`,
    html: `
<div class="kui-cluster">
    <button type="button" class="btn btn-default" data-toggle="popover" data-ov-panel="list">列表</button>
    <button type="button" class="btn btn-default" data-toggle="popover" data-ov-panel="table">表格</button>
    <button type="button" class="btn btn-default" data-toggle="popover" data-ov-panel="media">图文</button>
</div>
<template data-ov-template="list">
    <ul class="kui-list kui-list--flush" style="min-width: 14rem">
        <li class="kui-list__item">
            <span class="kui-list__body">
                <span class="kui-list__title">本周新增 18 个工单</span>
                <span class="kui-list__meta">其中 6 个来自移动端</span>
            </span>
        </li>
        <li class="kui-list__item">
            <span class="kui-list__body">
                <span class="kui-list__title">平均响应 42 分钟</span>
                <span class="kui-list__meta">比上周快 8 分钟</span>
            </span>
        </li>
        <li class="kui-list__item">
            <span class="kui-list__body">
                <span class="kui-list__title">超时工单 2 个</span>
                <span class="kui-list__meta">已自动升级给值班同学</span>
            </span>
        </li>
    </ul>
</template>
<template data-ov-template="table">
    <table class="table" style="min-width: 13rem">
        <thead><tr><th>渠道</th><th>订单</th></tr></thead>
        <tbody>
            <tr><td>直营小程序</td><td>182</td></tr>
            <tr><td>门店自提</td><td>126</td></tr>
            <tr><td>分销</td><td>64</td></tr>
        </tbody>
    </table>
</template>
<template data-ov-template="media">
    <div class="kui-cluster" style="--kui-cluster-align: flex-start; --kui-cluster-gap: var(--kui-space-2); min-width: 14rem">
        <span class="kui-avatar kui-avatar--lg"><img src="./images/kui-logo.png" alt=""></span>
        <span class="kui-list__body">
            <span class="kui-list__title">KUI 设计系统</span>
            <span class="kui-list__meta">24 个组件 · 8 个分类 · 每周更新</span>
        </span>
    </div>
</template>`,
})}

${demo({
    title: '悬浮表单：输入后原地提交',
    desc: '气泡里放一张最小表单：一个输入、一个提交，提交后气泡收起并把结果写回页面。字段用 id 与 label 绑定，打开时焦点自动落在输入框上；触发器与提交按钮都是 button。',
    tags: ['Popover', 'html', '.form-control'],
    script: `
const template = document.querySelector<HTMLTemplateElement>('[data-ov-template="form"]')
const trigger = document.querySelector<HTMLElement>('[data-ov-form]')
if (trigger && template) {
    const popover = Popover.getOrCreate(trigger, {
        container: 'body',
        html: true,
        placement: 'bottom',
        mode: 'dialog', trigger: 'manual',
        content: template.innerHTML,
    })
    trigger.addEventListener('click', () => {
        const top = window.scrollY
        popover.toggle()
        window.scrollTo({ top })
    })
}
`,
    html: `
<section class="kui-board kui-stack kui-stack--tight">
    <div class="kui-cluster">
        <button type="button" class="btn btn-default" data-toggle="popover" data-ov-form aria-haspopup="dialog">
            <i class="fa fa-plus" aria-hidden="true"></i> 新建视图
        </button>
        <span class="form-hint" data-ov-form-note>还没有创建视图。</span>
    </div>
</section>
<template data-ov-template="form">
    <div class="kui-stack kui-stack--tight" style="min-width: 15rem">
        <div class="form-group">
            <label class="form-label" for="ov-form-name">视图名称</label>
            <input class="form-control" id="ov-form-name" type="text" placeholder="例如：待发货" data-ov-form-name>
        </div>
        <div class="kui-cluster kui-justify-between">
            <span class="form-hint">按 Esc 关闭</span>
            <button type="button" class="btn btn-primary btn-sm" data-ov-form-submit>保存</button>
        </div>
    </div>
</template>`,
})}

${callout('浮层触发器一律是 <code>&lt;button type="button"&gt;</code>，页面里没有任何 <code>href="#"</code> 触发器，所以点开菜单、气泡、面板或表单都不会改变地址栏与页面滚动位置。Popover 打开时会聚焦气泡内的按钮或输入框，示例用 <code>trigger: \'manual\'</code> 接管点击，并在 <code>toggle()</code> 前后记录、恢复 <code>scrollY</code>，避免聚焦把页面带跑。浮层挂载到 <code>body</code> 之后就不再受文档容器的 <code>overflow</code> 裁切，代价是事件不再冒泡到页面容器：示例里统一在 <code>document</code> 上代理菜单项、按钮组与表单提交的点击，并在页面释放时移除监听。')}

${propsTable([
    { name: 'placement', type: 'string', defaultValue: 'top / right / bottom-start', desc: 'Tooltip 默认 <code>top</code>，Popover 默认 <code>right</code>，Dropdown 默认 <code>bottom-start</code>。' },
    { name: 'trigger', type: 'string', defaultValue: 'hover focus / click', desc: 'Tooltip 用悬停与聚焦，Popover 用点击；Dropdown 始终由点击或方向键打开。触发器统一写成 <code>button</code>；示例用 <code>trigger: \'manual\'</code> 接管点击并锁定滚动位置。' },
    { name: 'delay', type: 'number', defaultValue: '0', desc: 'Tooltip 显示延迟毫秒数，密集图标行建议 120。' },
    { name: 'container', type: 'string', defaultValue: '父元素', desc: '浮层挂载位置；触发器处在裁切容器里时设为 <code>body</code>。' },
    { name: 'content', type: 'string | HTMLElement', defaultValue: '—', desc: 'Popover 正文，也可在标记上写 <code>data-content</code>；<code>html: true</code> 时按 HTML 渲染。' },
    { name: 'html', type: 'boolean', defaultValue: 'false', desc: '为 <code>true</code> 时正文按 HTML 解析，按钮组、表格与表单都靠它。' },
    { name: 'menuSelector', type: 'string', defaultValue: '.dropdown-menu', desc: 'Dropdown 的菜单选择器，默认取触发器父级内的菜单。' },
    { name: 'autoClose', type: 'boolean', defaultValue: 'true', desc: '点击菜单项或浮层外部时收起。' },
    { name: '.tooltip-inner', type: 'class', defaultValue: '—', desc: '纯文本气泡的内容容器，只放一句话。' },
    { name: '.popover-title / .popover-content', type: 'class', defaultValue: '—', desc: '带标题气泡的标题与正文，正文超过高度时内部滚动。' },
    { name: '.dropdown-item / .divider', type: 'class', defaultValue: '—', desc: '菜单项与分组分隔线；危险项加 <code>.is-danger</code>。' },
])}

`

    root.querySelectorAll<HTMLElement>('[data-ov-tooltip]').forEach(trigger => {
        const placement = (trigger.dataset.ovPlacement ?? 'top') as 'top' | 'right' | 'bottom' | 'left'
        trackComponent(Tooltip.getOrCreate(trigger, { container: 'body', placement, delay: 120 }))
    })

    root.querySelectorAll<HTMLElement>('[data-ov-menu]').forEach(trigger => {
        trackComponent(Dropdown.getOrCreate(trigger, { placement: 'bottom-start' }))
    })

    const bindPopover = (trigger: HTMLElement, options: Partial<PopoverOptions>): void => {
        const popover = Popover.getOrCreate(trigger, { ...options, mode: 'dialog', trigger: 'manual' })
        trigger.addEventListener('click', () => {
            // 气泡打开时会聚焦内部按钮/输入框，先记住滚动位置，聚焦后再原样恢复
            const top = window.scrollY
            popover.toggle()
            window.scrollTo({ top })
        })
        trackComponent(popover)
    }

    root.querySelectorAll<HTMLElement>('[data-ov-icon]').forEach(trigger => {
        bindPopover(trigger, { container: 'body', placement: 'bottom' })
    })

    const readTemplate = (name: string): string => {
        const element = root.querySelector<HTMLTemplateElement>('[data-ov-template="' + name + '"]')
        return element ? element.innerHTML : ''
    }

    const actionsTrigger = root.querySelector<HTMLElement>('[data-ov-actions]')
    if (actionsTrigger) {
        bindPopover(actionsTrigger, {
            container: 'body',
            html: true,
            placement: 'bottom',
            content: readTemplate('actions'),
        })
    }

    root.querySelectorAll<HTMLElement>('[data-ov-panel]').forEach(trigger => {
        const placement = (trigger.dataset.ovPlacement ?? 'bottom') as 'top' | 'right' | 'bottom' | 'left'
        bindPopover(trigger, {
            container: 'body',
            html: true,
            placement,
            content: readTemplate(trigger.dataset.ovPanel ?? ''),
        })
    })

    const formTrigger = root.querySelector<HTMLElement>('[data-ov-form]')
    if (formTrigger) {
        bindPopover(formTrigger, {
            container: 'body',
            html: true,
            placement: 'bottom',
            content: readTemplate('form'),
        })
    }

    const closePopoverOf = (node: Element): void => {
        const popover = node.closest<HTMLElement>('.popover')
        if (!popover?.id) {
            return
        }
        root.querySelector<HTMLElement>('[aria-controls="' + popover.id + '"]')?.click()
    }

    const onDocumentClick = (event: Event): void => {
        const target = event.target
        if (!(target instanceof Element)) {
            return
        }

        const menuItem = target.closest<HTMLElement>('[data-ov-menu-action]')
        if (menuItem) {
            const note = root.querySelector<HTMLElement>('[data-ov-menu-note]')
            if (note) {
                note.textContent = '已选择：' + (menuItem.textContent ?? '').trim()
            }
            return
        }

        const groupAction = target.closest<HTMLElement>('[data-ov-group-action]')
        if (groupAction) {
            const note = root.querySelector<HTMLElement>('[data-ov-group-note]')
            if (note) {
                note.textContent = '工单已' + (groupAction.dataset.ovGroupAction ?? '处理') + '，处理人：林澈。'
            }
            closePopoverOf(groupAction)
            return
        }

        const submit = target.closest<HTMLElement>('[data-ov-form-submit]')
        if (submit) {
            event.preventDefault()
            const popover = submit.closest<HTMLElement>('.popover')
            const input = popover?.querySelector<HTMLInputElement>('[data-ov-form-name]')
            const note = root.querySelector<HTMLElement>('[data-ov-form-note]')
            const name = input?.value.trim() ?? ''
            if (note) {
                note.textContent = name ? '已创建视图：' + name : '请先填写视图名称。'
            }
            if (name) {
                closePopoverOf(submit)
            }
        }
    }

    document.addEventListener('click', onDocumentClick)
    trackDispose(() => document.removeEventListener('click', onDocumentClick))
}
