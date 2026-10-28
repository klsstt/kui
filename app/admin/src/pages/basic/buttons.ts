import { Dropdown } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 按钮。
 * 一个页面内所有可点击的「提交 / 取消 / 删除」都来自同一套按钮，
 * 语义色只表达业务含义，尺寸只表达层级；面板内同一行动作走 .kui-cluster，不同行用 .kui-stack 拉开。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '按钮承载一次明确的动作。实心表示主路径，描边表示并列选择，纯图标按钮只说一个动作；面板里同一行用 .kui-cluster 排开，不同行用 .kui-stack 留出间距，换行时不会挤成一团。',
    tags: ['Button', '.btn', 'Dropdown'],
})}

${sectionTitle('风格与形状', '先选实心还是描边，再选尺寸与形状；两者都不改变按钮的语义。')}

${demo({
    title: '默认风格',
    desc: '一个面板只出现一个主按钮；其余动作按风险降级为默认、语义色或文字按钮。同一行的按钮用 .kui-cluster 自动排开，行与行之间由 .kui-stack 给出 16px 间距。',
    tags: ['.btn-primary', '.btn-outline', '.kui-cluster'],
    html: `
<div class="kui-stack">
    <div class="kui-cluster">
        <button type="button" class="btn btn-primary">保存并发布</button>
        <button type="button" class="btn btn-default">取消</button>
        <button type="button" class="btn btn-ghost">稍后处理</button>
        <button type="button" class="btn btn-link">查看操作日志</button>
    </div>
    <div class="kui-cluster">
        <button type="button" class="btn btn-success">审核通过</button>
        <button type="button" class="btn btn-info">查看详情</button>
        <button type="button" class="btn btn-warning">退回修改</button>
        <button type="button" class="btn btn-danger">删除</button>
        <button type="button" class="btn btn-dark">切换视图</button>
    </div>
    <div class="kui-cluster">
        <button type="button" class="btn btn-outline btn-primary">导出</button>
        <button type="button" class="btn btn-outline btn-default">复制链接</button>
        <button type="button" class="btn btn-outline btn-success">通过</button>
        <button type="button" class="btn btn-outline btn-danger">移出团队</button>
    </div>
</div>`,
})}

${demo({
    title: '描边、圆角与块级',
    desc: '尺寸跟随容器密度：工具栏用 sm，主表单用默认，营销页才用 lg；形状只改圆角，块级按钮撑满所在容器。',
    stage: 'tinted',
    tags: ['.btn-outline', '.btn-round', '.btn-block'],
    html: `
<div class="kui-stack">
    <div class="kui-cluster">
        <button type="button" class="btn btn-primary btn-lg">大号按钮</button>
        <button type="button" class="btn btn-primary">默认按钮</button>
        <button type="button" class="btn btn-primary btn-sm">小号按钮</button>
        <button type="button" class="btn btn-primary btn-xs">迷你按钮</button>
    </div>
    <div class="kui-cluster">
        <button type="button" class="btn btn-default btn-round">圆角按钮</button>
        <button type="button" class="btn btn-primary btn-round">圆角主操作</button>
        <button type="button" class="btn btn-default btn-squared">直角按钮</button>
        <button type="button" class="btn btn-default" disabled>不可用</button>
    </div>
    <div class="kui-board kui-stack kui-stack--tight">
        <button type="button" class="btn btn-primary btn-block">通栏：表单尾部的主操作</button>
        <button type="button" class="btn btn-outline btn-default btn-block">通栏：并列的次级操作</button>
    </div>
</div>`,
})}

