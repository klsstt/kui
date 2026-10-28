import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 动效。
 * 所有示例默认静止：渲染完成后先把每张卡身上的 kui-anim* 类名记进快照，再从 DOM 里摘下；
 * 指针悬浮到触发区时按快照「摘类 → 强制回流 → 加类」播放一次，移出即复位，因此可以反复悬浮。
 * 事件委托绑在面板上，一张卡只算一次监听；加载动效不是 kui-anim，始终循环。
 */

/** 示例源码：悬浮触发 + 重播，与页内实现同一套「快照 → 摘类 → 回流 → 加类」 */
const hoverScript = (panel: string): string => `
const panel = document.querySelector('[data-mtn-panel="${panel}"]')
const grid = panel.querySelector('.kui-grid')

// 记录每张卡身上的 kui-anim* 类名，然后先摘掉：默认静止
const snapshots = new Map()
grid.querySelectorAll('[data-mtn-card]').forEach((card) => {
    const names = Array.from(card.classList).filter((name) => name.startsWith('kui-anim'))
    snapshots.set(card, names)
    card.classList.remove(...names)
})

// 摘类 → 强制回流 → 按快照加回，动画才会从头播
const play = (card) => {
    card.classList.remove(...Array.from(card.classList).filter((name) => name.startsWith('kui-anim')))
    void card.offsetWidth
    card.classList.add(...(snapshots.get(card) ?? []))
}

const stop = (card) => {
    card.classList.remove(...Array.from(card.classList).filter((name) => name.startsWith('kui-anim')))
}

// 一次监听覆盖整块面板；data-mtn-hover 标出触发区（单张卡或整组）
const targetsOf = (group) =>
    Array.from(group.matches('[data-mtn-card]') ? [group] : []).concat(Array.from(group.querySelectorAll('[data-mtn-card]')))

panel.addEventListener('mouseover', (event) => {
    const group = event.target.closest('[data-mtn-hover]')
    if (!group || (event.relatedTarget && group.contains(event.relatedTarget))) return
    targetsOf(group).forEach(play)
})

panel.addEventListener('mouseout', (event) => {
    const group = event.target.closest('[data-mtn-hover]')
    if (!group || (event.relatedTarget && group.contains(event.relatedTarget))) return
    targetsOf(group).forEach(stop)
})

panel.querySelector('[data-mtn-replay]').addEventListener('click', () => {
    grid.querySelectorAll('[data-mtn-card]').forEach(play)
})
`

const LOOP_SCRIPT = `
const panel = document.querySelector('[data-mtn-panel="loop"]')

const targetOf = (card) => card.querySelector('[data-mtn-card]')
const snapshots = new Map()
const looping = new Set()

panel.querySelectorAll('[data-mtn-loop-card]').forEach((card) => {
    const target = targetOf(card)
    const names = Array.from(target.classList).filter((name) => name.startsWith('kui-anim'))
    snapshots.set(target, names)
    target.classList.remove(...names)
})

// 摘类 → 强制回流 → 加回；循环中额外带上 --infinite
const play = (target, loop) => {
    const names = snapshots.get(target) ?? []
    target.classList.remove(...Array.from(target.classList).filter((name) => name.startsWith('kui-anim')))
    void target.offsetWidth
    target.classList.add(...(loop ? names.concat('kui-anim--infinite') : names))
}

const stop = (target) => {
    target.classList.remove(...Array.from(target.classList).filter((name) => name.startsWith('kui-anim')))
}

// 悬浮：循环中重开一轮，未循环时只播一次
panel.addEventListener('mouseover', (event) => {
    const card = event.target.closest('[data-mtn-loop-card]')
    if (!card || (event.relatedTarget && card.contains(event.relatedTarget))) return
    play(targetOf(card), looping.has(targetOf(card)))
})

panel.addEventListener('mouseout', (event) => {
    const card = event.target.closest('[data-mtn-loop-card]')
    if (!card || (event.relatedTarget && card.contains(event.relatedTarget))) return
    const target = targetOf(card)
    if (!looping.has(target)) stop(target)
})

// 按钮切循环状态
panel.addEventListener('click', (event) => {
    const button = event.target.closest('[data-mtn-loop]')
    if (!button) return
    const target = targetOf(button.closest('[data-mtn-loop-card]'))
    const playing = !looping.has(target)
    if (playing) {
        looping.add(target)
        play(target, true)
    } else {
        looping.delete(target)
        target.classList.remove('kui-anim--infinite')
    }
    button.setAttribute('aria-pressed', String(playing))
    button.querySelector('span').textContent = playing ? '停止循环播放' : '开始循环播放'
})

panel.querySelector('[data-mtn-replay]').addEventListener('click', () => {
    panel.querySelectorAll('[data-mtn-loop-card]').forEach((card) => {
        const target = targetOf(card)
        play(target, looping.has(target))
    })
})
`

