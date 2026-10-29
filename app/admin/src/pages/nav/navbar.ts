import { Collapse } from '@kui/core'
import { trackComponent, trackDispose } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'
import { initNavbarTree } from './navbar-tree'
import navbarTreeSource from './navbar-tree.ts?raw'

/**
 * 导航条。
 * 应用级的一级入口放在顶部导航里：品牌、主导航、右侧动作三段；
 * 左侧的树形导航负责「当前在哪一层」，两者共用同一套按钮与选中态。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '导航条承载应用级的一级入口，树形导航承载层级入口。所有可点击行都用原生 button：默认、悬停与激活三种状态只换底色与文字色，点击不会出现文本光标。点一下就把激活态移过去，不需要把某一项做成不可点。',
    tags: ['.navbar', '.navbar-nav', '.navbar-sidebar', '.navbar-toggler'],
})}

<style>
/* 导航页面局部样式：可点击行统一 pointer，且不出现文本光标；只作用于本页 */
[data-nav-nav] .navbar-nav > li > button,
[data-nav-mobile-region] .navbar-link {
    cursor: pointer;
    user-select: none;
}
</style>

${demo({
    title: '顶部导航：点哪里，选中态就到哪里',
    desc: '中部导航用 li.active 表示当前模块；点击任意一项，激活类与 aria-current 一起移动，右侧状态同步显示当前模块。按钮是原生 button，悬停只换底色，不改变字号与位置，也不会出现文本光标。',
    tags: ['.navbar', '.navbar-nav', '.navbar-actions', 'button'],
    script: `
document.querySelectorAll<HTMLElement>('[data-nav-nav]').forEach((nav) => {
    const current = nav.querySelector<HTMLElement>('[data-nav-current]')
    nav.querySelectorAll<HTMLElement>('[data-nav-select]').forEach((button) => {
        button.addEventListener('click', () => {
            nav.querySelectorAll<HTMLElement>('[data-nav-select]').forEach((item) => {
                item.classList.remove('is-active')
                item.closest('li')?.classList.remove('active')
                item.removeAttribute('aria-current')
            })
            button.classList.add('is-active')
            button.closest('li')?.classList.add('active')
            button.setAttribute('aria-current', 'page')
            if (current) current.textContent = '当前：' + (button.textContent ?? '').trim()
        })
    })
})
`,
    html: `
<nav class="navbar" aria-label="主导航" data-nav-nav>
    <span class="navbar-brand">
        <span class="navbar-brand__mark">K</span>
        KUI 控制台
    </span>
    <ul class="navbar-nav">
        <li class="active"><button type="button" class="navbar-link is-active" data-nav-select aria-current="page">工作台</button></li>
        <li><button type="button" class="navbar-link" data-nav-select>订单</button></li>
        <li><button type="button" class="navbar-link" data-nav-select>客户</button></li>
        <li><button type="button" class="navbar-link" data-nav-select>报表</button></li>
    </ul>
    <span class="navbar-spacer"></span>
    <div class="navbar-actions">
        <span class="badge badge-neutral" data-nav-current>当前：工作台</span>
        <button type="button" class="btn btn-primary btn-sm"><i class="fa fa-plus" aria-hidden="true"></i> 新建</button>
    </div>
</nav>`,
})}

${sectionTitle('导航条变体', '深色用于工作区外壳，描边版本用于需要与内容贴合的场景；结构、间距与焦点环都不变。')}