${demo({
    title: '图标按钮',
    desc: '动词前的图标只做识别，不做装饰；纯图标按钮必须写 aria-label，并固定成正方形，位置才不会随图标宽度变化。',
    tags: ['.btn-icon', '.btn-circle', 'aria-label'],
    script: `
const status = document.querySelector<HTMLElement>('[data-btn-icon-status]')

document.querySelectorAll<HTMLButtonElement>('[data-btn-icon]').forEach((button) => {
    button.addEventListener('click', () => {
        if (status) status.textContent = button.dataset.btnIconNote ?? '已执行'
    })
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-cluster">
        <button type="button" class="btn btn-primary"><i class="fa fa-check" aria-hidden="true"></i> 保存修改</button>
        <button type="button" class="btn btn-default"><i class="fa fa-download" aria-hidden="true"></i> 下载模板</button>
        <button type="button" class="btn btn-danger"><i class="fa fa-trash-o" aria-hidden="true"></i> 删除</button>
        <button type="button" class="btn btn-ghost"><i class="fa fa-angle-left" aria-hidden="true"></i> 返回</button>
    </div>
    <div class="kui-cluster">
        <button type="button" class="btn btn-default btn-icon" aria-label="设置" data-btn-icon data-btn-icon-note="已打开设置"><i class="fa fa-cog" aria-hidden="true"></i></button>
        <button type="button" class="btn btn-default btn-icon" aria-label="刷新" data-btn-icon data-btn-icon-note="已刷新列表"><i class="fa fa-refresh" aria-hidden="true"></i></button>
        <button type="button" class="btn btn-primary btn-circle" aria-label="新增成员" data-btn-icon data-btn-icon-note="已新增成员"><i class="fa fa-plus" aria-hidden="true"></i></button>
        <button type="button" class="btn btn-default btn-icon btn-sm" aria-label="搜索" data-btn-icon data-btn-icon-note="已打开搜索"><i class="fa fa-search" aria-hidden="true"></i></button>
        <button type="button" class="btn btn-default btn-icon btn-lg" aria-label="更多操作" data-btn-icon data-btn-icon-note="已展开更多操作"><i class="fa fa-ellipsis-h" aria-hidden="true"></i></button>
        <span class="badge badge-neutral" data-btn-icon-status>未操作</span>
    </div>
    <p class="kui-stat__label">图标与文字之间由 .btn 的 gap 统一给出，图标本身不再加外边距。</p>
</div>`,
})}

${demo({
    title: '下拉按钮',
    desc: '菜单只放同级操作，危险动作放在分隔线之后；点击菜单项、按 Esc 或点击外部都会收起。分裂式下拉把「主操作」和「更多方式」拆成两个按钮。',
    tags: ['Dropdown', '[data-toggle="dropdown"]', '.dropdown-menu'],
    script: `
document.querySelectorAll<HTMLElement>('[data-btn-menu]').forEach((trigger) => {
    trackComponent(Dropdown.getOrCreate(trigger, { placement: 'bottom-start' }))
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-cluster">
        <div class="dropdown">
            <button type="button" class="btn btn-primary" data-toggle="dropdown" data-btn-menu aria-expanded="false">
                批量操作 <i class="fa fa-caret-down" aria-hidden="true"></i>
            </button>
            <ul class="dropdown-menu">
                <li class="dropdown-header">对选中的 3 条生效</li>
                <li><button type="button" class="dropdown-item"><i class="fa fa-check" aria-hidden="true"></i> 标记为已处理</button></li>
                <li><button type="button" class="dropdown-item"><i class="fa fa-user" aria-hidden="true"></i> 转交同事</button></li>
                <li><button type="button" class="dropdown-item"><i class="fa fa-clock-o" aria-hidden="true"></i> 稍后提醒</button></li>
                <li class="divider"></li>
                <li><button type="button" class="dropdown-item is-danger"><i class="fa fa-trash-o" aria-hidden="true"></i> 删除订单</button></li>
            </ul>
        </div>
        <div class="dropdown">
            <div class="btn-group">
                <button type="button" class="btn btn-default">保存并继续</button>
                <button type="button" class="btn btn-default btn-icon" data-toggle="dropdown" data-btn-menu data-target="#btn-split-menu" aria-label="更多保存方式" aria-expanded="false">
                    <i class="fa fa-caret-down" aria-hidden="true"></i>
                </button>
            </div>
            <ul class="dropdown-menu" id="btn-split-menu">
                <li><button type="button" class="dropdown-item"><i class="fa fa-share" aria-hidden="true"></i> 保存并发布</button></li>
                <li><button type="button" class="dropdown-item"><i class="fa fa-files-o" aria-hidden="true"></i> 保存为草稿</button></li>
            </ul>
        </div>
        <div class="dropdown">
            <button type="button" class="btn btn-default btn-sm" data-toggle="dropdown" data-btn-menu aria-expanded="false">
                <i class="fa fa-filter" aria-hidden="true"></i> 筛选：全部
            </button>
            <ul class="dropdown-menu">
                <li><button type="button" class="dropdown-item">全部订单</button></li>
                <li><button type="button" class="dropdown-item">待审核</button></li>
                <li><button type="button" class="dropdown-item">已支付</button></li>
            </ul>
        </div>
    </div>
    <p class="kui-stat__label">菜单宽度最小 180px、最大 320px，超出高度时在菜单内滚动，不把页面撑长。</p>
</div>`,
})}

