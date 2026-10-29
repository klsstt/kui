import { IframeTabs, PjaxTabs, Tab } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 标签页。
 * 标签在同一条内容线上切换等价视图：触发器只声明「我要显示哪一块」，
 * 内容区同一时刻只显示一个面板；需要新增与关闭时，标签栏本身由页面维护，
 * 每次结构变化后重建 Tab 实例，键盘与焦点顺序因此始终跟着 DOM 走。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '标签页把同一块内容区切成若干等价视图。触发器只声明要显示哪个面板，激活态与方向键由 Tab 组件维护；标签需要新增、关闭或横向滚动时，由页面维护标签栏，并在结构变化后重建 Tab 实例。可关闭标签使用 li.kui-tabs__item + a + button.close 结构，标题与关闭合成一颗胶囊。',
    tags: ['Tab', '.kui-tabs__item', '.tab-pane', 'IframeTabs'],
})}

<style>
/* 标签页局部样式：关闭按钮与标题同处一颗胶囊，hover 只换颜色，不出现独立圆形底色块；只作用于本页 */
[data-tab-full] .kui-tabs__item > button.close,
[data-tab-iframe] .kui-tabs__item > button.close,
[data-tab-pjax] .kui-tabs__item > button.close {
    padding: 0;
    border-radius: var(--kui-seed-radius-sm);
}

[data-tab-full] .kui-tabs__item .close:hover,
[data-tab-iframe] .kui-tabs__item .close:hover,
[data-tab-pjax] .kui-tabs__item .close:hover {
    background: transparent;
    color: var(--kui-color-primary);
}
</style>

${demo({
    title: '基础标签页',
    desc: '触发器用 data-toggle="tab" 指向面板 id；激活类加在 li 与面板上，其余状态由组件同步。基础示例与可关闭示例共用 li.kui-tabs__item 结构，只是这里没有关闭按钮。',
    tags: ['.nav', '.kui-tabs__item', '.tab-pane'],
    script: `
document.querySelectorAll<HTMLElement>('[data-tab-basic] [data-toggle="tab"]').forEach((trigger) => {
    const tab = Tab.getOrCreate(trigger)
    trigger.addEventListener('click', (event) => {
        event.preventDefault()
        tab.show()
    })
})
`,
    html: `
<div class="kui-board">
    <ul class="nav" data-tab-basic>
        <li class="kui-tabs__item active"><a class="kui-nowrap" href="#tab-basic-overview" data-toggle="tab">概览</a></li>
        <li class="kui-tabs__item"><a class="kui-nowrap" href="#tab-basic-activity" data-toggle="tab">动态</a></li>
        <li class="kui-tabs__item"><a class="kui-nowrap" href="#tab-basic-settings" data-toggle="tab">设置</a></li>
    </ul>
    <div class="kui-stack kui-stack--tight" data-tab-basic-panes>
        <div class="tab-pane active" id="tab-basic-overview">
            <div class="kui-stack kui-stack--tight">
                <p class="form-hint">概览面板：订单总量、发货进度与异常单数放在同一屏里。</p>
                <div class="kui-grid kui-grid--sm">
                    <div class="kui-board">待发货 · 42</div>
                    <div class="kui-board">已发货 · 318</div>
                    <div class="kui-board">异常 · 6</div>
                </div>
            </div>
        </div>
        <div class="tab-pane" id="tab-basic-activity">
            <ul class="kui-list kui-list--flush">
                <li class="kui-list__item">
                    <span class="kui-list__body">
                        <span class="kui-list__title">批量合并了 3 个包裹</span>
                        <span class="kui-list__meta">系统 · 9 分钟前</span>
                    </span>
                </li>
                <li class="kui-list__item">
                    <span class="kui-list__body">
                        <span class="kui-list__title">打印了 12 张面单</span>
                        <span class="kui-list__meta">林澈 · 32 分钟前</span>
                    </span>
                </li>
            </ul>
        </div>
        <div class="tab-pane" id="tab-basic-settings">
            <div class="kui-cluster">
                <span class="badge badge-neutral">自动合并包裹</span>
                <span class="badge badge-neutral">打印后自动发货</span>
                <span class="badge badge-neutral">异常单提醒</span>
            </div>
        </div>
    </div>
</div>`,
})}

