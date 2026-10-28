import { Steps } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 步骤条。
 * 步骤条把长流程拆成可以被快速觉察的阶段：当前节点高亮、已完成节点带对勾、
 * 失败节点单独着色。间距只由组件决定，页面不再为每个节点补 margin。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '步骤条把一个长流程拆成可以被快速觉察的阶段：当前节点高亮、已完成节点带对勾、失败节点单独着色。标记与文字之间的间距、节点之间的留白都由组件统一，页面只提供每一步的标题与描述。',
    tags: ['Steps', '.kui-steps', '.kui-step'],
})}

${demo({
    title: '横向步骤条',
    desc: '状态由 current 推导：之前是完成、当前是进行中、之后是等待；描述在横向够宽时显示，窄屏自动折成竖向。节点、连线与文字都落在板面 16px 内边距以内。',
    tags: ['.kui-steps', 'current', '.kui-step__desc'],
    script: `
document.querySelectorAll<HTMLElement>('[data-st-horizontal]').forEach((element) => {
    Steps.getOrCreate(element, {
        current: 1,
        items: [
            { title: '填写资料', description: '企业信息与联系人' },
            { title: '资质审核', description: '1 个工作日内完成' },
            { title: '签署合同', description: '线上签署' },
            { title: '开通账号', description: '自动创建管理员' },
        ],
    })
})
`,
    html: `
<div class="kui-board">
    <div data-st-horizontal></div>
</div>`,
})}

${demo({
    title: '竖向步骤条：描述较长时',
    desc: '描述超过一行、或需要带上时间与负责人时改为竖向：轴线落在标记下方，文字与标记之间保持同一段间距，长描述换行也不会挤压轴线。上下留白与横向示例一致。',
    tags: ['.kui-steps--vertical', 'direction', '长描述'],
    script: `
document.querySelectorAll<HTMLElement>('[data-st-vertical]').forEach((element) => {
    Steps.getOrCreate(element, {
        current: 2,
        direction: 'vertical',
        items: [
            { title: '提交申请', description: '已提交 · 10 月 24 日 09:12，系统已发送确认邮件给管理员。' },
            { title: '资料初审', description: '已通过 · 周昕 · 10 月 24 日 15:40，营业执照与备案主体一致。' },
            { title: '现场核验', description: '进行中 · 预计 10 月 28 日完成，核验项包括场地、设备与安全通道。' },
            { title: '开通账号', description: '核验通过后自动开通，管理员会收到包含初始密码的邮件。' },
        ],
    })
})
`,
    html: `
<div class="kui-board">
    <div data-st-vertical></div>
</div>`,
})}

${sectionTitle('尺寸与状态', '小尺寸放进面板内部，失败态单独着色；两者都不改变节点顺序。')}

${demo({
    title: '小尺寸：放进面板内部',
    desc: 'size 为 small 时隐藏描述、缩小标记与间距，只保留阶段名称；适合放在面板标题下方，说明当前数据处在哪一段。面板正文的 16px 内边距继续生效。',
    tags: ['.kui-steps--small', 'size: \'small\''],
    script: `
document.querySelectorAll<HTMLElement>('[data-st-small]').forEach((element) => {
    Steps.getOrCreate(element, {
        current: 2,
        size: 'small',
        clickable: false,
        items: [
            { title: '采集' },
            { title: '清洗' },
            { title: '入库' },
            { title: '校验' },
        ],
    })
})
`,
    html: `
<section class="panel">
    <div class="panel-heading">
        <h3 class="panel-title">数据同步</h3>
        <div class="panel-actions"><span class="badge badge-primary">进行中</span></div>
    </div>
    <div class="panel-body">
        <div data-st-small></div>
    </div>
</section>`,
})}

${demo({
    title: '失败态：问题节点单独着色',
    desc: '失败节点用 status: \'error\' 标出，前后步骤保持原状态；此时把 clickable 关掉，避免用户跳过问题节点继续下一步。节点与连接线仍保持在板面留白之内。',
    tags: ['status: \'error\'', '.is-error', 'clickable: false'],
    script: `
document.querySelectorAll<HTMLElement>('[data-st-error]').forEach((element) => {
    Steps.getOrCreate(element, {
        current: 1,
        clickable: false,
        items: [
            { title: '提交申请' },
            { title: '风控审核', status: 'error' },
            { title: '签署合同' },
            { title: '放款' },
        ],
    })
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-board">
        <div data-st-error></div>
    </div>
    <div class="alert alert-danger" role="alert">
        <i class="fa fa-exclamation-circle" aria-hidden="true"></i>
        <div>风控审核未通过：营业执照与备案主体不一致，请更新资料后重新提交。</div>
    </div>
</div>`,
})}

${demo({
    title: '可点击切换',
    desc: '允许回看已完成步骤时，节点可以获得焦点，用 Enter 或空格切换；切换通过 onChange 同步给页面，下方按钮调用同一个 goTo。切换只改当前节点，不改变板面留白。',
    tags: ['clickable', 'onChange', 'goTo()'],
    script: `
const readout = document.querySelector<HTMLElement>('[data-st-readout]')
const host = document.querySelector<HTMLElement>('[data-st-clickable]')
if (host) {
    const steps = Steps.getOrCreate(host, {
        current: 0,
        clickable: true,
        onChange: (index, item) => {
            if (readout) readout.textContent = '当前阶段：' + item.title
        },
        items: [
            { title: '填写资料' },
            { title: '资质审核' },
            { title: '签署合同' },
            { title: '开通账号' },
        ],
    })
    document.querySelector<HTMLElement>('[data-st-prev]')?.addEventListener('click', () => steps.prev())
    document.querySelector<HTMLElement>('[data-st-next]')?.addEventListener('click', () => steps.next())
}
`,
    html: `
<div class="kui-stack">
    <div class="kui-board">
        <div data-st-clickable></div>
    </div>
    <div class="kui-cluster">
        <button type="button" class="btn btn-default btn-sm" data-st-prev>上一步</button>
        <button type="button" class="btn btn-primary btn-sm" data-st-next>下一步</button>
        <span class="badge badge-neutral" data-st-readout>当前阶段：填写资料</span>
    </div>
</div>`,
})}

