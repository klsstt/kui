import { Tour } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 引导。
 * 一次只讲一件事：聚光框落在目标上，气泡贴在目标旁边，
 * 用户可以在任意一步跳过，走完之后不再重复播放。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '新手引导把「先做什么、再做什么」固定成一条三步路径：每一步只指向一个真实元素，气泡贴在目标旁边，其余界面被遮罩压暗。用户可以随时跳过，也可以在需要时重新播放。',
    tags: ['Tour', '.kui-tour__bubble', 'steps'],
})}

${demo({
    title: '三步引导',
    desc: '聚光框跟随目标，方向键切换步骤，Esc 或遮罩点击退出；点「重新播放」可以按需再看一遍。',
    tags: ['Tour', 'placement', '.kui-tour__bubble'],
    script: `
const source = root.querySelector<HTMLElement>('[data-guide-tour]')
const replay = root.querySelector<HTMLElement>('[data-guide-replay]')
if (source && replay) {
    const tour = Tour.getOrCreate(source, {
        steps: [
            { target: '[data-guide-target="toolbar"]', title: '先确认筛选范围', content: '搜索与导出都在这一行，先限定订单范围再做下一步。', placement: 'bottom' },
            { target: '[data-guide-target="row"]', title: '再看单行信息', content: '一行只回答三个问题：谁的订单、几件、什么状态。', placement: 'top' },
            { target: '[data-guide-target="export"]', title: '最后导出', content: '确认无误后导出报表，格式与当前筛选一致。', placement: 'left' },
        ],
    })
    trackComponent(tour)
    replay.addEventListener('click', () => tour.start(0))
}
`,
    html: `
<div class="kui-stack" data-guide-demo>
    <div class="kui-toolbar">
        <div class="kui-toolbar__group" data-guide-target="toolbar">
            <div class="input-group kui-max-w-sm">
                <span class="input-addon"><i class="fa fa-search" aria-hidden="true"></i></span>
                <input class="form-control" type="search" placeholder="搜索订单号" aria-label="搜索订单">
            </div>
        </div>
        <div class="kui-toolbar__group">
            <button type="button" class="btn btn-default btn-sm">批量打印</button>
            <button type="button" class="btn btn-primary btn-sm" data-guide-target="export">导出报表</button>
        </div>
    </div>
    <ul class="kui-list" data-guide-target="row">
        <li class="kui-list__item">
            <span class="kui-list__body">
                <span class="kui-list__title">KUI-20481 · 秋季满减套装</span>
                <span class="kui-list__meta">林澈 · 2 件 · 待发货</span>
            </span>
            <span class="kui-list__aside">09:24</span>
        </li>
        <li class="kui-list__item">
            <span class="kui-list__body">
                <span class="kui-list__title">KUI-20479 · 桌面收纳组合</span>
                <span class="kui-list__meta">周昕 · 1 件 · 已发货</span>
            </span>
            <span class="kui-list__aside">09:02</span>
        </li>
    </ul>
    <div class="kui-cluster">
        <button type="button" class="btn btn-default btn-sm" data-guide-replay><i class="fa fa-play-circle" aria-hidden="true"></i> 重新播放引导</button>
        <span class="form-hint">共 3 步，目标都是页面里真实存在的元素。</span>
    </div>
    <div data-guide-tour hidden></div>
</div>`,
})}

${sectionTitle('没有目标时', '有些提示不属于某个控件，只是打开页面时的一句说明。')}

${demo({
    title: '居中单步提示',
    desc: '不传 target 时气泡居中、遮罩不可点击关闭，适合「这一屏怎么用」的一句话说明。',
    tags: ['maskClosable', 'skippable'],
    script: `
const source = root.querySelector<HTMLElement>('[data-guide-single-source]')
const play = root.querySelector<HTMLElement>('[data-guide-single-play]')
if (source && play) {
    const tour = Tour.getOrCreate(source, {
        maskClosable: false,
        skippable: false,
        doneText: '开始使用',
        steps: [{ title: '这一屏只讲一件事', content: '引导只解释当前页面的主要动作，其余功能留给界面本身。' }],
    })
    trackComponent(tour)
    play.addEventListener('click', () => tour.start(0))
}
`,
    html: `
<div class="kui-stack" data-guide-single-demo>
    <div class="kui-board kui-stack kui-stack--tight">
        <strong>首次进入的说明</strong>
        <p class="form-hint">没有指向元素时，气泡居中显示，遮罩点击不会关闭。</p>
    </div>
    <div class="kui-cluster">
        <button type="button" class="btn btn-default btn-sm" data-guide-single-play>播放单步提示</button>
        <div data-guide-single-source hidden></div>
    </div>
</div>`,
})}

${propsTable([
    { name: 'steps', type: 'string', defaultValue: '[]', desc: '步骤数组（或 JSON 字符串），每步一项。' },
    { name: 'steps[].target', type: 'string', defaultValue: '—', desc: '目标元素选择器；缺省时气泡居中。' },
    { name: 'steps[].placement', type: 'string', defaultValue: 'auto', desc: '气泡方位：<code>top</code> / <code>right</code> / <code>bottom</code> / <code>left</code> / <code>auto</code>。' },
    { name: 'steps[].padding', type: 'number', defaultValue: '6', desc: '聚光框相对目标的外扩像素。' },
    { name: 'autoStart', type: 'boolean', defaultValue: 'false', desc: '挂载后立即开始，适合首次登录。' },
    { name: 'maskClosable', type: 'boolean', defaultValue: 'true', desc: '点击遮罩是否退出引导。' },
    { name: 'skippable', type: 'boolean', defaultValue: 'true', desc: '是否显示右上角的跳过按钮。' },
    { name: 'nextText / prevText / doneText', type: 'string', defaultValue: '下一步 / 上一步 / 完成', desc: '三步按钮的文案，随步骤自动切换。' },
    { name: 'onFinish / onClose / onChange', type: 'string', defaultValue: '—', desc: '完成、退出与切步回调，用来记录「已看过」的状态。' },
])}

`

    const tourSource = root.querySelector<HTMLElement>('[data-guide-tour]')
    const replay = root.querySelector<HTMLElement>('[data-guide-replay]')
    if (tourSource && replay) {
        const tour = Tour.getOrCreate(tourSource, {
            steps: [
                { target: '[data-guide-target="toolbar"]', title: '先确认筛选范围', content: '搜索与导出都在这一行，先限定订单范围再做下一步。', placement: 'bottom' },
                { target: '[data-guide-target="row"]', title: '再看单行信息', content: '一行只回答三个问题：谁的订单、几件、什么状态。', placement: 'top' },
                { target: '[data-guide-target="export"]', title: '最后导出', content: '确认无误后导出报表，格式与当前筛选一致。', placement: 'left' },
            ],
        })
        trackComponent(tour)
        replay.addEventListener('click', () => tour.start(0))
    }

    const singleSource = root.querySelector<HTMLElement>('[data-guide-single-source]')
    const singlePlay = root.querySelector<HTMLElement>('[data-guide-single-play]')
    if (singleSource && singlePlay) {
        const tour = Tour.getOrCreate(singleSource, {
            maskClosable: false,
            skippable: false,
            doneText: '开始使用',
            steps: [{ title: '这一屏只讲一件事', content: '引导只解释当前页面的主要动作，其余功能留给界面本身。' }],
        })
        trackComponent(tour)
        singlePlay.addEventListener('click', () => tour.start(0))
    }
}