${demo({
    title: '深色与描边',
    desc: '深色版本只反转文字与悬停底色，描边版本去掉圆角与阴影、只保留一条底边。两者都保留同一套可点击的选中态，导航项仍然是 button。',
    tags: ['.navbar--dark', '.navbar--bordered'],
    html: `
<div class="kui-stack">
    <nav class="navbar navbar--dark" aria-label="深色导航" data-nav-nav>
        <span class="navbar-brand">
            <span class="navbar-brand__mark">K</span>
            KUI 工作区
        </span>
        <ul class="navbar-nav">
            <li class="active"><button type="button" class="navbar-link is-active" data-nav-select aria-current="page">概览</button></li>
            <li><button type="button" class="navbar-link" data-nav-select>数据</button></li>
            <li><button type="button" class="navbar-link" data-nav-select>设置</button></li>
        </ul>
        <span class="navbar-spacer"></span>
        <div class="navbar-actions"><span class="badge badge-count">3</span></div>
    </nav>
    <nav class="navbar navbar--bordered" aria-label="描边导航" data-nav-nav>
        <ul class="navbar-nav">
            <li><button type="button" class="navbar-link" data-nav-select>全部</button></li>
            <li class="active"><button type="button" class="navbar-link is-active" data-nav-select aria-current="page">进行中</button></li>
            <li><button type="button" class="navbar-link" data-nav-select>已完成</button></li>
        </ul>
        <span class="navbar-spacer"></span>
        <div class="navbar-actions"><span class="form-hint">共 128 条</span></div>
    </nav>
</div>`,
})}

${demo({
    title: '左侧树形导航：目录与图标侧栏',
    desc: '沿用组件库侧栏的分组图标、固定图标与浅色选中态。收起后保留分组和独立入口图标，点击分组图标展开对应目录，恢复原来的选中项和分组状态。Tab 依次访问按钮，Enter / Space 操做，Escape 收起并回到侧边栏开关，窄容器中展开的目录与内容上下排列。',
    tags: ['.navbar-sidebar', '.navbar-sidebar-layout.is-collapsed', '.aria-expanded', 'aria-current'],
    script: navbarTreeSource +`
const treeHost = document.querySelector<HTMLElement>('[data-nav-tree-demo]')
if (treeHost) initNavbarTree(treeHost)
`,
    html: `
<div class="navbar-sidebar-container">
<div class="navbar-sidebar-layout" data-nav-tree-demo>
    <aside class="navbar-sidebar" data-nav-sidebar>
        <header>
            <span class="navbar-sidebar__label">组件目录</span>
            <button type="button" class="navbar-sidebar__toggle" data-nav-sidebar-toggle aria-controls="nav-example-sidebar" aria-expanded="true" aria-label="收起侧栏" title="收起侧栏"><i class="fa fa-angle-double-left" aria-hidden="true"></i></button>
        </header>
        <nav id="nav-example-sidebar" aria-label="示例组件目录">
        <ul class="navbar-sidebar__list" data-nav-tree>
            <li class="open has-current">
                <button type="button" class="navbar-link navbar-sidebar__group" data-nav-tree-branch aria-expanded="true" aria-controls="nav-example-layout" aria-label="容器布局" title="容器布局">
                    <i class="fa fa-th-large" aria-hidden="true"></i>
                    <span class="navbar-sidebar__text">容器布局</span>
                    <span class="navbar-sidebar__count" aria-hidden="true">3</span>
                </button>
                <ul class="navbar-sidebar__children" id="nav-example-layout">
                    <li><button type="button" class="navbar-link is-active" data-nav-tree-link aria-current="page" aria-label="布局" data-nav-tree-summary="页面分几栏、栏与栏之间怎么留白。"><i class="fa fa-columns" aria-hidden="true"></i><span class="navbar-sidebar__text">布局</span></button></li>
                    <li><button type="button" class="navbar-link" data-nav-tree-link aria-label="容器" title="容器" data-nav-tree-summary="容器决定内容离屏幕边缘有多远。"><i class="fa fa-square-o" aria-hidden="true"></i><span class="navbar-sidebar__text">容器</span></button></li>
                    <li><button type="button" class="navbar-link" data-nav-tree-link aria-label="行布局" title="行布局" data-nav-tree-summary="行布局只回答一行放几列。"><i class="fa fa-bars" aria-hidden="true"></i><span class="navbar-sidebar__text">行布局</span></button></li>
                </ul>
            </li>
            <li>
                <button type="button" class="navbar-link navbar-sidebar__group" data-nav-tree-branch aria-expanded="false" aria-controls="nav-example-data" aria-label="数据展示" title="数据展示">
                    <i class="fa fa-table" aria-hidden="true"></i>
                    <span class="navbar-sidebar__text">数据展示</span>
                    <span class="navbar-sidebar__count" aria-hidden="true">2</span>
                </button>
                <ul class="navbar-sidebar__children" id="nav-example-data" hidden>
                    <li><button type="button" class="navbar-link" data-nav-tree-link aria-label="基础表格" title="基础表格" data-nav-tree-summary="基础表格的列宽、对齐与空态。"><i class="fa fa-table" aria-hidden="true"></i><span class="navbar-sidebar__text">基础表格</span></button></li>
                    <li><button type="button" class="navbar-link" data-nav-tree-link aria-label="复杂表格" title="复杂表格" data-nav-tree-summary="复杂表格的锁定列、分组与分页。"><i class="fa fa-list-alt" aria-hidden="true"></i><span class="navbar-sidebar__text">复杂表格</span></button></li>
                </ul>
            </li>
            <li>
                <button type="button" class="navbar-link kui-w-full" data-nav-tree-link aria-label="空状态" title="空状态" data-nav-tree-summary="没有数据时说明原因与下一步。"><i class="fa fa-inbox" aria-hidden="true"></i><span class="navbar-sidebar__text">空状态</span></button>
            </li>
        </ul>
        </nav>
    </aside>
    <section class="kui-board kui-stack kui-stack--tight navbar-sidebar__content">
        <header class="kui-page-header" aria-live="polite" aria-atomic="true">
            <div class="kui-page-header__text">
                <p class="kui-page-header__eyebrow">当前页面</p>
                <h3 class="kui-page-header__title" data-nav-tree-title>布局</h3>
                <p class="kui-page-header__desc" data-nav-tree-note>页面分几栏、栏与栏之间怎么留白。</p>
            </div>
        </header>
        <div class="kui-board panel--muted kui-stack kui-stack--tight">
            <span class="form-hint">分组整行可展开，当前页面用浅底，主色文字与左侧短线共同标识</span>
            <span class="form-hint">侧栏收起后保留图标，悬停可查看名称，点击分组图标可以展开目录，选中项不会丢失。</span>
        </div>
    </section>
    </div>
</div>`,
})}

