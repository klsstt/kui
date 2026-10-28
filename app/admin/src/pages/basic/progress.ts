import { Progress, Switchery } from '@kui/core'
import { trackComponent, trackDispose } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 进度。
 * 进度条只回答一个问题：这件事走到哪一步了。尺寸表达粗细，语义色表达结果，
 * 条纹只在「仍在推进」时滚动；所有读数都由同一个数值驱动，不出现两套百分比。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '进度条把「已经完成多少」变成一眼可读的长度。这一页覆盖尺寸与语义色、独立的可拖动进度、登录验证滑块、数值检测、节点进度、竖向与圆形进度，以及控制条纹的滑块开关。登录验证只有一条轨道和一个矩形滑块，不再与可拖动进度叠在一起。',
    tags: ['Progress', '.progress', '.progress-vertical', '登录验证'],
})}

${sectionTitle('尺寸与颜色', '高度表达位置，颜色表达结果；两者互相独立，可以任意组合。')}

${demo({
    title: '语义色 × 尺寸',
    desc: '四档高度（4 / 6 / 8 / 12px）配五种语义色：primary 表示进行中，success 表示已完成，warning 表示接近阈值，danger 表示已超限。',
    tags: ['.progress-xs', '.progress-bar-success'],
    html: `
<table class="table">
    <thead>
        <tr><th>语义</th><th>xs · 行内</th><th>sm · 工具栏</th><th>默认 · 正文</th><th>lg · 详情</th></tr>
    </thead>
    <tbody>
        <tr>
            <td><span class="badge badge-primary">primary</span></td>
            <td><div class="progress progress-xs"><div class="progress-bar" style="width: 24%"></div></div></td>
            <td><div class="progress progress-sm"><div class="progress-bar" style="width: 32%"></div></div></td>
            <td><div class="progress"><div class="progress-bar" style="width: 41%"></div></div></td>
            <td><div class="progress progress-lg"><div class="progress-bar" style="width: 56%"></div></div></td>
        </tr>
        <tr>
            <td><span class="badge badge-success">success</span></td>
            <td><div class="progress progress-xs"><div class="progress-bar progress-bar-success" style="width: 62%"></div></div></td>
            <td><div class="progress progress-sm"><div class="progress-bar progress-bar-success" style="width: 78%"></div></div></td>
            <td><div class="progress"><div class="progress-bar progress-bar-success" style="width: 100%"></div></div></td>
            <td><div class="progress progress-lg"><div class="progress-bar progress-bar-success" style="width: 86%"></div></div></td>
        </tr>
        <tr>
            <td><span class="badge badge-info">info</span></td>
            <td><div class="progress progress-xs"><div class="progress-bar progress-bar-info" style="width: 38%"></div></div></td>
            <td><div class="progress progress-sm"><div class="progress-bar progress-bar-info" style="width: 52%"></div></div></td>
            <td><div class="progress"><div class="progress-bar progress-bar-info" style="width: 64%"></div></div></td>
            <td><div class="progress progress-lg"><div class="progress-bar progress-bar-info" style="width: 72%"></div></div></td>
        </tr>
        <tr>
            <td><span class="badge badge-warning">warning</span></td>
            <td><div class="progress progress-xs"><div class="progress-bar progress-bar-warning" style="width: 71%"></div></div></td>
            <td><div class="progress progress-sm"><div class="progress-bar progress-bar-warning" style="width: 76%"></div></div></td>
            <td><div class="progress"><div class="progress-bar progress-bar-warning" style="width: 82%"></div></div></td>
            <td><div class="progress progress-lg"><div class="progress-bar progress-bar-warning" style="width: 88%"></div></div></td>
        </tr>
        <tr>
            <td><span class="badge badge-danger">danger</span></td>
            <td><div class="progress progress-xs"><div class="progress-bar progress-bar-danger" style="width: 84%"></div></div></td>
            <td><div class="progress progress-sm"><div class="progress-bar progress-bar-danger" style="width: 91%"></div></div></td>
            <td><div class="progress"><div class="progress-bar progress-bar-danger" style="width: 96%"></div></div></td>
            <td><div class="progress progress-lg"><div class="progress-bar progress-bar-danger" style="width: 100%"></div></div></td>
        </tr>
    </tbody>
</table>`,
})}

${sectionTitle('拖动与验证', '可拖动进度只演示数值联动；登录验证是另一块独立面板，轨道上只有一个矩形滑块。')}

