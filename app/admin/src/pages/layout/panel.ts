import { Panel } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 面板。
 * 面板是内容区的标准卡片：标题区只放标题与操作，主体承载内容。
 * 折叠、全屏、刷新、关闭四个动作都走 Panel 实例的方法，
 * 页面只负责在按钮上调用它，不自己改类名，也不自己拼动画。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '面板把一块内容装进有边界的卡片：标题区只放标题与操作，主体承担内容，底栏只放与整块内容相关的动作。折叠、全屏、刷新、关闭都是 Panel 实例上的方法，按钮点下去就调用它们。',
    tags: ['Panel', '.panel', '.panel-actions', 'is-fullscreen'],
})}

${demo({
    title: '可操作面板：折叠、全屏、刷新、关闭',
    desc: '顶部工具条与标题区的图标调用同一组方法：折叠只收主体、全屏铺满视口、刷新进入加载态后替换主体、关闭只收起面板本身。动作完成后状态徽章与按钮文案同步更新。',
    tags: ['Panel', 'toggleContent()', 'toggleFullscreen()', 'load()/done()'],
    script: `
const host = document.querySelector<HTMLElement>('[data-panel-demo]')
const panelElement = host?.querySelector<HTMLElement>('.panel')
if (host && panelElement) {
    const panel = Panel.getOrCreate(panelElement)
    const state = host.querySelector<HTMLElement>('[data-panel-state]')
    const note = host.querySelector<HTMLElement>('[data-panel-note]')

    const setState = (text: string, hint: string) => {
        if (state) state.textContent = text
        if (note) note.textContent = hint
    }
    const setLabel = (action: string, text: string) => {
        host.querySelectorAll<HTMLElement>('[data-panel-action="' + action + '"] span').forEach((span) => {
            span.textContent = text
        })
    }
    const setIcon = (action: string, name: string) => {
        host.querySelectorAll<HTMLElement>('[data-panel-action="' + action + '"] i').forEach((icon) => {
            icon.className = 'fa ' + name
        })
    }
    const disableActions = (disabled: boolean) => {
        host.querySelectorAll<HTMLButtonElement>('[data-panel-action="collapse"], [data-panel-action="fullscreen"], [data-panel-action="refresh"]').forEach((button) => {
            button.disabled = disabled
        })
    }

    host.querySelectorAll<HTMLElement>('[data-panel-action]').forEach((button) => {
        button.addEventListener('click', () => {
            const action = button.dataset.panelAction
            if (action === 'collapse') {
                panel.toggleContent()
                const collapsed = panelElement.classList.contains('is-collapse')
                setState(collapsed ? '已折叠' : '展开', collapsed ? '主体收起，标题栏保留。' : '主体展开，高度回到内容高度。')
                setLabel('collapse', collapsed ? '展开' : '折叠')
                setIcon('collapse', collapsed ? 'fa-plus' : 'fa-minus')
                return
            }
            if (action === 'fullscreen') {
                panel.toggleFullscreen()
                const fullscreen = panelElement.classList.contains('is-fullscreen')
                setState(fullscreen ? '全屏' : '展开', fullscreen ? '面板铺满视口，用标题区同一个图标退出。' : '已退出全屏，布局回到原处。')
                setLabel('fullscreen', fullscreen ? '退出全屏' : '全屏')
                setIcon('fullscreen', fullscreen ? 'fa-compress' : 'fa-expand')
                return
            }
            if (action === 'refresh') {
                panel.element.classList.add('is-loading')
                setState('刷新中', '加载态期间整块面板不可交互，布局不塌陷。')
                window.setTimeout(() => {
                    panel.load('<p class="form-hint">最近刷新：42 单待发货，6 单超时。</p>')
                    panel.done()
                    setState('已刷新', '主体已替换，时间 ' + new Date().toLocaleTimeString('zh-CN') + '。')
                }, 700)
                return
            }

            panel.toggle()
            const closed = panelElement.classList.contains('is-close')
            setState(closed ? '已关闭' : '展开', closed ? '面板只收起自己，工具条仍在，可以随时重新打开。' : '面板已重新打开。')
            setLabel('close', closed ? '重新打开' : '关闭')
            setIcon('close', closed ? 'fa-undo' : 'fa-times')
            disableActions(closed)
        })
    })
}
`,
    html: `
<section class="kui-board kui-stack kui-stack--tight" data-panel-demo>
    <div class="kui-toolbar">
        <div class="kui-toolbar__group">
            <strong>面板操作</strong>
            <span class="badge badge-neutral" data-panel-state>展开</span>
            <span class="form-hint" data-panel-note>顶部按钮与标题区图标调用同一组方法。</span>
        </div>
        <div class="kui-toolbar__group">
            <button type="button" class="btn btn-default btn-sm" data-panel-action="collapse">
                <i class="fa fa-minus" aria-hidden="true"></i><span>折叠</span>
            </button>
            <button type="button" class="btn btn-default btn-sm" data-panel-action="fullscreen">
                <i class="fa fa-expand" aria-hidden="true"></i><span>全屏</span>
            </button>
            <button type="button" class="btn btn-default btn-sm" data-panel-action="refresh">
                <i class="fa fa-refresh" aria-hidden="true"></i><span>刷新</span>
            </button>
            <button type="button" class="btn btn-danger btn-outline btn-sm" data-panel-action="close">
                <i class="fa fa-times" aria-hidden="true"></i><span>关闭</span>
            </button>
        </div>
    </div>
    <section class="panel">
        <div class="panel-heading">
            <h3 class="panel-title">实时订单</h3>
            <div class="panel-actions">
                <button type="button" data-panel-action="refresh" aria-label="刷新"><i class="fa fa-refresh" aria-hidden="true"></i></button>
                <button type="button" data-panel-action="collapse" aria-label="折叠"><i class="fa fa-minus" aria-hidden="true"></i></button>
                <button type="button" data-panel-action="fullscreen" aria-label="全屏"><i class="fa fa-expand" aria-hidden="true"></i></button>
            </div>
        </div>
        <div class="panel-body">
            <ul class="kui-list kui-list--flush">
                <li class="kui-list__item">
                    <span class="kui-list__body">
                        <span class="kui-list__title">KUI-20481 · 秋季满减套装</span>
                        <span class="kui-list__meta">林澈 · 2 件 · 已付款</span>
                    </span>
                    <span class="kui-list__aside"><span class="badge badge-primary">待发货</span></span>
                </li>
                <li class="kui-list__item">
                    <span class="kui-list__body">
                        <span class="kui-list__title">KUI-20479 · 桌面收纳组合</span>
                        <span class="kui-list__meta">周昕 · 1 件 · 已付款</span>
                    </span>
                    <span class="kui-list__aside"><span class="badge badge-success">已发货</span></span>
                </li>
            </ul>
        </div>
        <div class="panel-footer">
            <button type="button" class="btn btn-default btn-sm">导出</button>
            <button type="button" class="btn btn-primary btn-sm">查看全部</button>
        </div>
    </section>
</section>`,
})}