${demo({
    title: '移动端折叠',
    desc: '窄屏下主导航收进折叠区，点汉堡按钮才占用高度。真实导航条在 48rem 以下会自动把 .navbar-collapse 收起来并显示 .navbar-toggler；这里把同一段结构放进手机外框，用 Collapse 组件让折叠过程随时可点，菜单项也是 button。',
    tags: ['.navbar-toggler', '.navbar-collapse', 'Collapse'],
    script: `
const mobileHost = document.querySelector<HTMLElement>('[data-nav-mobile-demo]')
const region = mobileHost?.querySelector<HTMLElement>('[data-nav-mobile-region]')
const toggler = mobileHost?.querySelector<HTMLElement>('[data-nav-mobile-toggler]')
if (region && toggler) {
    const collapse = Collapse.getOrCreate(region, { toggle: false })
    toggler.addEventListener('click', () => {
        const expanded = !collapse.isShown()
        if (expanded) {
            collapse.show()
        } else {
            collapse.hide()
        }
        toggler.setAttribute('aria-expanded', String(expanded))
        toggler.setAttribute('aria-label', expanded ? '收起导航' : '展开导航')
        const icon = toggler.querySelector('i')
        if (icon) {
            icon.classList.toggle('fa-bars', !expanded)
            icon.classList.toggle('fa-times', expanded)
        }
    })
}
`,
    html: `
<div class="kui-device kui-device--phone" data-nav-mobile-demo>
    <div class="kui-device__screen">
        <div class="kui-device__content">
            <div class="kui-stack kui-stack--tight">
                <nav class="navbar navbar--bordered" aria-label="移动端导航">
                    <span class="navbar-brand">
                        <span class="navbar-brand__mark">K</span>
                        KUI
                    </span>
                    <span class="navbar-spacer"></span>
                    <button type="button" class="btn btn-default btn-icon" data-nav-mobile-toggler aria-expanded="false" aria-controls="nav-mobile-region" aria-label="展开导航">
                        <i class="fa fa-bars" aria-hidden="true"></i>
                    </button>
                </nav>
                <div class="collapse" id="nav-mobile-region" data-nav-mobile-region>
                    <div class="kui-stack kui-stack--tight">
                        <button type="button" class="navbar-link is-active" data-nav-mobile-link aria-current="page"><i class="fa fa-th-large" aria-hidden="true"></i> 工作台</button>
                        <button type="button" class="navbar-link" data-nav-mobile-link><i class="fa fa-list" aria-hidden="true"></i> 订单</button>
                        <button type="button" class="navbar-link" data-nav-mobile-link><i class="fa fa-users" aria-hidden="true"></i> 客户</button>
                    </div>
                </div>
                <div class="kui-board kui-stack kui-stack--tight">
                    <strong data-nav-mobile-title>工作台</strong>
                    <span class="form-hint">折叠区展开后才占用高度，收起时内容区自动上移。</span>
                </div>
            </div>
        </div>
    </div>
    <span class="kui-device__label"><i class="fa fa-mobile" aria-hidden="true"></i> 320px · 折叠导航</span>
</div>`,
})}