${demo({
    title: '可拖动进度（单条轨道）',
    desc: '滑块本身就是进度条，没有第二条输出轨道；拖动时填充、滑块和读数同步。第二条展示同款条纹状态，用来表达“仍在推进”。',
    tags: ['input[type=range]', '--kui-progress-fill', 'progress-bar-striped'],
    script: `
document.querySelectorAll('[data-prg-drag]').forEach((range) => {
    const row = range.closest('[data-prg-drag-row]')
    const value = row?.querySelector('[data-prg-drag-value]')
    const paint = () => {
        range.style.setProperty('--kui-progress-fill', range.value + '%')
        if (value) value.textContent = range.value
    }
    range.addEventListener('input', paint)
    paint()
})
`,
    html: `
<div class="kui-board kui-stack">
    <div class="kui-stack kui-stack--tight" data-prg-drag-row>
        <div class="kui-cluster kui-justify-between">
            <span class="kui-list__title">十月复盘初稿</span>
            <span class="kui-mixed-type"><span data-prg-drag-value>35</span><small>%</small></span>
        </div>
        <input class="kui-progress-range" type="range" min="0" max="100" step="1" value="35" data-prg-drag aria-label="调整完成度">
        <p class="kui-stat__label">滑块即进度条：填充宽度、滑块位置与百分比读数来自同一个 value。</p>
    </div>
    <div class="kui-stack kui-stack--tight" data-prg-drag-row>
        <div class="kui-cluster kui-justify-between">
            <span class="kui-list__title">十月复盘初稿 · 条纹</span>
            <span class="kui-mixed-type"><span data-prg-drag-value>68</span><small>%</small></span>
        </div>
        <input class="kui-progress-range is-striped" type="range" min="0" max="100" step="1" value="68" data-prg-drag aria-label="调整条纹进度">
        <p class="kui-stat__label">条纹用于表达“仍在推进”，拖到 100% 时仍保持条纹但停止滚动。</p>
    </div>
</div>`,
})}

${sectionTitle('登录验证', '一块独立面板，一条尽量宽的轨道，上面只有一个可拖动矩形滑块。拖动时填充由灰渐变到绿；到终点轨道文字变成「验证成功」。')}