const LOADING_SCRIPT = `
const toggle = document.querySelector('[data-mtn-swap]')
const skeleton = document.querySelector('[data-mtn-skeleton]')
const loaded = document.querySelector('[data-mtn-loaded]')

toggle.addEventListener('click', () => {
    const showLoaded = skeleton.hidden === false
    skeleton.hidden = showLoaded
    loaded.hidden = !showLoaded
    if (showLoaded) {
        loaded.classList.remove('kui-anim', 'kui-anim--slow', 'kui-anim--fade-up')
        void loaded.offsetWidth
        loaded.classList.add('kui-anim', 'kui-anim--slow', 'kui-anim--fade-up')
    }
    toggle.textContent = showLoaded ? '回到加载中' : '加载完成'
})
`

export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '动效用来交代两件事：元素从哪里来、状态怎么变。这一页把动效收敛成一组 .kui-anim 工具类：效果、时长、延迟、循环四个维度分别叠加，每个效果旁标出类名。示例默认静止，指针悬浮到卡片时才播放一次、移出即复位；基础效果统一 480ms，时长面板用内联变量演示 240 / 480 / 720ms。',
    tags: ['Motion', '.kui-anim', '--kui-anim-duration'],
})}

${callout(`
<div class="kui-stack kui-stack--tight">
    <strong>演示播放控制</strong>
    <p>示例默认静止，悬浮只负责把类名加回去。系统开启 <code>prefers-reduced-motion: reduce</code> 时，基础样式会把动画压到 0.01ms，这个开关会用内联 <code>animation-duration</code> / <code>animation-iteration-count</code> 临时覆盖成完整时长与循环次数，只作用于本页演示；关掉它即可回到系统的减弱动效策略。</p>
    <label class="form-check">
        <input type="checkbox" data-mtn-force checked>
        <span>播放动效（临时覆盖系统减弱动效）</span>
    </label>
    <span class="form-hint" data-mtn-reduce-state>系统偏好：检测中</span>
</div>
`)}

${sectionTitle('基础动效', '十个方向与形态共用一套时长与缓动；卡片默认静止，悬浮时播放一次，移出复位，再次悬浮重新播放。所有卡片统一加 .kui-anim--slow（480ms）。')}