${callout('顶部导航与侧栏导航都使用 <code>&lt;button type="button"&gt;</code>，不写 <code>href="#"</code> 或 <code>javascript:void(0)</code>：侧栏的可点击行，图标对齐与选中态由 <code>@kui/style</code> 提供，<code>aria-current="page"</code> 标记当前入口，父分组用 <code>has-current</code> 在图标状态保留当前位置。收起只改变展示，不清空选中项和分组状态。')}

${propsTable([
    { name: '.navbar', type: 'class', defaultValue: '—', desc: '导航条容器：品牌、导航与动作三段，最小高度 52px。' },
    { name: '.navbar-brand / __mark', type: 'class', defaultValue: '—', desc: '品牌标识与方形标记，标记内只放一个字或图标；示例中品牌不是操作项。' },
    { name: '.navbar-nav', type: 'class', defaultValue: '—', desc: '一级导航列表，<code>li.active</code> 标记当前模块，项内使用 <code>button</code>。' },
    { name: '.navbar-link', type: 'class', defaultValue: '—', desc: '通用导航控件：树形导航与侧栏共用同一套默认、悬停与激活样式，推荐用在 <code>button</code> 上。' },
    { name: '.navbar-spacer', type: 'class', defaultValue: '—', desc: '弹性占位，把右侧动作推到行尾。' },
    { name: '.navbar--dark', type: 'class', defaultValue: '—', desc: '深色外壳，只反转文字与悬停底色。' },
    { name: '.navbar--bordered', type: 'class', defaultValue: '—', desc: '去掉圆角与阴影，只保留一条底边。' },
    { name: '.navbar-toggler', type: 'class', defaultValue: '—', desc: '折叠开关，仅在 48rem 以下显示；展开时图标换成 <code>fa-times</code>。' },
    { name: '.navbar-collapse.show', type: 'class', defaultValue: '—', desc: '窄屏下展开的菜单区域；桌面宽度下始终可见。' },
    { name: '.navbar-sidebar-container / .navbar-sidebar-layout', type: 'class', defaultValue: '—', desc: '容器查询边界与双栏布局，容器不超过32rem时，展开状态为上下排列，收起状态仍然保留侧坐图标轨道。'},
    { name: '.navbar-sidebar / __group / __children', type: 'class', defaultValue: '—', desc: '分组侧栏：固定图标列，分组计数，子级缩进，选中项沿用组件库样式。子目录使用<code>hidden</code>配合<code>aria-expanded</code>开合。'},
    { name: '.navbar-sidebar-layout.is-collapsed', type: 'class', defaultValue: '—', desc: '将侧栏收为图标轨道：文字与目录隐蔽，顶级入口保留<code>aria-label</code>与<code>title</code>。点击分组图标展开目录，Escape收起并恢复开关焦点。'},
    { name: '.tree / .tree-has-toggle', type: 'class', defaultValue: '—', desc: '树形列表与「有子节点」的行；行内使用 <code>button</code>，整行可点且不出现文本光标。' },
    { name: '.list-toggle', type: 'class', defaultValue: '—', desc: '展开标记，默认指向右下方，展开时旋转为指向下方；放在分支按钮内部，点击标记等于点击整行。' },
    { name: 'li.open / li.in', type: 'class', defaultValue: '—', desc: '展开状态：子级 <code>ul</code> 显示，配合 <code>aria-expanded</code> 一起更新。' },
])}