${sectionTitle('状态与组合', '加载、禁用与选中都只改变一个维度，不叠加出第四种按钮。')}

${demo({
    title: '动画与状态',
    desc: '加载态保留按钮原宽度，避免点击后布局跳动；禁用态用原生 disabled；选中态由 .btn-group 提供，单个按钮只切换 aria-pressed。',
    tags: ['is-loading', 'disabled', 'is-active', '.btn-animate'],
    script: `
const save = document.querySelector<HTMLButtonElement>('[data-btn-loading]')

save?.addEventListener('click', () => {
    save.classList.add('is-loading')
    save.disabled = true
    window.setTimeout(() => {
        save.classList.remove('is-loading')
        save.disabled = false
        save.textContent = '已保存'
    }, 1600)
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-cluster">
        <button type="button" class="btn btn-primary" data-btn-loading>点击查看加载态</button>
        <button type="button" class="btn btn-primary is-loading">提交中</button>
        <button type="button" class="btn btn-default" disabled>不可用</button>
        <button type="button" class="btn btn-primary" disabled>已提交</button>
    </div>
    <div class="kui-cluster">
        <button type="button" class="btn btn-default btn-animate btn-animate-side"><span>进入下一步</span></button>
        <span class="kui-stat__label">侧滑箭头只给「进入下一步」的主路径用，同一屏最多一次。</span>
    </div>
    <div class="kui-cluster">
        <div class="btn-group" role="group" aria-label="批量操作模式">
            <button type="button" class="btn btn-default is-active" aria-pressed="true">逐个处理</button>
            <button type="button" class="btn btn-default" aria-pressed="false">整批处理</button>
        </div>
        <span class="kui-stat__label">选中态只在 .btn-group 内生效，按钮自己不需要再定义一套高亮。</span>
    </div>
</div>`,
})}

${demo({
    title: '按钮组合与工具条',
    desc: '同一动作的多种取值用 .btn-group，筛选与批量操作放进 .kui-toolbar 的两端，互斥视图用 .kui-segmented。三种组合一次只选一种。',
    tags: ['.btn-group', '.kui-toolbar', '.kui-segmented'],
    script: `
const rangeText = document.querySelector<HTMLElement>('[data-btn-range]')

document.querySelectorAll<HTMLElement>('[data-btn-single]').forEach((group) => {
    group.addEventListener('click', (event) => {
        const button = (event.target as HTMLElement).closest('button')
        if (!button || !group.contains(button)) return
        group.querySelectorAll('button').forEach((item) => {
            const active = item === button
            item.classList.toggle('is-active', active)
            item.setAttribute('aria-pressed', String(active))
        })
        if (group.classList.contains('kui-segmented') && rangeText) {
            rangeText.textContent = '当前：' + button.textContent
        }
    })
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-cluster">
        <div class="btn-group" role="group" aria-label="对齐方式" data-btn-single>
            <button type="button" class="btn btn-default is-active" aria-pressed="true">左对齐</button>
            <button type="button" class="btn btn-default" aria-pressed="false">居中</button>
            <button type="button" class="btn btn-default" aria-pressed="false">右对齐</button>
        </div>
        <div class="kui-segmented" role="group" aria-label="时间范围" data-btn-single>
            <button type="button" class="is-active" aria-pressed="true">近 7 天</button>
            <button type="button" aria-pressed="false">近 30 天</button>
            <button type="button" aria-pressed="false">全年</button>
        </div>
        <span class="kui-stat__label" data-btn-range>当前：近 7 天</span>
    </div>
    <div class="kui-toolbar">
        <div class="kui-toolbar__group">
            <div class="input-group kui-max-w-sm">
                <span class="input-addon"><i class="fa fa-search" aria-hidden="true"></i></span>
                <input class="form-control" type="search" placeholder="搜索姓名或邮箱" aria-label="搜索成员">
            </div>
        </div>
        <div class="kui-toolbar__group">
            <button type="button" class="btn btn-default btn-sm"><i class="fa fa-download" aria-hidden="true"></i> 导出</button>
            <button type="button" class="btn btn-default btn-sm">停用</button>
            <button type="button" class="btn btn-danger btn-sm">移除</button>
        </div>
    </div>
    <header class="kui-page-header">
        <div class="kui-page-header__text">
            <h3 class="kui-page-header__title">团队成员</h3>
            <p class="kui-page-header__desc">页头右侧放主操作，左侧留给标题与说明；按钮之间由 .kui-page-header__actions 给出固定间距。</p>
        </div>
        <div class="kui-page-header__actions">
            <button type="button" class="btn btn-default btn-sm">批量导入</button>
            <button type="button" class="btn btn-primary btn-sm"><i class="fa fa-plus" aria-hidden="true"></i> 邀请成员</button>
        </div>
    </header>
</div>`,
})}