${callout('步骤条与时间线共用同一条轴线、同一套节点尺寸和留白：示例都把组件包进 <code>.kui-board</code>（内边距 16px），再由组件补上下留白，因此节点、连接线与文字距卡片边框都至少 16px。本页保持独立路由，不和时间线合并；视觉上两者只在「表达流程」与「表达历史」上不同。')}

${propsTable([
    { name: 'current', type: 'number', defaultValue: '0', desc: '当前步骤下标，决定完成 / 进行中 / 等待的推导。' },
    { name: 'items', type: 'StepItem[]', defaultValue: '[]', desc: '步骤数组，每项含 <code>title</code> 与可选 <code>description</code>、<code>icon</code>、<code>status</code>。' },
    { name: 'items[].status', type: 'string', defaultValue: '—', desc: '单独指定状态：<code>wait</code> / <code>process</code> / <code>finish</code> / <code>error</code>。' },
    { name: 'items[].icon', type: 'string', defaultValue: '—', desc: '用图标代替序号，取自 Font Awesome 4.7。' },
    { name: 'direction', type: 'string', defaultValue: 'horizontal', desc: '排列方向：<code>horizontal</code> / <code>vertical</code>；40rem 以下横向自动转竖向。' },
    { name: 'size', type: 'string', defaultValue: 'medium', desc: '<code>small</code> 时隐藏描述并缩小标记，用于面板内部。' },
    { name: 'clickable', type: 'boolean', defaultValue: 'true', desc: '是否允许点击切换步骤；只读流程应当设为 <code>false</code>。' },
    { name: 'onChange', type: 'function', defaultValue: '—', desc: '切换回调，参数为下标与步骤数据。' },
    { name: 'goTo(i) / next() / prev()', type: 'method', defaultValue: '—', desc: '按序号或相对位置切换，越界时自动收敛到首尾。' },
    { name: '.kui-step__marker', type: 'class', defaultValue: '—', desc: '节点标记：28px，small 时 22px；完成显示对勾，失败显示叉号。' },
    { name: '.kui-steps', type: 'class', defaultValue: '—', desc: '上下各留 8px，与板面的 16px 内边距叠加；节点、连线与文字因此不会贴边。' },
])}

`

    root.querySelectorAll<HTMLElement>('[data-st-horizontal]').forEach(element => {
        trackComponent(
            Steps.getOrCreate(element, {
                current: 1,
                items: [
                    { title: '填写资料', description: '企业信息与联系人' },
                    { title: '资质审核', description: '1 个工作日内完成' },
                    { title: '签署合同', description: '线上签署' },
                    { title: '开通账号', description: '自动创建管理员' }
                ]
            }),
        )
    })

    root.querySelectorAll<HTMLElement>('[data-st-vertical]').forEach(element => {
        trackComponent(
            Steps.getOrCreate(element, {
                current: 2,
                direction: 'vertical',
                items: [
                    { title: '提交申请', description: '已提交 · 10 月 24 日 09:12，系统已发送确认邮件给管理员。' },
                    { title: '资料初审', description: '已通过 · 周昕 · 10 月 24 日 15:40，营业执照与备案主体一致。' },
                    {
                        title: '现场核验',
                        description: '进行中 · 预计 10 月 28 日完成，核验项包括场地、设备与安全通道。'
                    },
                    { title: '开通账号', description: '核验通过后自动开通，管理员会收到包含初始密码的邮件。' }
                ]
            }),
        )
    })

    root.querySelectorAll<HTMLElement>('[data-st-small]').forEach(element => {
        trackComponent(
            Steps.getOrCreate(element, {
                current: 2,
                size: 'small',
                clickable: false,
                items: [{ title: '采集' }, { title: '清洗' }, { title: '入库' }, { title: '校验' }]
            }),
        )
    })

    root.querySelectorAll<HTMLElement>('[data-st-error]').forEach(element => {
        trackComponent(
            Steps.getOrCreate(element, {
                current: 1,
                clickable: false,
                items: [
                    { title: '提交申请' },
                    { title: '风控审核', status: 'error' },
                    { title: '签署合同' },
                    { title: '放款' }
                ]
            }),
        )
    })

    const stepsHost = root.querySelector<HTMLElement>('[data-st-clickable]')
    if (stepsHost) {
        const readout = root.querySelector<HTMLElement>('[data-st-readout]')
        const steps = Steps.getOrCreate(stepsHost, {
            current: 0,
            clickable: true,
            onChange: (_index, item) => {
                if (readout) {
                    readout.textContent = '当前阶段：' + item.title
                }
            },
            items: [{ title: '填写资料' }, { title: '资质审核' }, { title: '签署合同' }, { title: '开通账号' }]
        })
        trackComponent(steps)
        root.querySelector<HTMLElement>('[data-st-prev]')?.addEventListener('click', () => steps.prev())
        root.querySelector<HTMLElement>('[data-st-next]')?.addEventListener('click', () => steps.next())
    }
}
