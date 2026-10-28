import { Nestable } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 嵌套排序。
 * 拖拽负责「放到哪」，按钮负责「怎么放」：
 * 落点分前、后、内部三种，按钮提供同样的四种调整，触屏与键盘用户不必依赖拖拽。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '嵌套排序把结构当作可编辑的内容：拖动决定条目去哪，按钮决定它相对同层的位置。落点分前、后、内部三种，配合层级上限，任何一次拖动都不会把大纲拖成一棵无法阅读的树；右侧同步给出深度优先的 id 顺序。',
    tags: ['Nestable', '.kui-nestable', 'maxDepth'],
})}

${sectionTitle('三层大纲', '拖动整行排序：行上缘插入到前面，行中部插入到后面，行下缘成为子级；落点分别显示上边线、下边线与内嵌底色。')}

${demo({
    title: '拖拽与按钮',
    desc: '三层结构限制在 maxDepth: 3；每一行都保留上移、下移、升级、降级四个按钮，拖动与按钮走同一套顺序回调。',
    tags: ['before / after / inside', '移动与升降级', 'kui:nestable:change'],
    script: `
const outline = document.querySelector('[data-nestable-demo="outline"]')

const nestable = Nestable.getOrCreate(outline, {
    maxDepth: 3,
    actions: true,
    onChange: ({ order }) => {
        document.querySelector('[data-nestable-order]').textContent = JSON.stringify({ order }, null, 2)
    },
})
`,
    html: `
<div class="kui-split kui-split--main-first" style="--kui-split-sidebar: 17rem">
    <ol class="kui-nestable" data-nestable-demo="outline" data-kui-nestable>
        <li data-kui-nestable-item data-nestable-id="getting-started">
            <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content"><i class="fa fa-book" aria-hidden="true"></i> 开始使用</span></div>
            <ol class="kui-nestable__children" data-kui-nestable-children>
                <li data-kui-nestable-item data-nestable-id="install">
                    <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content">安装与引入</span></div>
                </li>
                <li data-kui-nestable-item data-nestable-id="structure">
                    <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content">目录结构</span></div>
                </li>
                <li data-kui-nestable-item data-nestable-id="first-page">
                    <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content">第一个页面</span></div>
                </li>
            </ol>
        </li>
        <li data-kui-nestable-item data-nestable-id="design-tokens">
            <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content"><i class="fa fa-paint-brush" aria-hidden="true"></i> 设计令牌</span></div>
            <ol class="kui-nestable__children" data-kui-nestable-children>
                <li data-kui-nestable-item data-nestable-id="color">
                    <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content">颜色</span></div>
                </li>
                <li data-kui-nestable-item data-nestable-id="spacing">
                    <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content">间距与圆角</span></div>
                </li>
            </ol>
        </li>
        <li data-kui-nestable-item data-nestable-id="components">
            <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content"><i class="fa fa-puzzle-piece" aria-hidden="true"></i> 组件</span></div>
            <ol class="kui-nestable__children" data-kui-nestable-children>
                <li data-kui-nestable-item data-nestable-id="forms">
                    <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content">表单</span></div>
                    <ol class="kui-nestable__children" data-kui-nestable-children>
                        <li data-kui-nestable-item data-nestable-id="input">
                            <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content">输入框</span></div>
                        </li>
                        <li data-kui-nestable-item data-nestable-id="select">
                            <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content">选择器</span></div>
                        </li>
                    </ol>
                </li>
                <li data-kui-nestable-item data-nestable-id="data-display">
                    <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content">数据展示</span></div>
                    <ol class="kui-nestable__children" data-kui-nestable-children>
                        <li data-kui-nestable-item data-nestable-id="table">
                            <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content">表格</span></div>
                        </li>
                    </ol>
                </li>
            </ol>
        </li>
        <li data-kui-nestable-item data-nestable-id="release">
            <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content"><i class="fa fa-tag" aria-hidden="true"></i> 发布与版本</span></div>
            <ol class="kui-nestable__children" data-kui-nestable-children>
                <li data-kui-nestable-item data-nestable-id="changelog">
                    <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content">变更记录</span></div>
                </li>
            </ol>
        </li>
    </ol>
    <div class="kui-stack kui-stack--tight">
        <div class="kui-toolbar">
            <div class="kui-toolbar__group"><p class="form-label">当前顺序</p></div>
            <div class="kui-toolbar__group"><span class="badge badge-neutral">深度优先</span></div>
        </div>
        <div class="kui-code-block">
            <pre class="kui-code-block__pre" tabindex="0" aria-label="当前顺序 JSON"><code data-nestable-order>{}</code></pre>
        </div>
        <p class="form-hint">拖动整行，或用行尾的四个按钮调整；每次变化都会重写这段 JSON。</p>
    </div>
</div>`,
})}

${sectionTitle('层级上限', 'maxDepth 是硬约束：达到上限后，inside 落点与「降级」按钮都会失效，条目只能在同层前后移动。')}

