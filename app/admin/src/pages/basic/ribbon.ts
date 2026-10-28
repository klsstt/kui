import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 缎带。
 * 缎带是贴在容器角落或边缘的状态标记，面积很小、层级很高：
 * 一个容器只放一条，用来回答「这份内容处于什么阶段」，而不是再讲一遍标题。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '缎带把「推荐、已归档、限时」这类整体状态压在容器边缘上，不占据正文空间。这一页给出角标、顶部条幅与侧边飘带三种形态，每一种都放进真实卡片里，并验证侧边飘带改成竖排贴左之后不再压住文字。',
    tags: ['Ribbon', '.kui-ribbon'],
})}

${sectionTitle('角标', '角标贴在右上角，旋转 45° 后只占 92px 见方；四种配色对应四种阶段。')}

${demo({
    title: '商品卡上的角标',
    desc: '角标与价格卡天然成对：推荐、已通过、待补齐、已停用各占一种颜色，同一条卡片里不再出现第二个状态标记。',
    tags: ['.kui-ribbon__corner', '.is-success', '.is-neutral'],
    html: `
<div class="kui-grid kui-grid--md">
    <article class="kui-ribbon kui-board kui-shortcut">
        <div class="kui-ribbon__corner"><span>推荐</span></div>
        <span class="kui-stat__icon"><i class="fa fa-cube" aria-hidden="true"></i></span>
        <strong>标准版</strong>
        <small>适合 10 人以下的团队，含基础看板与导出。</small>
        <p class="kui-stat__value">268<small>元 / 月</small></p>
    </article>
    <article class="kui-ribbon kui-board kui-shortcut">
        <div class="kui-ribbon__corner"><span class="is-success">已通过</span></div>
        <span class="kui-stat__icon"><i class="fa fa-check" aria-hidden="true"></i></span>
        <strong>年度预算</strong>
        <small>财务与业务双方确认，流程已归档。</small>
        <p class="kui-stat__value">42<small>万元</small></p>
    </article>
    <article class="kui-ribbon kui-board kui-shortcut">
        <div class="kui-ribbon__corner"><span class="is-warning">待补齐</span></div>
        <span class="kui-stat__icon"><i class="fa fa-exclamation-triangle" aria-hidden="true"></i></span>
        <strong>供应商准入</strong>
        <small>还缺资质扫描件与联系人授权书。</small>
        <p class="kui-stat__value">2<small>项待办</small></p>
    </article>
    <article class="kui-ribbon kui-board kui-shortcut">
        <div class="kui-ribbon__corner"><span class="is-danger">已停用</span></div>
        <span class="kui-stat__icon"><i class="fa fa-ban" aria-hidden="true"></i></span>
        <strong>旧结算通道</strong>
        <small>仅保留查询，不再接收新的结算单。</small>
        <p class="kui-stat__value">0<small>笔 / 日</small></p>
    </article>
</div>`,
})}

${sectionTitle('顶部条幅', '条幅横跨容器顶部，适合表达整个面板的状态；标题区与正文保持原位置，不需要额外留白。')}

${demo({
    title: '面板上的条幅',
    desc: '条幅只放一句结论与一个入口，写第二段解释就该换成提示条。下面这个面板的条幅状态可以切换，四种语义色都在条幅上取色。',
    tags: ['.kui-ribbon__bar', '.kui-segmented'],
    script: `
const bar = document.querySelector<HTMLElement>('[data-rbn-bar]')
const barText = document.querySelector<HTMLElement>('[data-rbn-bar-text]')
const status = document.querySelector<HTMLElement>('[data-rbn-status]')
const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-rbn-tone]'))

const TONE = {
    primary: { modifier: '', text: '新版本已开放预览，可在设置中切换' },
    success: { modifier: 'is-success', text: '本月账单已结清，下次续费 11 月 1 日' },
    warning: { modifier: 'is-warning', text: '数据同步延迟，最近一次为 42 分钟前' },
    danger: { modifier: 'is-danger', text: '订阅已过期，3 天后将停止同步' },
}

buttons.forEach((button) => {
    button.addEventListener('click', () => {
        const tone = button.dataset.rbnTone as keyof typeof TONE
        const config = TONE[tone]
        if (bar) {
            bar.classList.remove('is-success', 'is-warning', 'is-danger')
            if (config.modifier) bar.classList.add(config.modifier)
        }
        if (barText) barText.textContent = config.text
        if (status) status.textContent = '当前：' + button.textContent
        buttons.forEach((item) => item.classList.toggle('is-active', item === button))
    })
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-cluster">
        <div class="kui-segmented" role="group" aria-label="条幅状态">
            <button type="button" class="is-active" data-rbn-tone="primary">进行中</button>
            <button type="button" data-rbn-tone="success">已完成</button>
            <button type="button" data-rbn-tone="warning">提醒</button>
            <button type="button" data-rbn-tone="danger">已过期</button>
        </div>
        <span class="kui-stat__label" data-rbn-status>当前：进行中</span>
    </div>
    <section class="panel kui-ribbon">
        <div class="kui-ribbon__bar" data-rbn-bar>
            <i class="fa fa-bullhorn" aria-hidden="true"></i>
            <span data-rbn-bar-text>新版本已开放预览，可在设置中切换</span>
        </div>
        <div class="panel-heading">
            <h3 class="panel-title">企业版订阅</h3>
            <span class="badge badge-neutral">24 个席位</span>
        </div>
        <div class="panel-body">条幅颜色沿用语义令牌，和同一页里的徽章、提示条保持同一含义；切换状态时只换条幅，标题与正文不动。</div>
    </section>
</div>`,
})}