${demo({
    title: '进入效果',
    desc: 'fade 系列只做位移与透明度的组合，zoom 改变缩放，flip 用 3D 透视，rotate 与 bounce 带一点回弹；全部只动 transform 与 opacity。卡片默认静止，鼠标悬浮时加回自己的 .kui-anim* 类播放一次（480ms），移出后移除；监听交给面板上的事件委托，不为每张卡重复绑定。',
    tags: ['.kui-anim--fade-up', '.kui-anim--flip-x', '.kui-anim--slow'],
    script: hoverScript('entry'),
    html: `
<div class="kui-stack" data-mtn-panel="entry">
    <div class="kui-grid" style="--kui-grid-min: 12rem">
        <div class="kui-board kui-anim kui-anim--slow kui-anim--fade" data-mtn-card data-mtn-hover><div class="kui-stack kui-stack--tight"><strong>fade</strong><code class="kui-inline-code kui-nowrap">.kui-anim--fade</code></div></div>
        <div class="kui-board kui-anim kui-anim--slow kui-anim--fade-up" data-mtn-card data-mtn-hover><div class="kui-stack kui-stack--tight"><strong>fade-up</strong><code class="kui-inline-code kui-nowrap">.kui-anim--fade-up</code></div></div>
        <div class="kui-board kui-anim kui-anim--slow kui-anim--fade-down" data-mtn-card data-mtn-hover><div class="kui-stack kui-stack--tight"><strong>fade-down</strong><code class="kui-inline-code kui-nowrap">.kui-anim--fade-down</code></div></div>
        <div class="kui-board kui-anim kui-anim--slow kui-anim--fade-left" data-mtn-card data-mtn-hover><div class="kui-stack kui-stack--tight"><strong>fade-left</strong><code class="kui-inline-code kui-nowrap">.kui-anim--fade-left</code></div></div>
        <div class="kui-board kui-anim kui-anim--slow kui-anim--fade-right" data-mtn-card data-mtn-hover><div class="kui-stack kui-stack--tight"><strong>fade-right</strong><code class="kui-inline-code kui-nowrap">.kui-anim--fade-right</code></div></div>
        <div class="kui-board kui-anim kui-anim--slow kui-anim--zoom" data-mtn-card data-mtn-hover><div class="kui-stack kui-stack--tight"><strong>zoom</strong><code class="kui-inline-code kui-nowrap">.kui-anim--zoom</code></div></div>
        <div class="kui-board kui-anim kui-anim--slow kui-anim--flip-x" data-mtn-card data-mtn-hover><div class="kui-stack kui-stack--tight"><strong>flip-x</strong><code class="kui-inline-code kui-nowrap">.kui-anim--flip-x</code></div></div>
        <div class="kui-board kui-anim kui-anim--slow kui-anim--flip-y" data-mtn-card data-mtn-hover><div class="kui-stack kui-stack--tight"><strong>flip-y</strong><code class="kui-inline-code kui-nowrap">.kui-anim--flip-y</code></div></div>
        <div class="kui-board kui-anim kui-anim--slow kui-anim--rotate" data-mtn-card data-mtn-hover><div class="kui-stack kui-stack--tight"><strong>rotate</strong><code class="kui-inline-code kui-nowrap">.kui-anim--rotate</code></div></div>
        <div class="kui-board kui-anim kui-anim--slow kui-anim--bounce" data-mtn-card data-mtn-hover><div class="kui-stack kui-stack--tight"><strong>bounce</strong><code class="kui-inline-code kui-nowrap">.kui-anim--bounce</code></div></div>
    </div>
    <div class="kui-cluster">
        <button type="button" class="btn btn-primary btn-sm" data-mtn-replay><i class="fa fa-repeat" aria-hidden="true"></i> 重播全部</button>
        <span class="kui-stat__label">默认静止；悬浮任意一张播放一次（480ms），移出复位，再悬浮可重复播放。</span>
    </div>
</div>`,
})}

${demo({
    title: '时长',
    desc: '三档时长：fast 240ms 给微交互，base 480ms 给进入与切换，slow 720ms 给强调与引导；同一屏不要混用超过两档。三张卡片默认静止，悬浮各自播放一次；类名仍是 --fast / 默认 / --slow，本页用内联 --kui-anim-duration 把三档调到 240 / 480 / 720ms，对比更直观。',
    stage: 'tinted',
    tags: ['--kui-anim-duration', '.kui-anim--fast', '.kui-anim--slow'],
    script: hoverScript('duration'),
    html: `
<div class="kui-stack" data-mtn-panel="duration">
    <div class="kui-grid kui-grid--md">
        <div class="kui-board kui-anim kui-anim--fast kui-anim--fade-up" data-mtn-card data-mtn-hover style="--kui-anim-duration: 240ms">
            <div class="kui-stack kui-stack--tight">
                <strong>fast · 240ms</strong>
                <code class="kui-inline-code kui-nowrap">.kui-anim--fast</code>
                <span class="kui-stat__label">悬停、按下、复制反馈；本页内联覆盖为 240ms</span>
            </div>
        </div>
        <div class="kui-board kui-anim kui-anim--fade-up" data-mtn-card data-mtn-hover style="--kui-anim-duration: 480ms">
            <div class="kui-stack kui-stack--tight">
                <strong>base · 480ms</strong>
                <code class="kui-inline-code kui-nowrap">.kui-anim</code>
                <span class="kui-stat__label">进入、展开与视图切换；本页内联 480ms</span>
            </div>
        </div>
        <div class="kui-board kui-anim kui-anim--slow kui-anim--fade-up" data-mtn-card data-mtn-hover style="--kui-anim-duration: 720ms">
            <div class="kui-stack kui-stack--tight">
                <strong>slow · 720ms</strong>
                <code class="kui-inline-code kui-nowrap">.kui-anim--slow</code>
                <span class="kui-stat__label">强调、引导与首次进入；本页内联覆盖为 720ms</span>
            </div>
        </div>
    </div>
    <div class="kui-cluster">
        <button type="button" class="btn btn-primary btn-sm" data-mtn-replay><i class="fa fa-repeat" aria-hidden="true"></i> 重播</button>
        <span class="kui-stat__label">悬浮单张看单档时长；点重播让三张同时开始，结束时间肉眼可辨。</span>
    </div>
</div>`,
})}