${demo({
    title: '登录验证滑块',
    desc: '只有一条轨道和一个矩形滑块：未到终点时轨道显示「拖动滑块完成验证」，拖到最右端后立刻变成「验证成功」，右侧徽章同步为「验证通过」。没有第二条进度条。',
    stage: 'tinted',
    tags: ['[role=slider]', 'pointer events', '灰 → 绿'],
    script: `
const track = document.querySelector<HTMLElement>('[data-prg-verify-track]')
const fill = document.querySelector<HTMLElement>('[data-prg-verify-fill]')
const thumb = document.querySelector<HTMLElement>('[data-prg-verify-thumb]')
const label = document.querySelector<HTMLElement>('[data-prg-verify-label]')
const badge = document.querySelector<HTMLElement>('[data-prg-verify-badge]')

if (track && fill && thumb && label) {
    let percent = 0
    let dragging = false
    let dragOffset = 0

    const paint = (value: number): void => {
        percent = Math.round(Math.min(100, Math.max(0, value)))
        const done = percent >= 100
        fill.style.clipPath = 'inset(0 ' + (100 - percent) + '% 0 0)'
        const usable = Math.max(1, track.clientWidth - 72)
        thumb.style.left = (4 + usable * percent / 100) + 'px'
        thumb.setAttribute('aria-valuenow', String(percent))
        thumb.setAttribute('aria-valuetext', done ? '验证成功' : '已完成 ' + percent + '%')
        label.textContent = done ? '验证成功' : '拖动滑块完成验证'
        label.style.color = done ? 'var(--kui-color-surface)' : 'var(--kui-color-text-muted)'
        if (badge) {
            badge.textContent = done ? '验证通过' : percent > 0 ? '拖动中' : '待验证'
            badge.classList.toggle('badge-success', done)
            badge.classList.toggle('badge-neutral', !done)
        }
    }

    const move = (clientX: number): void => {
        const rect = track.getBoundingClientRect()
        const usable = Math.max(1, rect.width - 72)
        paint((clientX - dragOffset - 32 - rect.left - 4) / usable * 100)
    }

    thumb.addEventListener('pointerdown', (event) => {
        dragging = true
        const rect = thumb.getBoundingClientRect()
        dragOffset = event.clientX - (rect.left + rect.width / 2)
        thumb.setPointerCapture(event.pointerId)
    })

    thumb.addEventListener('pointermove', (event) => {
        if (!dragging) return
        move(event.clientX)
    })

    thumb.addEventListener('pointerup', () => { dragging = false })
    thumb.addEventListener('pointercancel', () => { dragging = false })
    thumb.addEventListener('keydown', (event) => {
        if (event.key === 'End') paint(100)
        else if (event.key === 'Home') paint(0)
        else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') paint(percent + 5)
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') paint(percent - 5)
        else return
        event.preventDefault()
    })

    paint(0)
}
`,
    html: `
<div class="kui-board kui-stack">
    <div class="kui-cluster kui-justify-between">
        <div class="kui-stack kui-stack--tight">
            <span class="kui-list__title">安全验证</span>
            <span class="kui-stat__label">拖动滑块到最右侧完成验证</span>
        </div>
        <span class="badge badge-neutral" data-prg-verify-badge aria-live="polite">待验证</span>
    </div>
    <div data-prg-verify-track style="position: relative; width: 100%; min-width: min(480px, 100%); height: 48px; overflow: hidden; border-radius: 999px; background: var(--kui-color-surface-muted); box-shadow: inset 0 1px 2px color-mix(in srgb, var(--kui-color-text) 8%, transparent); user-select: none; touch-action: none;">
        <div data-prg-verify-fill aria-hidden="true" style="position: absolute; inset: 0; clip-path: inset(0 100% 0 0); background: linear-gradient(90deg, color-mix(in srgb, var(--kui-color-text-subtle) 45%, var(--kui-color-surface-muted)), var(--kui-color-success)); will-change: clip-path;"></div>
        <span data-prg-verify-label aria-live="polite" style="position: absolute; inset: 0; z-index: 1; display: grid; place-items: center; color: var(--kui-color-text-muted); font-size: var(--kui-font-size-component-control); font-weight: 500; letter-spacing: 0.02em; pointer-events: none; transition: color 120ms ease;">拖动滑块完成验证</span>
        <div data-prg-verify-thumb role="slider" tabindex="0" aria-label="拖动滑块完成验证" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="已完成 0%" style="position: absolute; top: 4px; left: 4px; z-index: 2; display: grid; width: 64px; height: 40px; place-items: center; border: 1px solid var(--kui-color-border); border-radius: 8px; background: var(--kui-color-surface); color: var(--kui-color-primary); box-shadow: 0 2px 6px color-mix(in srgb, var(--kui-color-text) 18%, transparent); cursor: grab; touch-action: none;">
            <i class="fa fa-angle-double-right" aria-hidden="true"></i>
        </div>
    </div>
    <p class="kui-stat__label">焦点移到滑块后，方向键每次 ±5%，End 直接到终点；拖回左侧会恢复「拖动滑块完成验证」。</p>
</div>`,
})}

${sectionTitle('读数与节点', '读数用等宽数字，节点用状态点；两者都不重复表达同一件事。')}

${demo({
    title: '数值检测',
    desc: '输入目标值与当前值，达成率、条宽与结论同时更新；超过目标时封顶 100%，并切换成「已达成」。',
    tags: ['tabular-nums', '.badge-success'],
    script: `
const target = document.querySelector<HTMLInputElement>('[data-prg-target]')
const current = document.querySelector<HTMLInputElement>('[data-prg-current]')
const detectBar = document.querySelector<HTMLElement>('[data-prg-detect-bar]')
const detectRate = document.querySelector<HTMLElement>('[data-prg-detect-rate]')
const detectBadge = document.querySelector<HTMLElement>('[data-prg-detect-badge]')

const syncDetect = (): void => {
    const goal = Number(target?.value ?? 0)
    const now = Number(current?.value ?? 0)
    const rate = goal > 0 ? Math.min(100, Math.max(0, (now / goal) * 100)) : 0
    const done = rate >= 100
    if (detectBar) {
        detectBar.style.width = rate + '%'
        detectBar.classList.toggle('progress-bar-success', done)
    }
    if (detectRate) detectRate.textContent = rate.toFixed(1) + '%'
    if (detectBadge) {
        detectBadge.textContent = done ? '已达成' : rate >= 80 ? '接近目标' : '进行中'
        detectBadge.classList.toggle('badge-success', done)
        detectBadge.classList.toggle('badge-warning', !done && rate >= 80)
        detectBadge.classList.toggle('badge-primary', !done && rate < 80)
    }
}

target?.addEventListener('input', syncDetect)
current?.addEventListener('input', syncDetect)
`,
    html: `
<div class="kui-board kui-stack">
    <div class="kui-grid kui-grid--sm kui-max-w-md">
        <label class="form-group">
            <span class="form-label">目标值</span>
            <input class="form-control" type="number" min="1" step="1" value="1200" data-prg-target>
        </label>
        <label class="form-group">
            <span class="form-label">当前值</span>
            <input class="form-control" type="number" min="0" step="1" value="780" data-prg-current>
        </label>
    </div>
    <div class="progress progress-lg"><div class="progress-bar" data-prg-detect-bar style="width: 65%"></div></div>
    <div class="kui-cluster kui-justify-between">
        <span class="kui-mixed-type">达成率 <strong data-prg-detect-rate>65.0%</strong></span>
        <span class="badge badge-primary" data-prg-detect-badge>进行中</span>
    </div>
    <p class="kui-stat__label">把当前值改到 1200 以上，结论会变成「已达成」，填充转为成功色。</p>
</div>`,
})}