${sectionTitle('侧边飘带', '侧边飘带改成竖排贴左后不再旋转、不再越界，占用的宽度固定在 22px 左右，容器用内边距把它让出来。')}

${demo({
    title: '文档卡上的侧边飘带',
    desc: '飘带竖排贴在容器左侧，文字从它右边开始：容器把 --kui-board-padding 的左值提到 28px，正文与飘带之间留出 6px 的安全距离，第一行标题不会被压住。',
    tags: ['.kui-ribbon__side', '--kui-board-padding'],
    html: `
<div class="kui-grid kui-grid--lg">
    <article class="kui-ribbon kui-board kui-stack kui-stack--tight" style="--kui-board-padding: var(--kui-space-4) var(--kui-space-4) var(--kui-space-4) var(--kui-space-7)">
        <div class="kui-ribbon__side">草稿</div>
        <div class="kui-cluster kui-justify-between">
            <span class="kui-list__title">2026 年度规划</span>
            <span class="badge badge-neutral">仅自己可见</span>
        </div>
        <p class="kui-page-header__desc">尚未提交评审，可以继续修改目标与关键结果；提交后进入两级审批，期间正文只读。</p>
        <div class="kui-cluster kui-justify-between">
            <span class="kui-stat__label">最后编辑于 2 小时前</span>
            <button type="button" class="btn btn-default btn-sm">继续编辑</button>
        </div>
    </article>
    <article class="kui-ribbon kui-board kui-stack kui-stack--tight" style="--kui-board-padding: var(--kui-space-4) var(--kui-space-4) var(--kui-space-4) var(--kui-space-7)">
        <div class="kui-ribbon__side">模板</div>
        <div class="kui-cluster kui-justify-between">
            <span class="kui-list__title">渠道周报</span>
            <span class="badge badge-neutral">运营维护</span>
        </div>
        <p class="kui-page-header__desc">由运营团队维护，可直接复制使用；共 12 个字段、3 个图表，按周自动汇总。</p>
        <div class="kui-cluster kui-justify-between">
            <span class="kui-stat__label">本周已被使用 18 次</span>
            <button type="button" class="btn btn-primary btn-sm">复制使用</button>
        </div>
    </article>
</div>`,
})}

${callout('侧边飘带不再压住文字的关键在容器：飘带用 <code>writing-mode: vertical-rl</code> 贴左排布，宽度约 22px；容器把 <code>--kui-board-padding</code> 的左值设为 <code>var(--kui-space-7)</code>（28px），文字就从飘带右侧 6px 处开始。角标与条幅不需要这一步，它们的区域由自身裁切。', 'info')}

${sectionTitle('贴在什么容器上', '缎带与容器是一对一关系：面板、商品卡、文档卡各有一种最合适的形态。')}