${demo({
    title: '开关按钮',
    desc: '开关按钮用 aria-pressed 表达按下，用 .is-active 表达选中；单个开关切换语义色，成组开关放进 .btn-group，互不干扰。',
    tags: ['aria-pressed', '.is-active', '.btn-group'],
    script: `
const subscribe = document.querySelector<HTMLButtonElement>('[data-btn-subscribe]')

subscribe?.addEventListener('click', () => {
    const pressed = subscribe.getAttribute('aria-pressed') === 'true'
    subscribe.setAttribute('aria-pressed', String(!pressed))
    subscribe.classList.toggle('btn-primary', !pressed)
    subscribe.classList.toggle('btn-default', pressed)
    subscribe.querySelector('span')!.textContent = pressed ? '订阅周报' : '已订阅'
})

document.querySelectorAll<HTMLButtonElement>('[data-btn-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
        const pressed = button.getAttribute('aria-pressed') !== 'true'
        button.setAttribute('aria-pressed', String(pressed))
        button.classList.toggle('is-active', pressed)
    })
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-cluster">
        <button type="button" class="btn btn-default" data-btn-subscribe aria-pressed="false">
            <i class="fa fa-envelope-o" aria-hidden="true"></i> <span>订阅周报</span>
        </button>
        <span class="kui-stat__label">单个开关：按下后从默认变主色，动作名也换成结果名。</span>
    </div>
    <div class="kui-cluster">
        <div class="btn-group" role="group" aria-label="显示列">
            <button type="button" class="btn btn-default is-active" aria-pressed="true" data-btn-toggle>金额</button>
            <button type="button" class="btn btn-default is-active" aria-pressed="true" data-btn-toggle>渠道</button>
            <button type="button" class="btn btn-default" aria-pressed="false" data-btn-toggle>退款率</button>
            <button type="button" class="btn btn-default" aria-pressed="false" data-btn-toggle>负责人</button>
        </div>
        <span class="kui-stat__label">成组开关：可以同时按下多个，按钮组只负责把它们排在一起。</span>
    </div>
</div>`,
})}