${demo({
    title: '百分比文字与组件实例',
    desc: '读数写在轨道里时字号自动跟随高度；按钮调用 Progress 的 setValue()，条宽与文字由实例一起更新。',
    tags: ['Progress.getOrCreate', 'setValue()', '.progress-xl'],
    script: `
const track = document.querySelector<HTMLElement>('[data-prg-component]')
const progress = track ? Progress.getOrCreate(track, { value: 40 }) : null

document.querySelectorAll<HTMLButtonElement>('[data-prg-set]').forEach((button) => {
    button.addEventListener('click', () => {
        progress?.setValue(Number(button.dataset.prgSet ?? 0))
    })
})
`,
    html: `
<div class="kui-board kui-stack">
    <div class="kui-cluster">
        <button type="button" class="btn btn-default btn-sm" data-prg-set="40">40%</button>
        <button type="button" class="btn btn-default btn-sm" data-prg-set="70">70%</button>
        <button type="button" class="btn btn-default btn-sm" data-prg-set="100">100%</button>
        <span class="kui-stat__label">setValue() 同时更新宽度、aria-valuenow 与轨道文字</span>
    </div>
    <div class="progress progress-xl" data-kui-progress data-prg-component><div class="progress-bar progress-bar-info">40%</div></div>
    <div class="kui-stack kui-stack--tight">
        <div class="progress progress-xl"><div class="progress-bar" style="width: 62%">62%</div></div>
        <div class="progress progress-xl"><div class="progress-bar progress-bar-success" style="width: 86%">86%</div></div>
        <div class="progress progress-xl"><div class="progress-bar progress-bar-warning" style="width: 46%">46%</div></div>
    </div>
</div>`,
})}

${demo({
    title: '节点进度',
    desc: '五个节点只需一个当前值：当前节点高亮，之前的节点打勾，轨道百分比按节点位置换算。点击或按回车切换节点。',
    tags: ['.kui-steps', '.kui-step.is-process', 'is-finish'],
    script: `
const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-prg-node]'))
const nodeBar = document.querySelector<HTMLElement>('[data-prg-node-bar]')
const nodeBadge = document.querySelector<HTMLElement>('[data-prg-node-badge]')
let active = 2

const paint = (): void => {
    nodes.forEach((node, index) => {
        node.classList.toggle('is-finish', index < active)
        node.classList.toggle('is-process', index === active)
        const marker = node.querySelector('.kui-step__marker')
        if (marker) marker.innerHTML = index < active ? '<i class="fa fa-check" aria-hidden="true"></i>' : String(index + 1)
    })
    if (nodeBar) nodeBar.style.width = (active / (nodes.length - 1)) * 100 + '%'
    if (nodeBadge) nodeBadge.textContent = '第 ' + (active + 1) + ' / ' + nodes.length + ' 步'
}

nodes.forEach((node, index) => {
    node.addEventListener('click', () => {
        active = index
        paint()
    })
    node.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        active = index
        paint()
    })
})

paint()
`,
    html: `
<div class="kui-board kui-stack">
    <div class="kui-cluster kui-justify-between">
        <span class="kui-list__title">K-2481 · 订单流转</span>
        <span class="badge badge-primary" data-prg-node-badge>第 3 / 5 步</span>
    </div>
    <div class="progress progress-sm"><div class="progress-bar" data-prg-node-bar style="width: 50%"></div></div>
    <ol class="kui-steps">
        <li class="kui-step is-finish" data-prg-node="0" tabindex="0">
            <span class="kui-step__marker"><i class="fa fa-check" aria-hidden="true"></i></span>
            <span class="kui-step__content"><span class="kui-step__title">已下单</span><span class="kui-step__desc">09:24</span></span>
        </li>
        <li class="kui-step is-finish" data-prg-node="1" tabindex="0">
            <span class="kui-step__marker"><i class="fa fa-check" aria-hidden="true"></i></span>
            <span class="kui-step__content"><span class="kui-step__title">已支付</span><span class="kui-step__desc">09:31</span></span>
        </li>
        <li class="kui-step is-process" data-prg-node="2" tabindex="0">
            <span class="kui-step__marker">3</span>
            <span class="kui-step__content"><span class="kui-step__title">拣货中</span><span class="kui-step__desc">进行中</span></span>
        </li>
        <li class="kui-step" data-prg-node="3" tabindex="0">
            <span class="kui-step__marker">4</span>
            <span class="kui-step__content"><span class="kui-step__title">已发货</span><span class="kui-step__desc">预计明天</span></span>
        </li>
        <li class="kui-step" data-prg-node="4" tabindex="0">
            <span class="kui-step__marker">5</span>
            <span class="kui-step__content"><span class="kui-step__title">已签收</span><span class="kui-step__desc">待确认</span></span>
        </li>
    </ol>
    <p class="kui-stat__label">五个节点是同一件事的五个阶段，不再为每一步单独写一条进度条。</p>
</div>`,
})}