${demo({
    title: '完整标签页：新增、关闭与横向滚动',
    desc: '关闭按钮是 li 内的独立 button.close，与标题同处一颗胶囊：激活底色由 li 承担，标题与 x 之间没有第二层按钮底色。加号插入新标签并立即激活；键盘用 Delete 关闭当前标签；标签多到放不下时，左右两侧出现滚动按钮。切换、新增、关闭之后都先 dispose 再 getOrCreate，重建整组 Tab 实例。',
    tags: ['li.kui-tabs__item', 'button.close', 'scrollBy()'],
    script: `
const host = document.querySelector<HTMLElement>('[data-tab-full]')
const nav = host?.querySelector<HTMLElement>('[data-tab-nav]')
const viewport = host?.querySelector<HTMLElement>('[data-tab-viewport]')
const panes = host?.querySelector<HTMLElement>('[data-tab-panes]')
const titles = ['客户', '活动', '结算', '分析', '通知', '权限']
let seq = nav ? nav.querySelectorAll('li').length : 0

const applyToolbarSemantics = () => {
    if (!nav) return
    nav.setAttribute('role', 'toolbar')
    nav.setAttribute('aria-label', '标签栏')
    nav.querySelectorAll<HTMLElement>('li').forEach((item) => item.setAttribute('role', 'none'))
    nav.querySelectorAll<HTMLElement>('a[data-tab-trigger]').forEach((trigger) => {
        trigger.setAttribute('role', 'button')
        trigger.setAttribute('aria-pressed', String(trigger.closest('li')?.classList.contains('active') ?? false))
    })
}

const rebuild = () => {
    applyToolbarSemantics()
}

const syncScroll = () => {
    if (!viewport) return
    const left = host?.querySelector<HTMLElement>('[data-tab-scroll="-1"]')
    const right = host?.querySelector<HTMLElement>('[data-tab-scroll="1"]')
    if (!left || !right) return
    const overflowing = viewport.scrollWidth > viewport.clientWidth + 1
    left.hidden = !overflowing || viewport.scrollLeft <= 0
    right.hidden = !overflowing || viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 1
}

const showTab = (item: HTMLElement | null) => {
    if (!item || !nav) return
    const trigger = item.querySelector<HTMLElement>('a[data-tab-trigger]')
    const href = trigger?.getAttribute('href')
    if (!href) return
    nav.querySelectorAll<HTMLElement>('li').forEach((li) => li.classList.toggle('active', li === item))
    panes?.querySelectorAll<HTMLElement>('.tab-pane').forEach((pane) => pane.classList.toggle('active', '#' + pane.id === href))
    applyToolbarSemantics()
}

const closeTab = (item: HTMLElement) => {
    const wasActive = item.classList.contains('active')
    const fallback = item.nextElementSibling ?? item.previousElementSibling
    const href = item.querySelector('a')?.getAttribute('href')
    item.remove()
    if (href) document.querySelector(href)?.remove()
    rebuild()
    if (wasActive) showTab(fallback as HTMLElement | null)
    syncScroll()
}

nav?.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const close = target.closest<HTMLElement>('[data-tab-close]')
    if (close) {
        event.preventDefault()
        const item = close.closest('li')
        if (item) closeTab(item)
        return
    }
    const trigger = target.closest<HTMLElement>('a[data-tab-trigger]')
    if (!trigger) return
    event.preventDefault()
    const item = trigger.closest<HTMLElement>('li')
    if (item) showTab(item)
    syncScroll()
})

nav?.addEventListener('keydown', (event) => {
    if (event.key !== 'Delete') return
    const close = nav.querySelector<HTMLElement>('li.active [data-tab-close]')
    if (!close) return
    event.preventDefault()
    close.click()
})

host?.querySelectorAll<HTMLElement>('[data-tab-scroll]').forEach((button) => {
    button.addEventListener('click', () => {
        if (!viewport) return
        const step = Number(button.dataset.tabScroll ?? 1) * viewport.clientWidth * 0.6
        viewport.scrollBy({ left: step, behavior: 'smooth' })
    })
})

host?.querySelector<HTMLElement>('[data-tab-add]')?.addEventListener('click', () => {
    if (!nav || !panes) return
    seq += 1
    const title = titles[(seq - 1) % titles.length] + ' · ' + seq
    const paneId = 'tab-pane-' + seq
    const item = document.createElement('li')
    item.className = 'kui-tabs__item'
    item.innerHTML =
        '<a class="kui-nowrap" href="#' + paneId + '" data-tab-trigger>' + title + '</a>' +
        '<button type="button" class="close" data-tab-close aria-label="关闭 ' + title + '"><i class="fa fa-times" aria-hidden="true"></i></button>'
    nav.append(item)
    panes.insertAdjacentHTML('beforeend', '<div class="tab-pane" id="' + paneId + '"><p class="form-hint">新增面板：标签 ' + seq + ' 的内容按需创建。</p></div>')
    rebuild()
    showTab(item)
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    syncScroll()
})

viewport?.addEventListener('scroll', syncScroll)

// Tab 实例在挂载时会重写 role；可关闭标签保持 toolbar 语义，监听后覆盖回来。
if (nav) {
    new MutationObserver(() => {
        if (nav.getAttribute('role') === 'tablist') applyToolbarSemantics()
    }).observe(nav, { attributes: true, attributeFilter: ['role'] })
}

rebuild()
syncScroll()
`,
    html: `
<section class="kui-board kui-stack kui-stack--tight" data-tab-full>
    <div class="kui-cluster" style="--kui-cluster-gap: var(--kui-space-2)">
        <button type="button" class="btn btn-default btn-icon" data-tab-scroll="-1" aria-label="向左滚动标签栏" hidden>
            <i class="fa fa-angle-left" aria-hidden="true"></i>
        </button>
        <div class="kui-scroll-auto" style="max-width: 22rem" tabindex="0" role="region" aria-label="标签栏，可横向滚动" data-tab-viewport>
            <ul class="nav" data-tab-nav>
                <li class="kui-tabs__item active">
                    <a class="kui-nowrap" href="#tab-pane-overview" data-tab-trigger>概览</a>
                    <button type="button" class="close" data-tab-close aria-label="关闭 概览"><i class="fa fa-times" aria-hidden="true"></i></button>
                </li>
                <li class="kui-tabs__item">
                    <a class="kui-nowrap" href="#tab-pane-orders" data-tab-trigger>订单</a>
                    <button type="button" class="close" data-tab-close aria-label="关闭 订单"><i class="fa fa-times" aria-hidden="true"></i></button>
                </li>
                <li class="kui-tabs__item">
                    <a class="kui-nowrap" href="#tab-pane-refunds" data-tab-trigger>退款</a>
                    <button type="button" class="close" data-tab-close aria-label="关闭 退款"><i class="fa fa-times" aria-hidden="true"></i></button>
                </li>
                <li class="kui-tabs__item">
                    <a class="kui-nowrap" href="#tab-pane-stock" data-tab-trigger>库存</a>
                    <button type="button" class="close" data-tab-close aria-label="关闭 库存"><i class="fa fa-times" aria-hidden="true"></i></button>
                </li>
                <li class="kui-tabs__item">
                    <a class="kui-nowrap" href="#tab-pane-report" data-tab-trigger>报表</a>
                    <button type="button" class="close" data-tab-close aria-label="关闭 报表"><i class="fa fa-times" aria-hidden="true"></i></button>
                </li>
                <li class="kui-tabs__item">
                    <a class="kui-nowrap" href="#tab-pane-log" data-tab-trigger>日志</a>
                    <button type="button" class="close" data-tab-close aria-label="关闭 日志"><i class="fa fa-times" aria-hidden="true"></i></button>
                </li>
                <li class="kui-tabs__item">
                    <a class="kui-nowrap" href="#tab-pane-purchase" data-tab-trigger>采购</a>
                    <button type="button" class="close" data-tab-close aria-label="关闭 采购"><i class="fa fa-times" aria-hidden="true"></i></button>
                </li>
                <li class="kui-tabs__item">
                    <a class="kui-nowrap" href="#tab-pane-service" data-tab-trigger>售后</a>
                    <button type="button" class="close" data-tab-close aria-label="关闭 售后"><i class="fa fa-times" aria-hidden="true"></i></button>
                </li>
            </ul>
        </div>
        <button type="button" class="btn btn-default btn-icon" data-tab-scroll="1" aria-label="向右滚动标签栏" hidden>
            <i class="fa fa-angle-right" aria-hidden="true"></i>
        </button>
        <button type="button" class="btn btn-primary btn-icon" data-tab-add aria-label="新增标签">
            <i class="fa fa-plus" aria-hidden="true"></i>
        </button>
    </div>
    <div class="kui-stack kui-stack--tight" data-tab-panes>
        <div class="tab-pane active" id="tab-pane-overview">
            <div class="kui-stack kui-stack--tight">
                <p class="form-hint">概览面板：标签栏可以横向滚动，内容区同一时刻只显示一个面板。</p>
                <div class="kui-grid kui-grid--sm">
                    <div class="kui-board">待发货 · 42</div>
                    <div class="kui-board">已发货 · 318</div>
                    <div class="kui-board">异常 · 6</div>
                </div>
            </div>
        </div>
        <div class="tab-pane" id="tab-pane-orders"><p class="form-hint">订单面板：按渠道与状态筛选，结果保留在当前标签里。</p></div>
        <div class="tab-pane" id="tab-pane-refunds"><p class="form-hint">退款面板：待审核的退款单集中在这里处理。</p></div>
        <div class="tab-pane" id="tab-pane-stock"><p class="form-hint">库存面板：低于安全库存的 SKU 会单独列出。</p></div>
        <div class="tab-pane" id="tab-pane-report"><p class="form-hint">报表面板：导出任务在后台执行，完成后通知。</p></div>
        <div class="tab-pane" id="tab-pane-log"><p class="form-hint">日志面板：最近 7 天的操作记录，支持按成员筛选。</p></div>
        <div class="tab-pane" id="tab-pane-purchase"><p class="form-hint">采购面板：待到货的采购单按供应商分组。</p></div>
        <div class="tab-pane" id="tab-pane-service"><p class="form-hint">售后面板：退换货与维修进度合并展示。</p></div>
    </div>
</section>`,
})}