${propsTable([
    { name: '.btn-primary / -success / -info / -warning / -danger / -dark', type: 'class', defaultValue: 'default', desc: '实心语义按钮，按业务含义选择，不按颜色喜好选择。' },
    { name: '.btn-outline', type: 'class', defaultValue: '—', desc: '与任意语义色组合得到描边版本，用于次级操作。' },
    { name: '.btn-ghost / .btn-link', type: 'class', defaultValue: '—', desc: '低视觉权重的文字型按钮。' },
    { name: '.btn-lg / .btn-sm / .btn-xs', type: 'class', defaultValue: '32px', desc: '三档尺寸：40 / 26 / 22px 高。' },
    { name: '.btn-round / .btn-squared / .btn-block', type: 'class', defaultValue: '—', desc: '胶囊圆角 / 直角 / 撑满容器。' },
    { name: '.btn-icon / .btn-circle', type: 'class', defaultValue: '—', desc: '正方形 / 圆形图标按钮，必须提供 <code>aria-label</code>。' },
    { name: '.is-loading', type: 'class', defaultValue: '—', desc: '纯视觉加载态，保留按钮原宽度并居中显示旋转指示。' },
    { name: ':disabled', type: 'attribute', defaultValue: '—', desc: '原生禁用，同时阻止指针事件与键盘触发。' },
    { name: '.btn-group', type: 'class', defaultValue: '—', desc: '把同一动作的多个取值拼成一组，<code>.is-active</code> 只在这里生效。' },
    { name: '.kui-toolbar / .kui-toolbar__group', type: 'class', defaultValue: '—', desc: '工具条：两端对齐，组内自动换行并保持 8px 间距。' },
    { name: '.kui-segmented', type: 'class', defaultValue: '—', desc: '互斥视图切换，选中项用 <code>.is-active</code>。' },
    { name: '.btn-animate-side', type: 'class', defaultValue: '—', desc: '悬停时文字左移、箭头滑入，用于「进入下一步」。' },
    { name: '.kui-cluster / .kui-stack', type: 'class', defaultValue: '12px / 16px', desc: '同一行与不同行之间的间距，按钮面板里成对使用。' },
    { name: 'Dropdown.getOrCreate(trigger, options)', type: 'method', defaultValue: 'bottom-start', desc: '按触发器取下拉实例，选项含 <code>placement</code>、<code>offset</code>、<code>autoClose</code>。' },
    { name: 'data-toggle="dropdown"', type: 'attribute', defaultValue: '—', desc: '标记下拉触发器；菜单默认取父级内的 <code>.dropdown-menu</code>。' },
    { name: 'data-target="#id"', type: 'attribute', defaultValue: '—', desc: '菜单不在父级内时（例如分裂式按钮）指向菜单元素。' },
    { name: 'aria-pressed', type: 'attribute', defaultValue: 'false', desc: '开关按钮的按下状态，与 <code>.is-active</code> 同步切换。' },
])}

`

    /* ---------- 图标按钮反馈 ---------- */
    const iconStatus = root.querySelector<HTMLElement>('[data-btn-icon-status]')
    root.querySelectorAll<HTMLButtonElement>('[data-btn-icon]').forEach((button) => {
        button.addEventListener('click', () => {
            if (iconStatus) {
                iconStatus.textContent = button.dataset.btnIconNote ?? '已执行'
            }
        })
    })

    /* ---------- 下拉按钮：真实实例 ---------- */
    root.querySelectorAll<HTMLElement>('[data-btn-menu]').forEach((trigger) => {
        trackComponent(Dropdown.getOrCreate(trigger, { placement: 'bottom-start' }))
    })

    /* ---------- 加载态 ---------- */
    const save = root.querySelector<HTMLButtonElement>('[data-btn-loading]')
    save?.addEventListener('click', () => {
        if (save.classList.contains('is-loading')) {
            return
        }
        save.classList.add('is-loading')
        save.disabled = true
        window.setTimeout(() => {
            save.classList.remove('is-loading')
            save.disabled = false
            save.textContent = '已保存'
        }, 1600)
    })

    /* ---------- 单选组合 ---------- */
    root.querySelectorAll<HTMLElement>('[data-btn-single]').forEach((group) => {
        group.addEventListener('click', (event) => {
            const button = (event.target as HTMLElement).closest('button')
            if (!button || !group.contains(button)) {
                return
            }
            group.querySelectorAll('button').forEach((item) => {
                const active = item === button
                item.classList.toggle('is-active', active)
                item.setAttribute('aria-pressed', String(active))
            })
            if (group.classList.contains('kui-segmented')) {
                const rangeText = root.querySelector<HTMLElement>('[data-btn-range]')
                if (rangeText) {
                    rangeText.textContent = `当前：${button.textContent?.trim() ?? ''}`
                }
            }
        })
    })

    /* ---------- 开关按钮 ---------- */
    const subscribe = root.querySelector<HTMLButtonElement>('[data-btn-subscribe]')
    subscribe?.addEventListener('click', () => {
        const pressed = subscribe.getAttribute('aria-pressed') === 'true'
        subscribe.setAttribute('aria-pressed', String(!pressed))
        subscribe.classList.toggle('btn-primary', !pressed)
        subscribe.classList.toggle('btn-default', pressed)
        const label = subscribe.querySelector('span')
        if (label) {
            label.textContent = pressed ? '订阅周报' : '已订阅'
        }
    })

    root.querySelectorAll<HTMLButtonElement>('[data-btn-toggle]').forEach((button) => {
        button.addEventListener('click', () => {
            const pressed = button.getAttribute('aria-pressed') !== 'true'
            button.setAttribute('aria-pressed', String(pressed))
            button.classList.toggle('is-active', pressed)
        })
    })
}