${demo({
    title: '两层结构',
    desc: 'maxDepth 设为 2 时，条目只能排在前或后：把子项拖到另一个子项的下缘不会插入内部，只会排到它后面。',
    tags: ['maxDepth: 2'],
    script: `
Nestable.getOrCreate('[data-nestable-demo="flat"]', { maxDepth: 2, actions: true })
`,
    html: `
<ol class="kui-nestable" data-nestable-demo="flat" data-kui-nestable>
    <li data-kui-nestable-item data-nestable-id="overview">
        <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content">产品概览</span></div>
        <ol class="kui-nestable__children" data-kui-nestable-children>
            <li data-kui-nestable-item data-nestable-id="pricing">
                <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content">定价</span></div>
            </li>
            <li data-kui-nestable-item data-nestable-id="security">
                <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content">安全</span></div>
            </li>
        </ol>
    </li>
    <li data-kui-nestable-item data-nestable-id="docs">
        <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content">文档</span></div>
        <ol class="kui-nestable__children" data-kui-nestable-children>
            <li data-kui-nestable-item data-nestable-id="guide">
                <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content">使用指南</span></div>
            </li>
        </ol>
    </li>
</ol>`,
})}

${sectionTitle('只保留拖拽', 'actions 关闭后不再生成按钮，行内只剩内容与把手：适合拖拽已经足够、且不要求触屏编辑的场景。')}

${demo({
    title: '纯拖拽',
    desc: '三个状态页签之间只允许排序，没有层级；把手只做视觉提示，整行都是拖动对象。',
    tags: ['actions: false'],
    script: `
Nestable.getOrCreate('[data-nestable-demo="bare"]', { maxDepth: 1, actions: false })
`,
    html: `
<ol class="kui-nestable" data-nestable-demo="bare" data-kui-nestable>
    <li data-kui-nestable-item data-nestable-id="draft">
        <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content">草稿</span></div>
    </li>
    <li data-kui-nestable-item data-nestable-id="review">
        <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content">待评审</span></div>
    </li>
    <li data-kui-nestable-item data-nestable-id="published">
        <div class="kui-nestable__row"><span class="kui-nestable__handle"><i class="fa fa-bars" aria-hidden="true"></i></span><span class="kui-nestable__content">已发布</span></div>
    </li>
</ol>`,
})}

${propsTable([
    { name: 'maxDepth', type: 'number', defaultValue: '0', desc: '最大层级，挡住过深的降级与 inside 落点；三层结构填 3，只允许同层排序填 1。' },
    { name: 'actions', type: 'boolean', defaultValue: 'true', desc: '是否生成上移、下移、升级、降级四个按钮。' },
    { name: 'onChange', type: '({ order }) => void', desc: '顺序变化回调，order 是深度优先的 id 序列。' },
    { name: 'kui:nestable:change', type: 'event', desc: '事件形式的顺序通知，拖动与按钮都会派发。' },
    { name: 'moveUp / moveDown / indent / outdent', type: 'method', desc: '同层移动与升降级；到边界或超过 maxDepth 时不再变化。' },
    { name: 'order', type: 'getter', desc: '当前顺序（<code>string[]</code>），读取的是 DOM，不是缓存的模型。' },
    { name: '.kui-nestable__row / __content', type: 'class', desc: '一行与行内的文字区；按钮与把手都挂在行内，结构由组件补全。' },
    { name: '.kui-nestable__handle', type: 'class', desc: '拖动把手的视觉提示，整行带 <code>draggable</code>，实际拖动范围就是整行。' },
    { name: '.is-drop-before / .is-drop-after / .is-drop-inside', type: 'class', desc: '三种落点的反馈：上边线、下边线与内嵌底色。' },
])}

${callout('拖拽落点按行高分配：上三分之一插入到前面，下四分之一成为子级，中间插入到后面。触屏或键盘场景改用行尾按钮，四种操作与拖拽走同一个 <code>onChange</code>，顺序 JSON 始终一致。')}

`

    const outline = root.querySelector<HTMLElement>('[data-nestable-demo="outline"]')
    if (outline) {
        const output = root.querySelector<HTMLElement>('[data-nestable-order]')
        const paint = (order: string[]): void => {
            if (output) {
                output.textContent = JSON.stringify({ order }, null, 2)
            }
        }

        const instance = Nestable.getOrCreate(outline, {
            maxDepth: 3,
            actions: true,
            onChange: ({ order }) => paint(order),
        })
        trackComponent(instance)
        paint(instance.order)
    }

    const flat = root.querySelector<HTMLElement>('[data-nestable-demo="flat"]')
    if (flat) {
        trackComponent(Nestable.getOrCreate(flat, { maxDepth: 2, actions: true }))
    }

    const bare = root.querySelector<HTMLElement>('[data-nestable-demo="bare"]')
    if (bare) {
        trackComponent(Nestable.getOrCreate(bare, { maxDepth: 1, actions: false }))
    }
}
