import { Steps, type StepItem } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 提示输入。
 * 提示不是 placeholder，而是可以点选的候选答案：选中场景与语气后，
 * 草稿写进 textarea，用户在此基础上改写，步骤条记录走到哪一步。
 */

const STEP_ITEMS: StepItem[] = [
    { title: '选择场景', description: '决定这段内容说什么' },
    { title: '选择语气', description: '决定用什么口吻说' },
    { title: '确认内容', description: '在草稿上改写并确认' },
]

const SCENES: Record<string, { label: string; body: string }> = {
    launch: { label: '新品上市', body: '「秋季新品」将在 11 月 1 日上线，首周主推三款礼盒，门店与小程序同步开售。' },
    stock: { label: '库存预警', body: '华东仓 12 个 SKU 低于安全库存，建议本周内完成调拨，避免影响双十一预售。' },
    service: { label: '售后回访', body: '本月售后回访已覆盖 86% 的订单，其中 3 条反馈集中在配送时效，已转交供应链跟进。' },
}

const TONES: Record<string, { label: string; wrap: (body: string) => string }> = {
    calm: { label: '克制', wrap: (body) => body },
    warm: { label: '热情', wrap: (body) => '想第一时间和大家分享：' + body + ' 欢迎随时来聊。' },
    brief: { label: '简洁', wrap: (body) => '速报｜' + body },
}

export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '提示输入解决「用户不知道从哪写起」。把常见写法做成可点选的候选，点一下先把草稿放进输入框，用户只负责改写，而不是从空白开始。',
    tags: ['Steps', 'textarea', '提示选项'],
})}

${callout('提示是起点而不是答案：场景决定内容，语气决定说法，正文始终可以自由改写。没有选择提示时，确认按钮保持禁用，避免提交空内容。')}

${sectionTitle('按提示填写', '一条路径只有三步：选场景、选语气、确认并改写。步骤条只记录进度，不替用户做决定。')}

${demo({
    title: '按提示填写',
    desc: '场景与语气各是一组单选提示；每次点选都会重新组合草稿并把步骤条推进一格，确认后输出成稿。重新编辑草稿会收起上一次的结果。',
    tags: ['.kui-steps', 'aria-pressed', 'textarea'],
    script: `
const stepsElement = document.querySelector<HTMLElement>('[data-hint-steps]')!
const input = document.querySelector<HTMLTextAreaElement>('[data-hint-input]')!
const count = document.querySelector<HTMLElement>('[data-hint-count]')!
const path = document.querySelector<HTMLElement>('[data-hint-path]')!
const confirm = document.querySelector<HTMLButtonElement>('[data-hint-confirm]')!
const preview = document.querySelector<HTMLElement>('[data-hint-preview]')!
const buttons = Array.from(document.querySelectorAll<HTMLElement>('[data-hint]'))

const steps = Steps.getOrCreate(stepsElement, { current: 0, clickable: false, items: STEP_ITEMS })
const picked = { scene: '', tone: '' }

const compose = (): string => {
    const scene = SCENES[picked.scene]
    return scene ? (TONES[picked.tone] ?? TONES.calm).wrap(scene.body) : ''
}

const sync = (): void => {
    count.textContent = input.value.length + ' / 160'
    confirm.disabled = input.value.trim() === ''
    path.textContent = picked.scene
        ? '场景：' + SCENES[picked.scene].label + (picked.tone ? ' · 语气：' + TONES[picked.tone].label : '')
        : '尚未选择提示'
}

buttons.forEach((button) => {
    button.addEventListener('click', () => {
        picked[button.dataset.hintGroup as 'scene' | 'tone'] = button.dataset.hint ?? ''
        input.value = compose()
        preview.hidden = true
        steps.goTo(picked.tone ? 2 : 1)
        sync()
    })
})

input.addEventListener('input', () => {
    preview.hidden = true
    sync()
})

document.querySelector('[data-hint-confirm]')?.addEventListener('click', () => {
    const output = document.querySelector<HTMLElement>('[data-hint-output]')
    if (output) output.textContent = input.value
    preview.hidden = false
    steps.goTo(2)
})
`,
    html: `
<div class="kui-stack">
    <div data-hint-steps></div>
    <div class="form-section kui-stack">
        <div class="kui-stack kui-stack--tight">
            <span class="form-label">1 · 选择场景</span>
            <div class="kui-cluster">
                <button type="button" class="btn btn-outline btn-default btn-sm" data-hint-group="scene" data-hint="launch" aria-pressed="false">新品上市</button>
                <button type="button" class="btn btn-outline btn-default btn-sm" data-hint-group="scene" data-hint="stock" aria-pressed="false">库存预警</button>
                <button type="button" class="btn btn-outline btn-default btn-sm" data-hint-group="scene" data-hint="service" aria-pressed="false">售后回访</button>
            </div>
        </div>
        <div class="kui-stack kui-stack--tight">
            <span class="form-label">2 · 选择语气</span>
            <div class="kui-cluster">
                <button type="button" class="btn btn-outline btn-default btn-sm" data-hint-group="tone" data-hint="calm" aria-pressed="false">克制</button>
                <button type="button" class="btn btn-outline btn-default btn-sm" data-hint-group="tone" data-hint="warm" aria-pressed="false">热情</button>
                <button type="button" class="btn btn-outline btn-default btn-sm" data-hint-group="tone" data-hint="brief" aria-pressed="false">简洁</button>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label" for="hint-draft">3 · 确认内容</label>
            <textarea class="form-control" id="hint-draft" maxlength="160" data-hint-input placeholder="选择上面的提示后，这里会自动填入一段草稿"></textarea>
            <div class="kui-cluster kui-justify-between">
                <span class="form-hint" data-hint-count>0 / 160</span>
                <span class="form-hint" data-hint-path>尚未选择提示</span>
            </div>
        </div>
        <div class="kui-cluster kui-justify-between">
            <span class="form-hint">提示只是起点，正文可以自由改写。</span>
            <div class="kui-cluster">
                <button type="button" class="btn btn-default" data-hint-reset>
                    <i class="fa fa-times" aria-hidden="true"></i> 清空
                </button>
                <button type="button" class="btn btn-primary" data-hint-confirm disabled>确认内容</button>
            </div>
        </div>
    </div>
    <div class="panel" data-hint-preview hidden>
        <div class="panel-heading">
            <h3 class="panel-title">生成结果</h3>
            <span class="badge badge-success">已确认</span>
        </div>
        <div class="panel-body"><p data-hint-output></p></div>
    </div>
</div>`,
})}

