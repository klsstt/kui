import { Alert } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { demo, pageHead, propsTable } from '../../docs/ui'

/**
 * 提示。
 * 提示把系统状态留在页面里：左侧色条承担语义，正文保持可读，
 * 只有需要用户确认收到时才提供关闭按钮。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '提示用于把系统状态留在页面内：成功、信息、警告、错误四种语义各有一条色条，标题说结论、正文说原因、链接说下一步。只有需要用户确认的状态才提供关闭按钮。',
    tags: ['Alert', '.alert', '.alert-title'],
})}

${demo({
    title: '四种语义',
    desc: '语义色只表达等级，不表达紧急程度；标题与正文分工固定，链接永远指向下一步动作。',
    tags: ['.alert-success', '.alert-warning'],
    html: `
<div class="alert alert-success" role="status">
    <i class="fa fa-check-circle-o" aria-hidden="true"></i>
    <div>
        <strong class="alert-title">发布成功</strong>
        版本 2.4.0 已推送到生产环境，3 分钟内完成全量生效。
    </div>
</div>
<div class="alert alert-info" role="status">
    <i class="fa fa-info-circle" aria-hidden="true"></i>
    <div>
        <strong class="alert-title">维护窗口</strong>
        本周六 02:00 至 04:00 进行数据库升级，期间只读。
        <a class="alert-link" href="#/alert">查看公告</a>
    </div>
</div>
<div class="alert alert-warning" role="alert">
    <i class="fa fa-exclamation-triangle" aria-hidden="true"></i>
    <div>
        <strong class="alert-title">6 个订单超过承诺发货时间</strong>
        请在今日 18:00 前处理，逾期将自动退款。
    </div>
</div>
<div class="alert alert-danger" role="alert">
    <i class="fa fa-exclamation-circle" aria-hidden="true"></i>
    <div>
        <strong class="alert-title">同步失败</strong>
        第三方物流接口返回 502，已重试 3 次，请检查密钥是否过期。
    </div>
</div>`,
})}

${demo({
    title: '可关闭',
    desc: '需要用户确认的状态才加关闭按钮；关闭后提示从 DOM 移除，不占据页面高度。',
    tags: ['data-dismiss="alert"', '.alert--bordered'],
    script: `
root.querySelectorAll<HTMLElement>('[data-alert-dismiss]').forEach((element) => {
    const alert = Alert.getOrCreate(element)
    trackComponent(alert)
    element.querySelector<HTMLElement>('[data-dismiss="alert"]')?.addEventListener('click', (event) => {
        event.preventDefault()
        alert.close()
    })
})
`,
    html: `
<div class="alert alert-info" data-alert-dismiss role="status">
    <i class="fa fa-info-circle" aria-hidden="true"></i>
    <div>
        <strong class="alert-title">已切换到只读模式</strong>
        当前账号没有编辑权限，需要修改请联系管理员。
    </div>
    <button type="button" class="close" data-dismiss="alert" aria-label="关闭提示">
        <i class="fa fa-close" aria-hidden="true"></i>
    </button>
</div>
<div class="alert alert--bordered alert-warning" data-alert-dismiss role="alert">
    <i class="fa fa-exclamation-triangle" aria-hidden="true"></i>
    <div>
        <strong class="alert-title">草稿未保存</strong>
        离开当前页面会丢失最近 10 分钟的修改。
    </div>
    <button type="button" class="close" data-dismiss="alert" aria-label="关闭提示">
        <i class="fa fa-close" aria-hidden="true"></i>
    </button>
</div>`,
})}

${demo({
    title: '页内落位',
    desc: '提示紧跟页头、位于表单上方或内容块底部：与它说明的对象保持在同一视线范围内。',
    stage: 'tinted',
    html: `
<div class="kui-stack">
    <header class="kui-page-header">
        <div class="kui-page-header__text">
            <h2 class="kui-page-header__title">团队设置</h2>
            <p class="kui-page-header__desc">修改会立即对全部 12 名成员生效。</p>
        </div>
        <div class="kui-page-header__actions">
            <button type="button" class="btn btn-primary btn-sm">保存</button>
        </div>
    </header>
    <div class="alert alert-warning" role="alert">
        <i class="fa fa-exclamation-triangle" aria-hidden="true"></i>
        <div>当前套餐最多 15 名成员，已使用 12 个名额。</div>
    </div>
    <form class="kui-board kui-stack">
        <div class="form-group">
            <label class="form-label" for="alert-team-name">团队名称</label>
            <input class="form-control" id="alert-team-name" type="text" value="产品设计与体验组">
            <span class="form-hint">成员在邀请邮件与共享链接中会看到这个名称。</span>
        </div>
        <div class="alert alert-success" role="status">
            <i class="fa fa-check-circle-o" aria-hidden="true"></i>
            <div>名称可用，保存后立即生效。</div>
        </div>
    </form>
</div>`,
})}

${propsTable([
    { name: 'dismissSelector', type: 'string', defaultValue: '[data-dismiss="alert"]', desc: '关闭按钮的选择器，点击后调用 <code>close()</code>。' },
    { name: 'removeElement', type: 'boolean', defaultValue: 'true', desc: '关闭时是否从 DOM 移除；设为 <code>false</code> 只加 <code>aria-hidden</code>。' },
    { name: '.alert-success / -info / -warning / -danger', type: 'class', defaultValue: '—', desc: '四种语义，只改变左侧色条与图标颜色。' },
    { name: '.alert--bordered', type: 'class', defaultValue: '—', desc: '四周加上同色描边，用于需要更强边界的场景。' },
    { name: '.alert-title', type: 'class', defaultValue: '—', desc: '提示标题，一行结论，比正文重一档。' },
    { name: '.alert-link', type: 'class', defaultValue: '—', desc: '提示内的下一步链接，与正文同字号。' },
    { name: 'data-dismiss="alert"', type: 'attribute', defaultValue: '—', desc: '关闭按钮声明，必须配合 <code>close()</code> 的调用方。' },
])}

`

    root.querySelectorAll<HTMLElement>('[data-alert-dismiss]').forEach((element) => {
        const alert = Alert.getOrCreate(element)
        trackComponent(alert)
        element.querySelector<HTMLElement>('[data-dismiss="alert"]')?.addEventListener('click', (event) => {
            event.preventDefault()
            alert.close()
        })
    })
}