${demo({
    title: '延迟',
    desc: '四档延迟 80 / 160 / 240 / 320ms，用来做列表的错位进入；同一个列表里步长一致，整屏的等待不超过 320ms。指针移入这一组卡片时，四张按各自延迟依次出现；移出后复位，再次移入重新播放。',
    tags: ['.kui-anim--delay-1', '.kui-anim--delay-4', '--kui-anim-delay'],
    script: hoverScript('delay'),
    html: `
<div class="kui-stack" data-mtn-panel="delay">
    <div class="kui-grid kui-grid--sm" data-mtn-hover>
        <div class="kui-board kui-anim kui-anim--slow kui-anim--fade-up kui-anim--delay-1" data-mtn-card><div class="kui-stack kui-stack--tight"><strong>delay-1</strong><code class="kui-inline-code">80ms</code></div></div>
        <div class="kui-board kui-anim kui-anim--slow kui-anim--fade-up kui-anim--delay-2" data-mtn-card><div class="kui-stack kui-stack--tight"><strong>delay-2</strong><code class="kui-inline-code">160ms</code></div></div>
        <div class="kui-board kui-anim kui-anim--slow kui-anim--fade-up kui-anim--delay-3" data-mtn-card><div class="kui-stack kui-stack--tight"><strong>delay-3</strong><code class="kui-inline-code">240ms</code></div></div>
        <div class="kui-board kui-anim kui-anim--slow kui-anim--fade-up kui-anim--delay-4" data-mtn-card><div class="kui-stack kui-stack--tight"><strong>delay-4</strong><code class="kui-inline-code">320ms</code></div></div>
    </div>
    <div class="kui-cluster">
        <button type="button" class="btn btn-primary btn-sm" data-mtn-replay><i class="fa fa-repeat" aria-hidden="true"></i> 重播</button>
        <span class="kui-stat__label">延迟只影响开始时间，时长与缓动仍然一致；重播会按 80→320ms 的顺序再走一遍。</span>
    </div>
</div>`,
})}

${sectionTitle('交互与加载', '交互动效由指针触发，加载动效由状态触发；加载指示始终循环，不参与悬浮重播。')}

${demo({
    title: '交互动效',
    desc: '悬停抬起用 .kui-hover-lift（上移 3px 加一档阴影），按下回弹用 .kui-press（下移 1px 并轻微缩小）；两者都只过渡 transform 与阴影。系统要求减弱动效时，上方「播放动效」开关会临时恢复过渡时长。',
    stage: 'tinted',
    tags: ['.kui-hover-lift', '.kui-press'],
    html: `
<div class="kui-stack" data-mtn-panel="interaction">
    <div class="kui-grid kui-grid--md">
        <article class="kui-board kui-hover-lift kui-stack kui-stack--tight">
            <strong>悬停抬起</strong>
            <code class="kui-inline-code">.kui-hover-lift</code>
            <span class="kui-stat__label">把指针移到卡片上：上移 3px，阴影加深一档。</span>
        </article>
        <article class="kui-board kui-hover-lift kui-stack kui-stack--tight">
            <strong>可点击的入口</strong>
            <code class="kui-inline-code">.kui-hover-lift</code>
            <span class="kui-stat__label">只用在整块可点的卡片上，文字型操作不加。</span>
        </article>
    </div>
    <div class="kui-board kui-stack kui-stack--tight">
        <code class="kui-inline-code">.kui-press</code>
        <div class="kui-cluster">
            <button type="button" class="btn btn-primary kui-press">按住看回弹</button>
            <button type="button" class="btn btn-default kui-press">次要操作</button>
            <span class="kui-stat__label">按下时整体下沉 1px 并缩到 0.99，松开立即回到原位。</span>
        </div>
    </div>
</div>`,
})}