${sectionTitle('面板状态', '折叠、加载与弱化都是面板自身的状态，页面不写第二套样式。')}

${demo({
    title: '弱化面板与原地刷新',
    desc: '浅底面板去掉描边与阴影，用来承载第二层信息；右侧面板的刷新按钮让面板进入加载态，数据到位后自动恢复，期间整块不可交互。',
    tags: ['.panel--muted', '.is-loading', 'Panel.load()'],
    html: `
<div class="kui-grid kui-grid--md">
    <section class="panel panel--muted">
        <div class="panel-heading">
            <h3 class="panel-title">弱化面板</h3>
            <div class="panel-actions"><span class="badge badge-neutral">panel--muted</span></div>
        </div>
        <div class="panel-body">没有阴影与描边，用来承载次要说明或嵌套内容，层级比主体低一层。</div>
    </section>
    <section class="panel">
        <div class="panel-heading">
            <h3 class="panel-title">原地刷新</h3>
            <div class="panel-actions">
                <button type="button" data-panel-reload aria-label="重新加载这块面板"><i class="fa fa-refresh" aria-hidden="true"></i></button>
            </div>
        </div>
        <div class="panel-body">点右上角的刷新图标：面板进入加载态，数据到位后自动恢复，过程中布局高度不变。</div>
    </section>
</div>`,
})}