${sectionTitle('容器型标签页', '需要嵌入完整页面或远程片段时，标签栏与内容区由容器统一管理，页面不自己拼 iframe。')}

${demo({
    title: 'iframe 标签页',
    desc: '每个标签承载一个独立页面，切换时不销毁 iframe，滚动位置与页面内部状态都会保留。关闭按钮由容器生成，这里统一换成同一个图标；容器生成的同样是 li.kui-tabs__item + a + button.close 结构。',
    tags: ['IframeTabs', '.kui-iframe-tabs', 'persist'],
    script: `
const host = document.querySelector<HTMLElement>('[data-tab-iframe]')
if (host) {
    const tabs = IframeTabs.getOrCreate(host, { persist: false })
    const embedUrl = (page: string) => window.location.pathname + '?embed=1#/' + page
    tabs.open({ id: 'tab-iframe-buttons', title: '按钮', url: embedUrl('buttons') })
    tabs.open({ id: 'tab-iframe-dashboard', title: '工作台', url: embedUrl('dashboard') })
    host.querySelectorAll<HTMLElement>('[data-kui-close-tab]').forEach((close) => {
        close.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>'
    })
}
`,
    html: `
<div class="kui-iframe-tabs" data-tab-iframe>
    <ul class="kui-iframe-tabs__nav" role="tablist"></ul>
    <div class="kui-iframe-tabs__content"></div>
</div>`,
})}