`

    root.querySelectorAll<HTMLElement>('[data-nav-nav]').forEach(nav => {
        const current = nav.querySelector<HTMLElement>('[data-nav-current]')
        nav.querySelectorAll<HTMLElement>('[data-nav-select]').forEach(button => {
            button.addEventListener('click', () => {
                nav.querySelectorAll<HTMLElement>('[data-nav-select]').forEach(item => {
                    item.classList.remove('is-active')
                    item.closest('li')?.classList.remove('active')
                    item.removeAttribute('aria-current')
                })
                button.classList.add('is-active')
                button.closest('li')?.classList.add('active')
                button.setAttribute('aria-current', 'page')
                if (current) {
                    current.textContent = '当前：' + (button.textContent ?? '').trim()
                }
            })
        })
    })

    const treeHost = root.querySelector<HTMLElement>('[data-nav-tree-demo]')
    if (treeHost) trackDispose(initNavbarTree(treeHost))

    const mobileHost = root.querySelector<HTMLElement>('[data-nav-mobile-demo]')
    const mobileRegion = mobileHost?.querySelector<HTMLElement>('[data-nav-mobile-region]')
    const mobileToggler = mobileHost?.querySelector<HTMLElement>('[data-nav-mobile-toggler]')
    if (mobileRegion && mobileToggler) {
        const collapse = Collapse.getOrCreate(mobileRegion, { toggle: false })
        trackComponent(collapse)
        mobileToggler.addEventListener('click', () => {
            const expanded = !collapse.isShown()
            if (expanded) {
                collapse.show()
            } else {
                collapse.hide()
            }
            mobileToggler.setAttribute('aria-expanded', String(expanded))
            mobileToggler.setAttribute('aria-label', expanded ? '收起导航' : '展开导航')
            const icon = mobileToggler.querySelector<HTMLElement>('i')
            if (icon) {
                icon.classList.toggle('fa-bars', !expanded)
                icon.classList.toggle('fa-times', expanded)
            }
        })
    }

    const mobileTitle = mobileHost?.querySelector<HTMLElement>('[data-nav-mobile-title]')
    mobileHost?.querySelectorAll<HTMLElement>('[data-nav-mobile-link]').forEach(button => {
        button.addEventListener('click', () => {
            mobileHost.querySelectorAll<HTMLElement>('[data-nav-mobile-link]').forEach(item => {
                item.classList.remove('is-active')
                item.removeAttribute('aria-current')
            })
            button.classList.add('is-active')
            button.setAttribute('aria-current', 'page')
            if (mobileTitle) {
                mobileTitle.textContent = (button.textContent ?? '').trim()
            }
        })
    })
}