${demo({
    title: '面板与分栏',
    desc: '两列都放面板时，主体列宽随窗口变化，辅助列固定宽度；每块面板都能单独折叠，标题区高度始终保持一致。',
    tags: ['.kui-split', '.panel-actions', 'data-panel-collapse'],
    html: `
<div class="kui-split kui-split--main-first" style="--kui-split-sidebar: 13rem">
    <section class="panel">
        <div class="panel-heading">
            <h3 class="panel-title">渠道表现</h3>
            <div class="panel-actions">
                <button type="button" data-panel-collapse aria-label="折叠渠道表现"><i class="fa fa-minus" aria-hidden="true"></i></button>
            </div>
        </div>
        <div class="panel-body">
            <div class="kui-stack kui-stack--tight">
                <div class="kui-cluster" style="--kui-cluster-justify: space-between">
                    <span class="form-hint">直营小程序</span>
                    <strong>182,400</strong>
                </div>
                <div class="progress progress-xs"><span class="progress-bar" style="width: 78%"></span></div>
                <div class="kui-cluster" style="--kui-cluster-justify: space-between">
                    <span class="form-hint">门店自提</span>
                    <strong>126,800</strong>
                </div>
                <div class="progress progress-xs"><span class="progress-bar" style="width: 54%"></span></div>
            </div>
        </div>
    </section>
    <aside class="panel">
        <div class="panel-heading">
            <h3 class="panel-title">说明</h3>
            <div class="panel-actions">
                <button type="button" data-panel-collapse aria-label="折叠说明"><i class="fa fa-minus" aria-hidden="true"></i></button>
            </div>
        </div>
        <div class="panel-body">辅助列只放解释与次要动作，避免与主体争夺注意力。</div>
    </aside>
</div>`,
})}

${callout('全屏后的面板会盖住页面其余部分，退出入口要留在面板自己身上：标题区的全屏图标会在 <code>fa-expand</code> 与 <code>fa-compress</code> 之间自动互换。关闭只给面板加 <code>.is-close</code>，不会销毁内容，重新打开时状态还在。')}

${propsTable([
    { name: 'loadingClass', type: 'string', defaultValue: 'is-loading', desc: '加载态类名，<code>done()</code> 时从这里移除。' },
    { name: 'toggleContent()', type: 'method', defaultValue: '—', desc: '折叠 / 展开主体，等价于切换 <code>.is-collapse</code>。' },
    { name: 'toggleFullscreen()', type: 'method', defaultValue: '—', desc: '进入 / 退出全屏，等价于切换 <code>.is-fullscreen</code>。' },
    { name: 'load(html) / done()', type: 'method', defaultValue: '—', desc: '替换 <code>.panel-body</code> 内容并结束加载态；两步分开调用可以保留可见的加载过程。' },
    { name: 'refresh(html?)', type: 'method', defaultValue: '—', desc: '一次完成「加载 · 替换 · 结束」，适合本地数据。' },
    { name: 'close() / open() / toggle()', type: 'method', defaultValue: '—', desc: '收起、重新打开与切换，类名为 <code>.is-close</code>。' },
    { name: '.is-collapse', type: 'class', defaultValue: '—', desc: '主体不占高度，标题栏保留。' },
    { name: '.is-fullscreen', type: 'class', defaultValue: '—', desc: '固定在视口内满屏展示，层级高于普通内容。' },
    { name: '.is-loading', type: 'class', defaultValue: '—', desc: '整体降低不透明度并阻止交互，布局不塌陷。' },
    { name: '.panel--muted', type: 'class', defaultValue: '—', desc: '去掉阴影与描边，用浅底表达第二层内容。' },
    { name: '.panel-actions > button', type: 'class', defaultValue: '—', desc: '标题区的图标按钮，24×24，悬停出现描边与浅底。' },
    { name: 'data-toggle="panel-*"', type: 'attribute', defaultValue: '—', desc: '声明式写法：<code>panel-collapse</code> / <code>panel-fullscreen</code> / <code>panel-refresh</code> / <code>panel-close</code>。' },
])}