${demo({
    title: '异步标签页',
    desc: '标签内容按需请求：打开时先显示加载模板，失败时显示错误模板，已加载的标签不会重复请求；重复打开同一个标签只会切回它。关闭按钮同样统一成 fa-times。',
    tags: ['PjaxTabs', 'fetcher', 'loadingTemplate'],
    script: `
const host = document.querySelector<HTMLElement>('[data-tab-pjax]')
if (host) {
    const tabs = PjaxTabs.getOrCreate(host, {
        persist: false,
        loadingTemplate: '<div class="kui-tabs__loading">正在加载…</div>',
        fetcher: async (url) => {
            await new Promise((resolve) => window.setTimeout(resolve, 500))
            return '<strong>已加载 ' + url + '</strong><p class="form-hint">内容由 fetcher 返回，失败时换成 errorTemplate。</p>'
        },
    })
    void tabs.open({ id: 'tab-pjax-orders', title: '订单', url: '/orders' })
    void tabs.open({ id: 'tab-pjax-refunds', title: '退款', url: '/refunds' })
    host.querySelectorAll<HTMLElement>('[data-kui-close-tab]').forEach((close) => {
        close.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>'
    })
}
`,
    html: `
<div class="kui-pjax-tabs" data-tab-pjax>
    <ul class="kui-pjax-tabs__nav" role="tablist"></ul>
    <div class="kui-pjax-tabs__content"></div>
</div>`,
})}

