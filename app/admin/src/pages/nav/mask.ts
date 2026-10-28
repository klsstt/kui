import { Modal } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 遮罩浮层。
 * 模态框要求一次确认，抽屉要求一次集中浏览，确认框要求一次明确选择；
 * 三者共用同一套遮罩、滚动锁与焦点陷阱，关闭入口也统一放在标题右侧。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '遮罩浮层把用户从页面里「借」出来一小段时间：模态框用于一次明确确认，抽屉用于一次集中浏览。两者都锁住背景滚动、把焦点限制在弹层内，并允许 Esc 与遮罩点击关闭。',
    tags: ['Modal', '.modal--drawer', '.modal-dialog--sm'],
})}

${demo({
    title: '模态框：一次明确的编辑',
    desc: '标题、正文、底部动作三段；关闭按钮固定在标题右侧，图标与其它浮层一致。打开时焦点进入第一个可操作项，关闭后回到触发它的按钮。',
    tags: ['.modal', '.modal-dialog', 'data-dismiss="modal"'],
    script: `
document.querySelectorAll<HTMLElement>('[data-mask-modal]').forEach((element) => {
    const modal = Modal.getOrCreate(element)
    document.querySelector<HTMLElement>('[data-mask-open="' + element.id + '"]')?.addEventListener('click', () => {
        modal.show()
    })
})
`,
    html: `
<div class="kui-cluster">
    <button type="button" class="btn btn-primary" data-mask-open="nav-mask-edit">编辑收货地址</button>
    <span class="form-hint">按 Esc、点遮罩或点「取消」都会关闭，焦点回到这个按钮。</span>
</div>
<div class="modal fade" id="nav-mask-edit" data-mask-modal tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">编辑收货地址</h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="关闭"><i class="fa fa-times" aria-hidden="true"></i></button>
            </div>
            <div class="modal-body">
                <div class="kui-stack kui-stack--tight">
                    <div class="form-group">
                        <label class="form-label" for="nav-mask-receiver">收件人</label>
                        <input class="form-control" id="nav-mask-receiver" type="text" value="林澈">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="nav-mask-address">详细地址</label>
                        <input class="form-control" id="nav-mask-address" type="text" value="杭州市西湖区文三路 88 号">
                        <span class="form-hint">修改地址后需要重新打印面单。</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">取消</button>
                <button type="button" class="btn btn-primary" data-dismiss="modal">保存地址</button>
            </div>
        </div>
    </div>
</div>`,
})}

${demo({
    title: '抽屉：一次集中浏览',
    desc: '同一套遮罩，从右侧滑入；宽度固定，适合筛选、详情与编辑这类需要保留页面上下文的任务。关闭按钮同样在标题右侧，底部只留一个主操作。',
    tags: ['.modal--drawer', '.modal-content', '.modal-footer'],
    script: `
document.querySelectorAll<HTMLElement>('[data-mask-drawer]').forEach((element) => {
    const modal = Modal.getOrCreate(element)
    document.querySelector<HTMLElement>('[data-mask-open="' + element.id + '"]')?.addEventListener('click', () => {
        modal.show()
    })
})
`,
    html: `
<div class="kui-cluster">
    <button type="button" class="btn btn-default" data-mask-open="nav-mask-drawer"><i class="fa fa-filter" aria-hidden="true"></i> 打开筛选</button>
    <span class="form-hint">抽屉保留页面上下文，关掉后列表仍在原处。</span>
</div>
<div class="modal modal--drawer fade" id="nav-mask-drawer" data-mask-drawer tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">筛选订单</h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="关闭"><i class="fa fa-times" aria-hidden="true"></i></button>
            </div>
            <div class="modal-body">
                <div class="kui-stack">
                    <div class="form-group">
                        <label class="form-label" for="nav-mask-channel">渠道</label>
                        <select class="form-control" id="nav-mask-channel">
                            <option>全部渠道</option>
                            <option>直营小程序</option>
                            <option>门店自提</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="nav-mask-status">状态</label>
                        <select class="form-control" id="nav-mask-status">
                            <option>待发货</option>
                            <option>已发货</option>
                            <option>已签收</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="nav-mask-date">下单时间</label>
                        <input class="form-control" id="nav-mask-date" type="text" value="最近 7 天">
                        <span class="form-hint">筛选条件会在切换模块后保留。</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer kui-mt-auto">
                <button type="button" class="btn btn-default" data-dismiss="modal">重置</button>
                <button type="button" class="btn btn-primary" data-dismiss="modal">应用筛选</button>
            </div>
        </div>
    </div>
</div>`,
})}