${sectionTitle('提示选项的形态', '提示不是一段说明文字，而是可点选的候选；形态只决定密度，不改变「点一下填一段」的行为。')}

${demo({
    title: '三种候选形态',
    desc: '短提示用 chip、并列选项用表单控件、需要解释的提示用带描述的列表；同一屏只选一种。',
    tags: ['.chip', '.form-check', '.kui-list'],
    stage: 'grid',
    html: `
<div class="kui-stack kui-stack--tight">
    <span class="form-hint">chip：最短的一句</span>
    <div class="kui-cluster">
        <span class="chip is-active">已发货</span>
        <span class="chip">待发货</span>
        <span class="chip">已签收</span>
    </div>
</div>
<div class="kui-stack kui-stack--tight">
    <span class="form-hint">form-check：互斥选项</span>
    <label class="form-check"><input type="radio" name="hint-tone" checked> 克制</label>
    <label class="form-check"><input type="radio" name="hint-tone"> 热情</label>
</div>
<div class="kui-stack kui-stack--tight">
    <span class="form-hint">列表：需要一句解释</span>
    <ul class="kui-list kui-list--flush">
        <li class="kui-list__item is-active">
            <span class="kui-list__body">
                <span class="kui-list__title">库存预警</span>
                <span class="kui-list__meta">适合发给供应链与门店</span>
            </span>
        </li>
    </ul>
</div>`,
})}

${sectionTitle('成稿示例', '同一段提示，经过用户改写后可以更具体：保留结论与时间，补上对象和下一步动作。')}

${demo({
    title: '从草稿到成稿',
    desc: '左侧是提示自动拼出的草稿，右侧是改写后的成稿；差异只在补充了门店数量与行动入口，结构没有被推翻。',
    stage: 'grid',
    tags: ['草稿', '改写', '成稿'],
    html: `
<article class="form-section kui-stack kui-stack--tight">
    <div class="kui-cluster"><span class="badge badge-neutral">提示草稿 · 热情</span></div>
    <h3 class="form-section__title">秋季新品即将上线</h3>
    <p class="form-hint">想第一时间和大家分享：「秋季新品」将在 11 月 1 日上线，首周主推三款礼盒，门店与小程序同步开售。 欢迎随时来聊。</p>
    <span class="form-hint">来源：新品上市 + 热情</span>
</article>
<article class="form-section kui-stack kui-stack--tight">
    <div class="kui-cluster"><span class="badge badge-success">改写后</span></div>
    <h3 class="form-section__title">秋季新品 11 月 1 日上线</h3>
    <p class="form-hint">华东 12 家门店与小程序将同步开售，首周主推三款礼盒。门店陈列物料已到位，欢迎到店体验。</p>
    <div class="kui-cluster">
        <span class="badge badge-primary">门店</span>
        <span class="badge badge-primary">小程序</span>
        <span class="badge badge-primary">11 月 1 日</span>
    </div>
</article>`,
})}