${demo({
    title: '加载动效',
    desc: '三点脉冲用于按钮与行内等待，环形旋转用于区块加载，骨架屏只表达结构占位；三者都自带循环，不需要再加 --infinite，也不会被悬浮逻辑停掉。切换按钮把骨架屏换成真实内容并淡入（480ms）。',
    tags: ['.kui-loading-dots', '.kui-loading-ring', '.kui-skeleton'],
    script: LOADING_SCRIPT,
    html: `
<div class="kui-stack" data-mtn-panel="loading">
    <div class="kui-grid kui-grid--sm">
        <div class="kui-board kui-stack kui-stack--tight">
            <span class="kui-loading-dots" role="status" aria-label="加载中"><i></i><i></i><i></i></span>
            <code class="kui-inline-code">.kui-loading-dots</code>
            <span class="kui-stat__label">按钮与行内等待，三点持续脉冲</span>
        </div>
        <div class="kui-board kui-stack kui-stack--tight">
            <span class="kui-loading-ring" role="status" aria-label="加载中"></span>
            <code class="kui-inline-code">.kui-loading-ring</code>
            <span class="kui-stat__label">区块与列表加载，环形持续旋转</span>
        </div>
        <div class="kui-board kui-stack kui-stack--tight">
            <div class="kui-cluster" data-mtn-skeleton>
                <span class="kui-skeleton kui-skeleton--avatar"></span>
                <div class="kui-stack kui-stack--tight kui-w-full">
                    <span class="kui-skeleton kui-skeleton--title"></span>
                    <span class="kui-skeleton kui-skeleton--text"></span>
                    <span class="kui-skeleton kui-skeleton--text"></span>
                </div>
            </div>
            <div class="kui-cluster" data-mtn-loaded hidden style="display: flex; flex-wrap: wrap; align-items: center; gap: var(--kui-space-3);">
                <span class="kui-avatar kui-avatar--primary">林</span>
                <div class="kui-stack kui-stack--tight">
                    <span class="kui-list__title">林澈 · 运营负责人</span>
                    <span class="kui-stat__label">已加载 12 个字段</span>
                </div>
            </div>
            <code class="kui-inline-code">.kui-skeleton</code>
            <span class="kui-stat__label">骨架屏持续扫光，只表达结构，不做闪烁装饰</span>
        </div>
    </div>
    <div class="kui-cluster">
        <button type="button" class="btn btn-default btn-sm" data-mtn-swap>加载完成</button>
        <span class="kui-stat__label">骨架屏与真实内容占同样的高度，切换时卡片不跳动。</span>
    </div>
</div>`,
})}

${demo({
    title: '循环与停止',
    desc: '循环默认不播放：点「开始循环播放」给目标加上 --infinite，按钮文字随状态在开始 / 停止之间切换；不循环时悬浮卡片会先播一次（480ms），移出复位，循环中则重新开始一轮。pulse 与 float 表达「还在动」，spin 用线性旋转，swing 用往返摆动。',
    stage: 'tinted',
    tags: ['.kui-anim--infinite', '.kui-anim--alternate', '.kui-anim--spin'],
    script: LOOP_SCRIPT,
    html: `
<div class="kui-stack" data-mtn-panel="loop">
    <div class="kui-grid" style="--kui-grid-min: 18rem">
        <div class="kui-board kui-stack kui-stack--tight" data-mtn-loop-card data-mtn-hover>
            <div class="kui-board kui-anim kui-anim--slow kui-anim--pulse" data-mtn-card style="display: grid; place-items: center; min-height: 4.5rem; padding: var(--kui-space-2);"><strong>pulse</strong></div>
            <code class="kui-inline-code">.kui-anim--pulse + --slow</code>
            <div class="kui-cluster"><button type="button" class="btn btn-default btn-sm" data-mtn-loop aria-pressed="false"><span>开始循环播放</span></button></div>
        </div>
        <div class="kui-board kui-stack kui-stack--tight" data-mtn-loop-card data-mtn-hover>
            <div class="kui-board kui-anim kui-anim--slow kui-anim--float" data-mtn-card style="display: grid; place-items: center; min-height: 4.5rem; padding: var(--kui-space-2);"><strong>float</strong></div>
            <code class="kui-inline-code">.kui-anim--float + --slow</code>
            <div class="kui-cluster"><button type="button" class="btn btn-default btn-sm" data-mtn-loop aria-pressed="false"><span>开始循环播放</span></button></div>
        </div>
        <div class="kui-board kui-stack kui-stack--tight" data-mtn-loop-card data-mtn-hover>
            <div class="kui-board" style="display: grid; place-items: center; min-height: 4.5rem; padding: var(--kui-space-2);"><i class="fa fa-refresh kui-anim kui-anim--slow kui-anim--spin" data-mtn-card aria-hidden="true" style="font-size: 28px;"></i></div>
            <code class="kui-inline-code">.kui-anim--spin + --slow</code>
            <div class="kui-cluster"><button type="button" class="btn btn-default btn-sm" data-mtn-loop aria-pressed="false"><span>开始循环播放</span></button></div>
        </div>
        <div class="kui-board kui-stack kui-stack--tight" data-mtn-loop-card data-mtn-hover>
            <div class="kui-board kui-anim kui-anim--slow kui-anim--swing kui-anim--alternate" data-mtn-card style="display: grid; place-items: center; min-height: 4.5rem; padding: var(--kui-space-2);"><strong>swing</strong></div>
            <code class="kui-inline-code">.kui-anim--swing + --slow</code>
            <div class="kui-cluster"><button type="button" class="btn btn-default btn-sm" data-mtn-loop aria-pressed="false"><span>开始循环播放</span></button></div>
        </div>
    </div>
    <div class="kui-cluster">
        <button type="button" class="btn btn-primary btn-sm" data-mtn-replay><i class="fa fa-repeat" aria-hidden="true"></i> 重播</button>
        <span class="kui-stat__label">循环动效同时出现不超过两处，超过就变成干扰；停止后动画保留终态。</span>
    </div>
</div>`,
})}