${demo({
    title: '面板、商品卡、文档卡',
    desc: '面板用顶部条幅，商品卡用角标，文档卡用侧边飘带；三者的共同点是容器本身已有明确标题，缎带只补一句阶段。',
    stage: 'tinted',
    tags: ['.panel', '.kui-board', '.kui-ribbon'],
    html: `
<div class="kui-stack kui-stack--loose">
    <section class="panel kui-ribbon">
        <div class="kui-ribbon__bar is-success"><i class="fa fa-check" aria-hidden="true"></i> 本月账单已结清</div>
        <div class="panel-heading">
            <h3 class="panel-title">企业版订阅</h3>
            <div class="panel-actions"><button type="button" aria-label="更多操作"><i class="fa fa-ellipsis-h" aria-hidden="true"></i></button></div>
        </div>
        <div class="panel-body">下次续费 2026 年 11 月 1 日，共 24 个席位；条幅只在状态变化时出现，不常驻。</div>
    </section>
    <div class="kui-grid kui-grid--md">
        <article class="kui-ribbon kui-board kui-shortcut">
            <div class="kui-ribbon__corner"><span class="is-warning">限时</span></div>
            <span class="kui-stat__icon"><i class="fa fa-shopping-cart" aria-hidden="true"></i></span>
            <strong>渠道分析包</strong>
            <small>含 3 个看板与自定义导出。</small>
            <p class="kui-stat__value">268<small>元 / 月</small></p>
        </article>
        <article class="kui-ribbon kui-board kui-stack kui-stack--tight" style="--kui-board-padding: var(--kui-space-4) var(--kui-space-4) var(--kui-space-4) var(--kui-space-7)">
            <div class="kui-ribbon__side">归档</div>
            <span class="kui-list__title">九月结算说明</span>
            <p class="kui-page-header__desc">财务中心 · 2026-09-30 归档，只读保留 5 年。</p>
            <span class="kui-stat__label">由财务中心在结账日自动归档</span>
        </article>
    </div>
</div>`,
})}

${callout('一个容器只放一条缎带。角标与条幅同时出现会形成两个「最重要」的信号，读者反而不知道先看哪个；需要补充状态时用徽章，而不是第二条缎带。', 'warning')}

${propsTable([
    { name: '.kui-ribbon', type: 'class', defaultValue: '—', desc: '容器定位上下文，设置 <code>position: relative</code> 并裁切溢出。' },
    { name: '.kui-ribbon__corner', type: 'class', defaultValue: '92px', desc: '右上角 92px 见方的裁切区，内部条纹旋转 45°。' },
    { name: '.kui-ribbon__corner > span', type: 'selector', defaultValue: 'primary', desc: '角标文字，直接子元素必须是 <code>span</code>。' },
    { name: '.is-success', type: 'class', defaultValue: '—', desc: '角标 / 条幅的成功配色，对应已通过、已结清。' },
    { name: '.is-warning', type: 'class', defaultValue: '—', desc: '警告配色，对应待补齐、限时、延迟。' },
    { name: '.is-danger', type: 'class', defaultValue: '—', desc: '危险配色，对应已停用、已超限、已过期。' },
    { name: '.is-neutral', type: 'class', defaultValue: '—', desc: '中性配色，对应已归档、只读，仅角标支持。' },
    { name: '.kui-ribbon__bar', type: 'class', defaultValue: '—', desc: '横跨容器顶部的条幅，宽度撑满，含下边框。' },
    { name: '.kui-ribbon__side', type: 'class', defaultValue: '—', desc: '左侧竖排飘带：<code>writing-mode: vertical-rl</code>，不旋转、不越界。' },
    { name: '--kui-board-padding', type: 'length', defaultValue: '16px', desc: '侧边飘带的容器需把左值提到 <code>var(--kui-space-7)</code>，为飘带让出 28px。' },
])}

`

    /* ---------- 条幅状态切换 ---------- */
    const tones: Record<string, { modifier: string; text: string }> = {
        primary: { modifier: '', text: '新版本已开放预览，可在设置中切换' },
        success: { modifier: 'is-success', text: '本月账单已结清，下次续费 11 月 1 日' },
        warning: { modifier: 'is-warning', text: '数据同步延迟，最近一次为 42 分钟前' },
        danger: { modifier: 'is-danger', text: '订阅已过期，3 天后将停止同步' },
    }

    const bar = root.querySelector<HTMLElement>('[data-rbn-bar]')
    const barText = root.querySelector<HTMLElement>('[data-rbn-bar-text]')
    const status = root.querySelector<HTMLElement>('[data-rbn-status]')
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-rbn-tone]'))

    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            const config = tones[button.dataset.rbnTone ?? 'primary'] ?? tones.primary
            if (bar) {
                bar.classList.remove('is-success', 'is-warning', 'is-danger')
                if (config.modifier) {
                    bar.classList.add(config.modifier)
                }
            }
            if (barText) {
                barText.textContent = config.text
            }
            if (status) {
                status.textContent = `当前：${button.textContent?.trim() ?? ''}`
            }
            buttons.forEach((item) => item.classList.toggle('is-active', item === button))
        })
    })
}