${sectionTitle('方向与开关', '横向放不下时立起来，整块数值用一个环表达；条纹由开关控制，不自动播放。')}

${demo({
    title: '竖向进度条',
    desc: '竖向进度固定 12px 宽、128px 高，填充用 height；适合横向空间紧张的看板与分栏。',
    stage: 'tinted',
    tags: ['.progress-vertical', 'height'],
    html: `
<div class="kui-board kui-stack">
    <div class="kui-cluster">
        <div class="kui-stack kui-stack--tight">
            <div class="progress progress-vertical"><div class="progress-bar" style="height: 82%"></div></div>
            <span class="kui-stat__label">周一</span>
            <span class="kui-mixed-type">82<small>%</small></span>
        </div>
        <div class="kui-stack kui-stack--tight">
            <div class="progress progress-vertical"><div class="progress-bar progress-bar-success" style="height: 64%"></div></div>
            <span class="kui-stat__label">周二</span>
            <span class="kui-mixed-type">64<small>%</small></span>
        </div>
        <div class="kui-stack kui-stack--tight">
            <div class="progress progress-vertical"><div class="progress-bar progress-bar-info" style="height: 91%"></div></div>
            <span class="kui-stat__label">周三</span>
            <span class="kui-mixed-type">91<small>%</small></span>
        </div>
        <div class="kui-stack kui-stack--tight">
            <div class="progress progress-vertical"><div class="progress-bar progress-bar-warning" style="height: 38%"></div></div>
            <span class="kui-stat__label">周四</span>
            <span class="kui-mixed-type">38<small>%</small></span>
        </div>
        <div class="kui-stack kui-stack--tight">
            <div class="progress progress-vertical"><div class="progress-bar progress-bar-danger" style="height: 100%"></div></div>
            <span class="kui-stat__label">周五</span>
            <span class="kui-mixed-type">100<small>%</small></span>
        </div>
    </div>
    <p class="kui-stat__label">五根柱子共用同一条基线，比较的是高度而不是颜色；颜色只在超过阈值时出现。</p>
</div>`,
})}

${demo({
    title: '圆形进度',
    desc: '环由 conic-gradient 画在头像容器上，中间再套一个表面色圆孔放读数；--kui-ring 是唯一的变量，±5% 按钮只改它。',
    tags: ['conic-gradient', '--kui-ring', '.kui-avatar'],
    script: `
const ring = document.querySelector<HTMLElement>('[data-prg-ring]')
const ringText = document.querySelector<HTMLElement>('[data-prg-ring-text]')
let value = 64

const paintRing = (): void => {
    ring?.style.setProperty('--kui-ring', String(value))
    if (ringText) ringText.textContent = String(value)
}

document.querySelector('[data-prg-ring-up]')?.addEventListener('click', () => {
    value = Math.min(100, value + 5)
    paintRing()
})

document.querySelector('[data-prg-ring-down]')?.addEventListener('click', () => {
    value = Math.max(0, value - 5)
    paintRing()
})
`,
    html: `
<div class="kui-board kui-cluster">
    <div class="kui-avatar" style="--kui-avatar-size: 108px; --kui-ring: 64; background: conic-gradient(var(--kui-color-primary) calc(var(--kui-ring) * 1%), var(--kui-color-surface-muted) 0)" data-prg-ring>
        <div class="kui-avatar kui-avatar--xl" style="--kui-avatar-size: 84px; background: var(--kui-color-surface)">
            <span class="kui-mixed-type"><span data-prg-ring-text>64</span><small>%</small></span>
        </div>
    </div>
    <div class="kui-stack kui-stack--tight">
        <span class="kui-list__title">季度目标完成度</span>
        <p class="kui-page-header__desc">环从 12 点方向顺时针增长，读数始终与环的角度一致。</p>
        <div class="kui-cluster">
            <button type="button" class="btn btn-default btn-icon btn-sm" data-prg-ring-down aria-label="减少 5%"><i class="fa fa-minus" aria-hidden="true"></i></button>
            <button type="button" class="btn btn-default btn-icon btn-sm" data-prg-ring-up aria-label="增加 5%"><i class="fa fa-plus" aria-hidden="true"></i></button>
            <span class="kui-stat__label">每次 ±5%，到 0 与 100 自动停住</span>
        </div>
    </div>
</div>`,
})}