${propsTable([
    { name: 'items', type: 'StepItem[]', defaultValue: '[]', desc: '步骤数据：title、可选 description、icon 与 status。' },
    { name: 'current', type: 'number', defaultValue: '0', desc: '当前步骤下标，之前的步骤自动标记为完成。' },
    { name: 'clickable', type: 'boolean', defaultValue: 'true', desc: '是否允许点击步骤跳转；引导类流程通常关闭。' },
    { name: 'direction / size', type: 'horizontal | vertical / small | medium', defaultValue: 'horizontal / medium', desc: '排布方向与尺寸，小尺寸隐藏说明文案。' },
    { name: 'goTo() / next() / prev()', type: 'method', desc: '由业务按钮驱动步骤推进，示例里点选提示后调用 goTo。' },
    { name: '.kui-step.is-process / .is-finish', type: 'class', desc: '当前步骤与已完成步骤的状态类，轴线段落随状态变色。' },
    { name: '.kui-steps--vertical / --small', type: 'class', desc: '竖向排布与小尺寸的根类名。' },
    { name: 'aria-current="step"', type: 'attribute', desc: '当前步骤自动输出，读屏会朗读为「当前步骤」。' },
])}

`

    const stepsElement = root.querySelector<HTMLElement>('[data-hint-steps]')
    const steps = stepsElement ? Steps.getOrCreate(stepsElement, { current: 0, clickable: false, items: STEP_ITEMS }) : null
    if (steps) {
        trackComponent(steps)
    }

    const input = root.querySelector<HTMLTextAreaElement>('[data-hint-input]')
    const count = root.querySelector<HTMLElement>('[data-hint-count]')
    const path = root.querySelector<HTMLElement>('[data-hint-path]')
    const output = root.querySelector<HTMLElement>('[data-hint-output]')
    const preview = root.querySelector<HTMLElement>('[data-hint-preview]')
    const confirm = root.querySelector<HTMLButtonElement>('[data-hint-confirm]')
    const buttons = Array.from(root.querySelectorAll<HTMLElement>('[data-hint]'))
    const picked = { scene: '', tone: '' }

    const sync = (): void => {
        if (input && count) {
            count.textContent = `${input.value.length} / 160`
        }
        if (input && confirm) {
            confirm.disabled = input.value.trim() === ''
        }
        if (path) {
            path.textContent = picked.scene
                ? `场景：${SCENES[picked.scene].label}${picked.tone ? ` · 语气：${TONES[picked.tone].label}` : ''}`
                : '尚未选择提示'
        }
    }

    const compose = (): string => {
        const scene = SCENES[picked.scene]
        return scene ? (TONES[picked.tone] ?? TONES.calm).wrap(scene.body) : ''
    }

    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            const group = button.dataset.hintGroup === 'tone' ? 'tone' : 'scene'
            picked[group] = button.dataset.hint ?? ''
            root.querySelectorAll<HTMLElement>(`[data-hint-group="${group}"]`).forEach((item) => {
                const active = item === button
                item.classList.toggle('btn-primary', active)
                item.classList.toggle('btn-outline', !active)
                item.classList.toggle('btn-default', !active)
                item.setAttribute('aria-pressed', String(active))
            })
            if (input) {
                input.value = compose()
            }
            if (preview) {
                preview.hidden = true
            }
            steps?.goTo(picked.tone ? 2 : 1)
            sync()
        })
    })

    input?.addEventListener('input', () => {
        if (preview) {
            preview.hidden = true
        }
        sync()
    })

    root.querySelector<HTMLElement>('[data-hint-reset]')?.addEventListener('click', () => {
        picked.scene = ''
        picked.tone = ''
        if (input) {
            input.value = ''
        }
        if (preview) {
            preview.hidden = true
        }
        buttons.forEach((button) => {
            button.className = 'btn btn-outline btn-default btn-sm'
            button.setAttribute('aria-pressed', 'false')
        })
        steps?.goTo(0)
        sync()
    })

    confirm?.addEventListener('click', () => {
        if (!input || !input.value.trim()) {
            return
        }
        if (output) {
            output.textContent = input.value
        }
        if (preview) {
            preview.hidden = false
        }
        steps?.goTo(2)
    })

    sync()
}