${callout('所有动效都必须被 <code>prefers-reduced-motion: reduce</code> 覆盖：基础样式把过渡与动画时长压到 0.01ms、循环次数改为 1。本页为了让示例仍可观察，默认打开上方「播放动效」开关，用内联 <code>animation-duration</code> / <code>animation-iteration-count</code> 临时覆盖；关闭开关后恢复系统策略，覆盖只作用于本页演示。', 'warning')}

${propsTable([
    { name: '.kui-anim', type: 'class', defaultValue: '—', desc: '动效基类：注册时长、延迟、缓动与 fill-mode，必须与效果类同时使用。' },
    { name: '--kui-anim-duration', type: 'time', defaultValue: '180ms', desc: '单次时长；本页示例统一 480ms，时长面板用内联变量演示 240 / 480 / 720ms。' },
    { name: '--kui-anim-delay', type: 'time', defaultValue: '0ms', desc: '开始延迟，由 delay-1…4 覆盖。' },
    { name: '--kui-anim-distance', type: 'length', defaultValue: '12px', desc: 'fade 系列的位移距离。' },
    { name: '--kui-anim-ease', type: 'easing', defaultValue: 'cubic-bezier(.22,.61,.36,1)', desc: '统一缓动；spin 与 shimmer 改用 linear。' },
    { name: '.kui-anim--fade / -up / -down / -left / -right', type: 'class', defaultValue: '—', desc: '透明度与位移组合的进入效果。' },
    { name: '.kui-anim--zoom / -zoom-out / -flip-x / -flip-y / -rotate / -bounce', type: 'class', defaultValue: '—', desc: '缩放、3D 翻转、旋转与回弹。' },
    { name: '.kui-anim--shake / -pulse / -float / -swing / -spin', type: 'class', defaultValue: '—', desc: '强调与循环形态；spin 使用线性缓动，其余沿用统一缓动。' },
    { name: '.kui-anim--fast / -slow', type: 'class', defaultValue: '—', desc: '时长修饰：--fast 取 fast 令牌（120ms），--slow 固定 480ms；本页时长面板用内联变量演示 240 / 480 / 720ms。' },
    { name: '.kui-anim--delay-1 … -4', type: 'class', defaultValue: '0ms', desc: '延迟：80 / 160 / 240 / 320ms。' },
    { name: '.kui-anim--infinite', type: 'class', defaultValue: '1', desc: '把循环次数改为无限；循环示例的按钮就是切换这个类。' },
    { name: '.kui-anim--alternate', type: 'class', defaultValue: 'normal', desc: '往返播放，常与 infinite 组合。' },
    { name: '.kui-hover-lift', type: 'class', defaultValue: '—', desc: '悬停上移 3px 并加深阴影，过渡 180ms。' },
    { name: '.kui-press', type: 'class', defaultValue: '—', desc: '按下时下移 1px 并缩到 0.99。' },
    { name: '.kui-loading-dots / .kui-loading-ring', type: 'class', defaultValue: '—', desc: '三点脉冲与环形旋转，均自带无限循环，始终可见。' },
    { name: '.kui-skeleton / --text / --title / --avatar', type: 'class', defaultValue: '—', desc: '骨架屏底色与三种占位尺寸，自带 1.4s 循环。' },
    { name: 'prefers-reduced-motion', type: 'media query', defaultValue: 'no-preference', desc: '为 <code>reduce</code> 时跳过补间，直接给出终态；本页开关可临时覆盖，仅限演示。' },
])}