${demo({
    title: '滑块开关',
    desc: '条纹只表达「仍在推进」：开关打开时条纹滚动，关掉后停在纯色。开关是 Switchery 实例，状态与动画类一一对应。',
    tags: ['Switchery', '.progress-bar-striped', '.active'],
    script: `
const stripeSwitch = document.querySelector<HTMLInputElement>('[data-prg-switch]')
const stripeBar = document.querySelector<HTMLElement>('[data-prg-stripe]')

if (stripeSwitch) {
    trackComponent(Switchery.getOrCreate(stripeSwitch, { color: 'var(--kui-color-primary)', secondaryColor: 'var(--kui-color-border)' }))
    stripeSwitch.addEventListener('change', () => {
        stripeBar?.classList.toggle('active', stripeSwitch.checked)
    })
}
`,
    html: `
<div class="kui-board kui-stack">
    <div class="kui-cluster kui-justify-between">
        <div class="kui-stack kui-stack--tight">
            <span class="kui-list__title">条纹动画</span>
            <span class="kui-stat__label">打开表示任务仍在推进，关掉表示已停在终态</span>
        </div>
        <input type="checkbox" data-prg-switch checked aria-label="条纹动画">
    </div>
    <div class="progress progress-lg"><div class="progress-bar progress-bar-info progress-bar-striped active" data-prg-stripe style="width: 72%"></div></div>
    <div class="progress progress-lg"><div class="progress-bar progress-bar-success progress-bar-striped" style="width: 48%"></div></div>
    <p class="kui-stat__label">第二根是静态条纹：只表示配额分段，不代表正在跑。</p>
</div>`,
})}

${callout('登录验证面板只有一条轨道：灰色到绿色的填充随矩形滑块展开，到达终点后轨道文字与原位徽章一起变成「验证成功 / 验证通过」。上面的可拖动进度是另一个独立示例，只演示 range 与读数联动，不再和登录验证叠在一起。')}

${propsTable([
    { name: 'data-kui-progress', type: 'attribute', defaultValue: '—', desc: '标记进度容器，<code>Progress.getOrCreate()</code> 用它找到实例。' },
    { name: 'value', type: 'number', defaultValue: 'min', desc: '当前值，按 <code>min</code>–<code>max</code> 折算成百分比。' },
    { name: 'min / max', type: 'number', defaultValue: '0 / 100', desc: '取值范围，默认直接使用百分比。' },
    { name: 'showText', type: 'boolean', defaultValue: 'false', desc: '在轨道内显示百分比；轨道文字非空时也会自动显示。' },
    { name: 'vertical', type: 'boolean', defaultValue: 'false', desc: '竖向渲染，等同于加 <code>.progress-vertical</code>。' },
    { name: '.progress-xs / -sm / -lg / -xl', type: 'class', defaultValue: '8px', desc: '轨道高度：4 / 6 / 12 / 18px。' },
    { name: '.progress-bar-*', type: 'class', defaultValue: 'primary', desc: 'success / info / warning / danger 四种语义填充。' },
    { name: '.progress-bar-striped', type: 'class', defaultValue: '—', desc: '斜条纹底图；叠加 <code>.active</code> 后开始滚动。' },
    { name: '.progress-group', type: 'class', defaultValue: '—', desc: '同一轨道内堆叠多段，圆角只在两端保留。' },
    { name: '.progress-vertical', type: 'class', defaultValue: '—', desc: '12px 宽、128px 高的竖向轨道，填充用 <code>height</code>。' },
    { name: 'setValue(value)', type: 'method', defaultValue: '—', desc: '更新当前值、<code>aria-valuenow</code> 与轨道文字，并触发 <code>kui:progress:change</code>。' },
    { name: '.progress-bar', type: 'class', defaultValue: '—', desc: '必须作为轨道唯一子元素，宽度或高度由实例写入。' },
    { name: '.kui-steps / .kui-step', type: 'class', defaultValue: '—', desc: '节点进度：<code>.is-finish</code> 表示已完成，<code>.is-process</code> 表示当前节点。' },
    { name: 'Switchery.getOrCreate(input, options)', type: 'method', defaultValue: '—', desc: '把复选框渲染成开关，<code>color</code> / <code>secondaryColor</code> 接受令牌变量。' },
])}