`

    const host = root.querySelector<HTMLElement>('[data-panel-demo]')
    const panelElement = host?.querySelector<HTMLElement>('.panel')
    if (host && panelElement) {
        const panel = Panel.getOrCreate(panelElement)
        trackComponent(panel)
        const state = host.querySelector<HTMLElement>('[data-panel-state]')
        const note = host.querySelector<HTMLElement>('[data-panel-note]')

        const setState = (text: string, hint: string): void => {
            if (state) {
                state.textContent = text
            }
            if (note) {
                note.textContent = hint
            }
        }
        const setLabel = (action: string, text: string): void => {
            host.querySelectorAll<HTMLElement>('[data-panel-action="' + action + '"] span').forEach(span => {
                span.textContent = text
            })
        }
        const setIcon = (action: string, name: string): void => {
            host.querySelectorAll<HTMLElement>('[data-panel-action="' + action + '"] i').forEach(icon => {
                icon.className = 'fa ' + name
            })
        }
        const disableActions = (disabled: boolean): void => {
            host.querySelectorAll<HTMLButtonElement>(
                '[data-panel-action="collapse"], [data-panel-action="fullscreen"], [data-panel-action="refresh"]',
            ).forEach(button => {
                button.disabled = disabled
            })
        }

        host.querySelectorAll<HTMLElement>('[data-panel-action]').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.panelAction
                if (action === 'collapse') {
                    panel.toggleContent()
                    const collapsed = panelElement.classList.contains('is-collapse')
                    setState(collapsed ? '已折叠' : '展开', collapsed ? '主体收起，标题栏保留。' : '主体展开，高度回到内容高度。')
                    setLabel('collapse', collapsed ? '展开' : '折叠')
                    setIcon('collapse', collapsed ? 'fa-plus' : 'fa-minus')
                    return
                }
                if (action === 'fullscreen') {
                    panel.toggleFullscreen()
                    const fullscreen = panelElement.classList.contains('is-fullscreen')
                    setState(
                        fullscreen ? '全屏' : '展开',
                        fullscreen ? '面板铺满视口，用标题区同一个图标退出。' : '已退出全屏，布局回到原处。',
                    )
                    setLabel('fullscreen', fullscreen ? '退出全屏' : '全屏')
                    setIcon('fullscreen', fullscreen ? 'fa-compress' : 'fa-expand')
                    return
                }
                if (action === 'refresh') {
                    panel.element.classList.add('is-loading')
                    setState('刷新中', '加载态期间整块面板不可交互，布局不塌陷。')
                    window.setTimeout(() => {
                        panel.load('<p class="form-hint">最近刷新：42 单待发货，6 单超时。</p>')
                        panel.done()
                        setState('已刷新', '主体已替换，时间 ' + new Date().toLocaleTimeString('zh-CN') + '。')
                    }, 700)
                    return
                }

                panel.toggle()
                const closed = panelElement.classList.contains('is-close')
                setState(
                    closed ? '已关闭' : '展开',
                    closed ? '面板只收起自己，工具条仍在，可以随时重新打开。' : '面板已重新打开。',
                )
                setLabel('close', closed ? '重新打开' : '关闭')
                setIcon('close', closed ? 'fa-undo' : 'fa-times')
                disableActions(closed)
            })
        })
    }

    root.querySelectorAll<HTMLElement>('[data-panel-collapse]').forEach(button => {
        const element = button.closest<HTMLElement>('.panel')
        if (!element) {
            return
        }
        const panel = Panel.getOrCreate(element)
        trackComponent(panel)
        button.addEventListener('click', () => {
            panel.toggleContent()
            const collapsed = element.classList.contains('is-collapse')
            const icon = button.querySelector<HTMLElement>('i')
            if (icon) {
                icon.classList.toggle('fa-minus', !collapsed)
                icon.classList.toggle('fa-plus', collapsed)
            }
            button.setAttribute('aria-expanded', String(!collapsed))
        })
    })

    root.querySelectorAll<HTMLButtonElement>('[data-panel-reload]').forEach(button => {
        const element = button.closest<HTMLElement>('.panel')
        if (!element) {
            return
        }
        const panel = Panel.getOrCreate(element)
        trackComponent(panel)
        button.addEventListener('click', () => {
            button.disabled = true
            panel.element.classList.add('is-loading')
            window.setTimeout(() => {
                panel.load('<p class="form-hint">已重新加载 · ' + new Date().toLocaleTimeString('zh-CN') + '</p>')
                panel.done()
                button.disabled = false
            }, 700)
        })
    })
}