${callout('新增与关闭都会改变标签栏的 DOM，因此每次结构变化后要<strong>先 dispose、再 getOrCreate</strong>：旧实例的方向键监听与 roving tabindex 会跟着旧结构失效，重建之后焦点顺序才与实际顺序一致。关闭按钮是 <code>li</code> 内的独立 <code>button.close</code>，不在触发器的 <code>a</code> 里面，所以点 x 不会顺带切换标签；激活底色只加在 <code>li</code> 上，标题与 x 共用同一颗胶囊。')}

${propsTable([
    { name: 'activeClass', type: 'string', defaultValue: 'active', desc: '触发器与 <code>li</code> 上的激活类名。' },
    { name: 'paneActiveClass', type: 'string', defaultValue: 'active', desc: '面板上的激活类名，同时切换 <code>hidden</code>。' },
    { name: '--kui-tab-active-radius', type: 'attribute', defaultValue: '0px', desc: '激活标签的上圆角，容器需要贴合时改这一个值。' },
    { name: '.nav', type: 'class', defaultValue: '—', desc: '标签栏容器，激活态用 <code>li.active</code> 标记。' },
    { name: '.kui-tabs__item', type: 'class', defaultValue: '—', desc: '标签项：<code>a</code> / <code>button</code> 触发器 + <code>button.close</code> 合成一颗胶囊，激活类加在 <code>li</code> 上。' },
    { name: '.kui-tabs__item .close', type: 'class', defaultValue: '—', desc: '关闭按钮：与标题同处一颗胶囊，hover 只换颜色，不出现独立圆形底色块。' },
    { name: '.tab-pane', type: 'class', defaultValue: '—', desc: '面板容器，非激活时 <code>display: none</code>。' },
    { name: 'data-toggle="tab"', type: 'attribute', defaultValue: '—', desc: '声明触发器，<code>href</code> 指向面板 id。' },
    { name: 'data-tab-close', type: 'attribute', defaultValue: '—', desc: '关闭按钮的标记，点击后移除 <code>li</code> 与对应面板，再按当前 DOM 重建实例。' },
    { name: 'show() / dispose()', type: 'method', defaultValue: '—', desc: '切换面板与释放实例；新增、关闭后按当前 DOM 重建。' },
])}