`

    /* ---------- 可拖动进度 ---------- */
    root.querySelectorAll<HTMLInputElement>('[data-prg-drag]').forEach((range) => {
        const row = range.closest('[data-prg-drag-row]')
        const value = row?.querySelector<HTMLElement>('[data-prg-drag-value]')
        const paint = (): void => {
            range.style.setProperty('--kui-progress-fill', range.value + '%')
            if (value) value.textContent = range.value
        }
        range.addEventListener('input', paint)
        paint()
    })

    /* ---------- 登录验证滑块 ---------- */
    const verifyTrack = root.querySelector<HTMLElement>('[data-prg-verify-track]')
    const verifyFill = root.querySelector<HTMLElement>('[data-prg-verify-fill]')
    const verifyThumb = root.querySelector<HTMLElement>('[data-prg-verify-thumb]')
    const verifyLabel = root.querySelector<HTMLElement>('[data-prg-verify-label]')
    const verifyBadge = root.querySelector<HTMLElement>('[data-prg-verify-badge]')

    if (verifyTrack && verifyFill && verifyThumb && verifyLabel) {
        const track = verifyTrack
        const fill = verifyFill
        const thumb = verifyThumb
        const label = verifyLabel
        const thumbWidth = 64
        const inset = 4
        let percent = 0
        let dragging = false
        let dragOffset = 0

        const paint = (value: number): void => {
            percent = Math.round(Math.min(100, Math.max(0, value)))
            const done = percent >= 100
            const usable = Math.max(1, track.clientWidth - thumbWidth - inset * 2)
            fill.style.clipPath = `inset(0 ${100 - percent}% 0 0)`
            thumb.style.left = `${inset + (usable * percent) / 100}px`
            thumb.setAttribute('aria-valuenow', String(percent))
            thumb.setAttribute('aria-valuetext', done ? '验证成功' : `已完成 ${percent}%`)
            label.textContent = done ? '验证成功' : '拖动滑块完成验证'
            label.style.color = done ? 'var(--kui-color-surface)' : 'var(--kui-color-text-muted)'
            if (verifyBadge) {
                verifyBadge.textContent = done ? '验证通过' : percent > 0 ? '拖动中' : '待验证'
                verifyBadge.classList.toggle('badge-success', done)
                verifyBadge.classList.toggle('badge-neutral', !done)
            }
        }

        const moveTo = (clientX: number): void => {
            const rect = track.getBoundingClientRect()
            const usable = Math.max(1, rect.width - thumbWidth - inset * 2)
            const left = clientX - dragOffset - thumbWidth / 2 - rect.left
            paint(((left - inset) / usable) * 100)
        }

        thumb.addEventListener('pointerdown', (event) => {
            dragging = true
            const rect = thumb.getBoundingClientRect()
            dragOffset = event.clientX - (rect.left + rect.width / 2)
            thumb.style.cursor = 'grabbing'
            thumb.focus()

            // 监听挂在 window 上，指针移出滑块后仍能持续拖动
            const onMove = (moveEvent: PointerEvent): void => {
                if (dragging) moveTo(moveEvent.clientX)
            }
            const onUp = (): void => {
                dragging = false
                thumb.style.cursor = 'grab'
                window.removeEventListener('pointermove', onMove)
            }
            window.addEventListener('pointermove', onMove)
            window.addEventListener('pointerup', onUp, { once: true })
            window.addEventListener('pointercancel', onUp, { once: true })
        })

        thumb.addEventListener('keydown', (event) => {
            let next = percent
            if (event.key === 'End') {
                next = 100
            } else if (event.key === 'Home') {
                next = 0
            } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                next += 5
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                next -= 5
            } else if (event.key === 'Enter' || event.key === ' ') {
                next = 100
            } else {
                return
            }
            event.preventDefault()
            paint(next)
        })

        const resizeObserver = new ResizeObserver(() => paint(percent))
        resizeObserver.observe(track)
        trackDispose(() => resizeObserver.disconnect())

        paint(0)
    }

    /* ---------- 数值检测 ---------- */
    const target = root.querySelector<HTMLInputElement>('[data-prg-target]')
    const current = root.querySelector<HTMLInputElement>('[data-prg-current]')
    const detectBar = root.querySelector<HTMLElement>('[data-prg-detect-bar]')
    const detectRate = root.querySelector<HTMLElement>('[data-prg-detect-rate]')
    const detectBadge = root.querySelector<HTMLElement>('[data-prg-detect-badge]')

    const syncDetect = (): void => {
        const goal = Number(target?.value ?? 0)
        const now = Number(current?.value ?? 0)
        const rate = goal > 0 ? Math.min(100, Math.max(0, (now / goal) * 100)) : 0
        const done = rate >= 100
        if (detectBar) {
            detectBar.style.width = `${rate}%`
            detectBar.classList.toggle('progress-bar-success', done)
        }
        if (detectRate) {
            detectRate.textContent = `${rate.toFixed(1)}%`
        }
        if (detectBadge) {
            detectBadge.textContent = done ? '已达成' : rate >= 80 ? '接近目标' : '进行中'
            detectBadge.classList.toggle('badge-success', done)
            detectBadge.classList.toggle('badge-warning', !done && rate >= 80)
            detectBadge.classList.toggle('badge-primary', !done && rate < 80)
        }
    }

    target?.addEventListener('input', syncDetect)
    current?.addEventListener('input', syncDetect)

    /* ---------- 百分比文字：Progress 实例 ---------- */
    const componentTrack = root.querySelector<HTMLElement>('[data-prg-component]')
    if (componentTrack) {
        const progress = Progress.getOrCreate(componentTrack, { value: 40 })
        trackComponent(progress)
        root.querySelectorAll<HTMLButtonElement>('[data-prg-set]').forEach((button) => {
            button.addEventListener('click', () => {
                progress.setValue(Number(button.dataset.prgSet ?? 0))
            })
        })
    }

    /* ---------- 节点进度 ---------- */
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-prg-node]'))
    const nodeBar = root.querySelector<HTMLElement>('[data-prg-node-bar]')
    const nodeBadge = root.querySelector<HTMLElement>('[data-prg-node-badge]')
    let activeNode = 2

    const paintNodes = (): void => {
        nodes.forEach((node, index) => {
            node.classList.toggle('is-finish', index < activeNode)
            node.classList.toggle('is-process', index === activeNode)
            const marker = node.querySelector<HTMLElement>('.kui-step__marker')
            if (marker) {
                marker.innerHTML =
                    index < activeNode
                        ? '<i class="fa fa-check" aria-hidden="true"></i>'
                        : String(index + 1)
            }
        })
        if (nodeBar && nodes.length > 1) {
            nodeBar.style.width = `${(activeNode / (nodes.length - 1)) * 100}%`
        }
        if (nodeBadge) {
            nodeBadge.textContent = `第 ${activeNode + 1} / ${nodes.length} 步`
        }
    }

    nodes.forEach((node, index) => {
        node.addEventListener('click', () => {
            activeNode = index
            paintNodes()
        })
        node.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') {
                return
            }
            event.preventDefault()
            activeNode = index
            paintNodes()
        })
    })

    paintNodes()

    /* ---------- 圆形进度 ---------- */
    const ring = root.querySelector<HTMLElement>('[data-prg-ring]')
    const ringText = root.querySelector<HTMLElement>('[data-prg-ring-text]')
    let ringValue = 64

    const paintRing = (): void => {
        ring?.style.setProperty('--kui-ring', String(ringValue))
        if (ringText) {
            ringText.textContent = String(ringValue)
        }
    }

    root.querySelector('[data-prg-ring-up]')?.addEventListener('click', () => {
        ringValue = Math.min(100, ringValue + 5)
        paintRing()
    })

    root.querySelector('[data-prg-ring-down]')?.addEventListener('click', () => {
        ringValue = Math.max(0, ringValue - 5)
        paintRing()
    })

    /* ---------- 滑块开关 ---------- */
    const stripeSwitch = root.querySelector<HTMLInputElement>('[data-prg-switch]')
    const stripeBar = root.querySelector<HTMLElement>('[data-prg-stripe]')
    if (stripeSwitch) {
        trackComponent(
            Switchery.getOrCreate(stripeSwitch, {
                color: 'var(--kui-color-primary)',
                secondaryColor: 'var(--kui-color-border)',
            }),
        )
        stripeSwitch.addEventListener('change', () => {
            stripeBar?.classList.toggle('active', stripeSwitch.checked)
        })
    }
}