`

    /* ---------- 动效类快照：默认静止，播放时按快照加回 ---------- */

    const animClassesOf = (element: Element): string[] =>
        Array.from(element.classList).filter((name) => name.startsWith('kui-anim'))

    /** 每张卡第一次出现时记下的 kui-anim* 类名；后续所有播放都按它来 */
    const animSnapshots = new WeakMap<HTMLElement, string[]>()

    const snapshotAnim = (element: HTMLElement, classes?: string[]): void => {
        const names = classes ?? animClassesOf(element)
        if (names.length) {
            animSnapshots.set(element, [...names])
        }
    }

    const storedAnim = (element: HTMLElement): string[] => animSnapshots.get(element) ?? animClassesOf(element)

    const clearAnim = (element: HTMLElement): void => {
        element.classList.remove(...animClassesOf(element))
    }

    /** 循环状态由 --infinite 类本身表达，避免再维护一套状态 */
    const isLooping = (element: HTMLElement): boolean => element.classList.contains('kui-anim--infinite')

    /* ---------- 页面内播放覆盖：只影响本页示例 ---------- */

    const forceToggle = root.querySelector<HTMLInputElement>('[data-mtn-force]')
    const reduceState = root.querySelector<HTMLElement>('[data-mtn-reduce-state]')
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    /** 把 `480ms` / `0.48s` 这类值换算成毫秒，解析不了就用兜底值 */
    const timeToMs = (value: string, fallback: number): number => {
        const text = value.trim()
        const amount = Number.parseFloat(text)
        if (!Number.isFinite(amount)) {
            return fallback
        }
        return text.endsWith('s') && !text.endsWith('ms') ? amount * 1000 : amount
    }

    const clearPlaybackStyles = (element: HTMLElement): void => {
        element.style.removeProperty('animation-duration')
        element.style.removeProperty('animation-iteration-count')
        element.style.removeProperty('transition-duration')
        element.style.removeProperty('animation-delay')
    }

    /**
     * 每个元素自己的时长与延迟：优先读内联 --kui-anim-duration（时长面板），
     * 否则读修饰类换算出的计算值，不再把所有动画写死成 180ms。
     */
    const timingOf = (element: HTMLElement): { duration: number; delay: number } => {
        const styles = window.getComputedStyle(element)
        return {
            duration: timeToMs(styles.getPropertyValue('--kui-anim-duration'), 480),
            delay: timeToMs(styles.getPropertyValue('--kui-anim-delay'), 0),
        }
    }

    const applyPlayback = (): void => {
        const force = forceToggle?.checked ?? false

        root.querySelectorAll<HTMLElement>('.kui-anim').forEach((element) => {
            if (!force) {
                clearPlaybackStyles(element)
                return
            }
            const timing = timingOf(element)
            const iteration = isLooping(element) ? 'infinite' : '1'
            element.style.setProperty('animation-duration', `${timing.duration}ms`, 'important')
            element.style.setProperty('animation-delay', `${timing.delay}ms`, 'important')
            element.style.setProperty('animation-iteration-count', iteration, 'important')
        })

        root.querySelectorAll<HTMLElement>('.kui-hover-lift, .kui-press').forEach((element) => {
            if (force) {
                element.style.setProperty('transition-duration', '180ms', 'important')
            } else {
                element.style.removeProperty('transition-duration')
            }
        })

        const loaders: Array<[string, number]> = [
            ['.kui-loading-dots i', 1200],
            ['.kui-loading-ring', 720],
            ['.kui-skeleton', 1400],
        ]
        loaders.forEach(([selector, duration]) => {
            root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
                if (force) {
                    element.style.setProperty('animation-duration', `${duration}ms`, 'important')
                    element.style.setProperty('animation-iteration-count', 'infinite', 'important')
                } else {
                    element.style.removeProperty('animation-duration')
                    element.style.removeProperty('animation-iteration-count')
                }
            })
        })
    }

    const paintReduceState = (): void => {
        if (!reduceState) {
            return
        }
        const forced = forceToggle?.checked ?? false
        if (!reduceQuery.matches) {
            reduceState.textContent = '系统偏好：未开启减弱动效'
            return
        }
        reduceState.textContent = forced
            ? '系统偏好：减弱动效 · 已由开关临时覆盖（仅本页演示）'
            : '系统偏好：减弱动效 · 演示已按系统设置静止；打开开关可临时播放'
    }

    forceToggle?.addEventListener('change', () => {
        applyPlayback()
        paintReduceState()
    })
    reduceQuery.addEventListener('change', paintReduceState)
    paintReduceState()

    /* ---------- 播放：摘类 → 强制回流 → 按快照加回，动画才会从头开始 ---------- */

    const playAnim = (element: HTMLElement): void => {
        const names = storedAnim(element)
        if (!names.length) {
            return
        }
        const next = isLooping(element) && !names.includes('kui-anim--infinite') ? [...names, 'kui-anim--infinite'] : names
        clearAnim(element)
        void element.offsetWidth
        element.classList.add(...next)
    }

    const playAll = (targets: HTMLElement[]): void => {
        targets.forEach(playAnim)
        applyPlayback()
    }

    /** 移出复位：循环中的目标保留动画，其余回到静止 */
    const stopAll = (targets: HTMLElement[]): void => {
        targets.forEach((target) => {
            if (!isLooping(target)) {
                clearAnim(target)
            }
        })
        applyPlayback()
    }

    /** 一个触发区里的动效目标：触发区自己可能是卡片（entry / duration），也可能包着一组卡（delay / loop） */
    const targetsIn = (group: HTMLElement): HTMLElement[] => {
        const targets = group.matches('[data-mtn-card]') ? [group] : []
        group.querySelectorAll<HTMLElement>('[data-mtn-card]').forEach((element) => targets.push(element))
        return targets.filter((element) => storedAnim(element).length > 0)
    }

    /**
     * 悬浮事件委托：mouseover / mouseout 会冒泡，配合 relatedTarget 判断真正的进出，
     * 面板上只挂一次监听，卡片增删都不用重新绑定。
     */
    const hoverGroupOf = (panel: HTMLElement, event: MouseEvent): HTMLElement | null => {
        const target = event.target
        if (!(target instanceof Element)) {
            return null
        }
        const group = target.closest<HTMLElement>('[data-mtn-hover]')
        if (!group || !panel.contains(group)) {
            return null
        }
        const related = event.relatedTarget
        if (related instanceof Node && group.contains(related)) {
            return null
        }
        return group
    }

    const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-mtn-panel]'))

    panels.forEach((panel) => {
        panel.addEventListener('mouseover', (event) => {
            const group = hoverGroupOf(panel, event)
            if (group) {
                playAll(targetsIn(group))
            }
        })
        panel.addEventListener('mouseout', (event) => {
            const group = hoverGroupOf(panel, event)
            if (group) {
                stopAll(targetsIn(group))
            }
        })
        panel.querySelector<HTMLElement>('[data-mtn-replay]')?.addEventListener('click', () => {
            playAll(Array.from(panel.querySelectorAll<HTMLElement>('[data-mtn-card]')))
        })
    })

    /* ---------- 循环：按钮切换 --infinite，悬浮只重开一轮 ---------- */

    root.querySelectorAll<HTMLElement>('[data-mtn-loop]').forEach((button) => {
        button.addEventListener('click', () => {
            const card = button.closest<HTMLElement>('[data-mtn-loop-card]')
            const target = card?.querySelector<HTMLElement>('[data-mtn-card]')
            if (!target) {
                return
            }
            const playing = !isLooping(target)
            if (playing) {
                target.classList.add('kui-anim--infinite')
                playAnim(target)
            } else {
                target.classList.remove('kui-anim--infinite')
            }
            button.setAttribute('aria-pressed', String(playing))
            const label = button.querySelector('span')
            if (label) {
                label.textContent = playing ? '停止循环播放' : '开始循环播放'
            }
            applyPlayback()
        })
    })

    /* ---------- 骨架屏与真实内容互换：加载指示始终在跑 ---------- */

    const swap = root.querySelector<HTMLButtonElement>('[data-mtn-swap]')
    const skeleton = root.querySelector<HTMLElement>('[data-mtn-skeleton]')
    const loaded = root.querySelector<HTMLElement>('[data-mtn-loaded]')
    const loadedAnim = ['kui-anim', 'kui-anim--slow', 'kui-anim--fade-up']

    swap?.addEventListener('click', () => {
        const showLoaded = skeleton ? !skeleton.hidden : false
        if (skeleton) {
            skeleton.hidden = showLoaded
        }
        if (loaded) {
            loaded.hidden = !showLoaded
            if (showLoaded) {
                snapshotAnim(loaded, loadedAnim)
                clearAnim(loaded)
                void loaded.offsetWidth
                loaded.classList.add(...loadedAnim)
            }
        }
        swap.textContent = showLoaded ? '回到加载中' : '加载完成'
        applyPlayback()
    })

    /* ---------- 初始：记录并摘下全部 kui-anim* 类，卡片默认静止 ---------- */

    root.querySelectorAll<HTMLElement>('.kui-anim').forEach((element) => {
        snapshotAnim(element)
        clearAnim(element)
    })
    applyPlayback()
}