${propsTable(
    [
        { name: 'open(descriptor)', type: 'method', defaultValue: '—', desc: '打开一个标签：<code>{ id, title, url, closable }</code>。' },
        { name: 'closable', type: 'boolean', defaultValue: 'true', desc: '是否显示关闭按钮，关闭后自动切到相邻标签。' },
        { name: 'persist', type: 'boolean', defaultValue: 'true', desc: '把已打开的标签写入 localStorage，刷新后恢复；文档示例关闭它。' },
        { name: 'storageKey', type: 'string', defaultValue: 'kui.iframe.kTabs', desc: '恢复时使用的存储键，多个容器需要区分。' },
        { name: 'fetcher', type: 'function', defaultValue: 'fetch', desc: '异步标签页的取数函数，返回 HTML 片段或节点。' },
        { name: 'loadingTemplate / errorTemplate', type: 'string', defaultValue: 'Loading... / Error...', desc: '加载中与失败时插入的模板。' },
        { name: 'close(id) / closeOthers()', type: 'method', defaultValue: '—', desc: '关闭指定标签、只保留当前标签。' },
        { name: 'reload(id?)', type: 'method', defaultValue: '—', desc: '重新加载 iframe 或重新请求异步内容。' },
    ],
    '容器 API',
)}

`

    const basicTriggers = root.querySelectorAll<HTMLElement>('[data-tab-basic] [data-toggle="tab"]')
    basicTriggers.forEach(trigger => {
        const tab = Tab.getOrCreate(trigger)
        trackComponent(tab)
        trigger.addEventListener('click', event => {
            event.preventDefault()
            tab.show()
        })
    })

    const host = root.querySelector<HTMLElement>('[data-tab-full]')
    const nav = host?.querySelector<HTMLElement>('[data-tab-nav]')
    const viewport = host?.querySelector<HTMLElement>('[data-tab-viewport]')
    const panes = host?.querySelector<HTMLElement>('[data-tab-panes]')
    if (host && nav && viewport && panes) {
        const left = host.querySelector<HTMLElement>('[data-tab-scroll="-1"]')
        const right = host.querySelector<HTMLElement>('[data-tab-scroll="1"]')
        const addButton = host.querySelector<HTMLElement>('[data-tab-add]')
        const titles = ['客户', '活动', '结算', '分析', '通知', '权限']
        let seq = nav.querySelectorAll('li').length

        const applyToolbar = (): void => {
            nav.setAttribute('role', 'toolbar')
            nav.setAttribute('aria-label', '标签栏')
            nav.querySelectorAll<HTMLElement>('li').forEach((item) => item.setAttribute('role', 'none'))
            nav.querySelectorAll<HTMLElement>('a[data-tab-trigger]').forEach((trigger) => {
                trigger.setAttribute('role', 'button')
                trigger.setAttribute('aria-pressed', String(trigger.closest('li')?.classList.contains('active') ?? false))
            })
        }

        const rebuild = (): void => {
            applyToolbar()
        }

        const syncScroll = (): void => {
            if (!left || !right) {
                return
            }
            const overflowing = viewport.scrollWidth > viewport.clientWidth + 1
            left.hidden = !overflowing || viewport.scrollLeft <= 0
            right.hidden = !overflowing || viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 1
        }

        const showTab = (item: HTMLElement | null): void => {
            if (!item) return
            const trigger = item.querySelector<HTMLElement>('a[data-tab-trigger]')
            const href = trigger?.getAttribute('href')
            if (!href) return
            nav.querySelectorAll<HTMLElement>('li').forEach((li) => li.classList.toggle('active', li === item))
            panes.querySelectorAll<HTMLElement>('.tab-pane').forEach((pane) => pane.classList.toggle('active', '#' + pane.id === href))
            applyToolbar()
        }

        const closeTab = (item: HTMLElement): void => {
            const wasActive = item.classList.contains('active')
            const fallback = (item.nextElementSibling ?? item.previousElementSibling) as HTMLElement | null
            const href = item.querySelector('a')?.getAttribute('href')
            item.remove()
            if (href) {
                root.querySelector(href)?.remove()
            }
            rebuild()
            if (wasActive) {
                showTab(fallback)
            }
            syncScroll()
        }

        nav.addEventListener('click', event => {
            const target = event.target
            if (!(target instanceof Element)) {
                return
            }
            const close = target.closest<HTMLElement>('[data-tab-close]')
            if (close) {
                event.preventDefault()
                const item = close.closest('li')
                if (item) {
                    closeTab(item)
                }
                return
            }
            const trigger = target.closest<HTMLElement>('a[data-tab-trigger]')
            if (!trigger) {
                return
            }
            event.preventDefault()
            showTab(trigger.closest<HTMLElement>('li'))
            syncScroll()
        })

        nav.addEventListener('keydown', event => {
            if (event.key !== 'Delete') {
                return
            }
            const close = nav.querySelector<HTMLElement>('li.active [data-tab-close]')
            if (!close) {
                return
            }
            event.preventDefault()
            close.click()
        })

        host.querySelectorAll<HTMLElement>('[data-tab-scroll]').forEach(button => {
            button.addEventListener('click', () => {
                const step = Number(button.dataset.tabScroll ?? 1) * viewport.clientWidth * 0.6
                viewport.scrollBy({ left: step, behavior: 'smooth' })
            })
        })

        addButton?.addEventListener('click', () => {
            seq += 1
            const title = titles[(seq - 1) % titles.length] + ' · ' + seq
            const paneId = 'tab-pane-' + seq
            const item = document.createElement('li')
            item.className = 'kui-tabs__item'
            item.innerHTML =
                '<a class="kui-nowrap" href="#' + paneId + '" data-tab-trigger>' + title + '</a>' +
                '<button type="button" class="close" data-tab-close aria-label="关闭 ' + title + '"><i class="fa fa-times" aria-hidden="true"></i></button>'
            nav.append(item)
            panes.insertAdjacentHTML(
                'beforeend',
                '<div class="tab-pane" id="' + paneId + '"><p class="form-hint">新增面板：标签 ' + seq + ' 的内容按需创建。</p></div>',
            )
            rebuild()
            showTab(item)
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
            syncScroll()
        })

        viewport.addEventListener('scroll', syncScroll)
        rebuild()
        syncScroll()
    }

    const iframeHost = root.querySelector<HTMLElement>('[data-tab-iframe]')
    if (iframeHost) {
        const tabs = IframeTabs.getOrCreate(iframeHost, { persist: false })
        trackComponent(tabs)
        const embedUrl = (page: string): string => window.location.pathname + '?embed=1#/' + page
        tabs.open({ id: 'tab-iframe-buttons', title: '按钮', url: embedUrl('buttons') })
        tabs.open({ id: 'tab-iframe-dashboard', title: '工作台', url: embedUrl('dashboard') })
        iframeHost.querySelectorAll<HTMLElement>('[data-kui-close-tab]').forEach(close => {
            close.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>'
        })
    }

    const pjaxHost = root.querySelector<HTMLElement>('[data-tab-pjax]')
    if (pjaxHost) {
        const tabs = PjaxTabs.getOrCreate(pjaxHost, {
            persist: false,
            loadingTemplate: '<div class="kui-tabs__loading">正在加载…</div>',
            fetcher: async url => {
                await new Promise(resolve => window.setTimeout(resolve, 500))
                return (
                    '<strong>已加载 ' +
                    url +
                    '</strong><p class="form-hint">内容由 fetcher 返回，失败时换成 errorTemplate。</p>'
                )
            },
        })
        trackComponent(tabs)
        void tabs.open({ id: 'tab-pjax-orders', title: '订单', url: '/orders' })
        void tabs.open({ id: 'tab-pjax-refunds', title: '退款', url: '/refunds' })
        pjaxHost.querySelectorAll<HTMLElement>('[data-kui-close-tab]').forEach(close => {
            close.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>'
        })
    }
}