${sectionTitle('确认框', '要求用户明确选择的场景，遮罩不参与关闭，关闭入口仍然是标题右侧那一个。')}

${demo({
    title: '确认框：危险动作只留两个出口',
    desc: '对话框收到 420px，正文说清后果与不可逆的时间窗口；遮罩点击不再关闭，用户必须用 Esc、关闭图标或底部两个按钮之一做选择。',
    tags: ['.modal-dialog--sm', "backdrop: 'static'", 'aria-label="关闭"'],
    script: `
document.querySelectorAll<HTMLElement>('[data-mask-confirm]').forEach((element) => {
    const modal = Modal.getOrCreate(element, { backdrop: 'static' })
    document.querySelector<HTMLElement>('[data-mask-open="' + element.id + '"]')?.addEventListener('click', () => {
        modal.show()
    })
})
`,
    html: `
<div class="kui-cluster">
    <button type="button" class="btn btn-danger" data-mask-open="nav-mask-confirm">删除项目</button>
    <span class="form-hint">遮罩点击不关闭；Esc 仍然有效，关闭后焦点回到按钮。</span>
</div>
<div class="modal fade" id="nav-mask-confirm" data-mask-confirm tabindex="-1">
    <div class="modal-dialog modal-dialog--sm">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">删除项目</h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="关闭"><i class="fa fa-times" aria-hidden="true"></i></button>
            </div>
            <div class="modal-body">
                项目「十月渠道复盘」及其 48 个文件将被删除，30 天内可以在回收站恢复，之后不可找回。
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">保留项目</button>
                <button type="button" class="btn btn-danger" data-dismiss="modal">确认删除</button>
            </div>
        </div>
    </div>
</div>`,
})}

${callout('三个浮层共用同一套关闭约定：<strong>显式按钮 · 遮罩点击 · Esc</strong>。遮罩点击与 Esc 调用同一个 <code>hide()</code>，关闭后焦点回到触发元素；传 <code>backdrop: \'static\'</code> 时点击遮罩只把焦点移回弹层，不会关闭。')}

${propsTable([
    { name: 'backdrop', type: 'boolean | \'static\'', defaultValue: 'true', desc: '是否渲染遮罩；传 <code>\'static\'</code> 时点击遮罩不关闭。' },
    { name: 'keyboard', type: 'boolean', defaultValue: 'true', desc: 'Esc 是否关闭弹层。' },
    { name: 'show', type: 'boolean', defaultValue: 'false', desc: '创建实例时立即打开。' },
    { name: 'show() / hide() / toggle()', type: 'method', defaultValue: '—', desc: '打开、关闭与切换；打开时锁滚动并把焦点移入弹层。' },
    { name: '.modal--drawer', type: 'class', defaultValue: '—', desc: '切换为右侧抽屉：整高、无圆角、滑入。' },
    { name: '.modal-dialog--sm / --lg', type: 'class', defaultValue: '600px', desc: '对话框宽度预设：420px 用于确认框，860px 用于大表格。' },
    { name: '.modal-backdrop', type: 'class', defaultValue: '—', desc: '由组件创建与移除的遮罩层，不需要手写。' },
    { name: '.modal-header .close', type: 'class', defaultValue: '—', desc: '关闭按钮固定在标题右侧，图标统一为 <code>fa fa-times</code>。' },
    { name: 'data-dismiss="modal"', type: 'attribute', defaultValue: '—', desc: '弹层内任意位置声明关闭，无需额外脚本。' },
    { name: 'aria-modal / role="dialog"', type: 'attribute', defaultValue: '—', desc: '打开时由组件补上，并以标题作为可访问名称。' },
])}

`

    root.querySelectorAll<HTMLElement>('[data-mask-modal]').forEach(element => {
        const modal = Modal.getOrCreate(element)
        trackComponent(modal)
        root.querySelector<HTMLElement>('[data-mask-open="' + element.id + '"]')?.addEventListener('click', () => {
            modal.show()
        })
    })

    root.querySelectorAll<HTMLElement>('[data-mask-drawer]').forEach(element => {
        const modal = Modal.getOrCreate(element)
        trackComponent(modal)
        root.querySelector<HTMLElement>('[data-mask-open="' + element.id + '"]')?.addEventListener('click', () => {
            modal.show()
        })
    })

    root.querySelectorAll<HTMLElement>('[data-mask-confirm]').forEach(element => {
        const modal = Modal.getOrCreate(element, { backdrop: 'static' })
        trackComponent(modal)
        root.querySelector<HTMLElement>('[data-mask-open="' + element.id + '"]')?.addEventListener('click', () => {
            modal.show()
        })
    })
}
