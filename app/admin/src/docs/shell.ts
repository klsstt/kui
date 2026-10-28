import { colorPalette } from '@kui/tokens'

import { trackPersistent } from '../context'
import { docNav, docPages } from './nav'
import type { Route } from './router'

/**
 * 站点外壳：宣传首页与组件文档共用一条顶栏。
 * 顶栏一级导航固定为「首页 / 组件库 / 设计规范」；组件库下才出现左侧分类菜单。
 */

const THEME_KEY = 'kui-docs-theme'
const SIDEBAR_KEY = 'kui-docs-sidebar'
const TOPBAR_KEY = 'kui-docs-topbar'
const GROUP_KEY = 'kui-docs-groups'

export interface ThemeChoice {
    value: string
    label: string
    /** 设置面板色点颜色，取该色系 600；深色主题按页面底色给值 */
    color: string
}

/** colorPalette 的中文名带「色」后缀，设置面板用更短的色名（蓝、紫、粉…） */
function shortColorLabel(label: string): string {
    return label.replace(/色$/, '')
}

/** 12 个色系与 colorPalette 同源，另加一个深色主题 */
export const themeChoices: ThemeChoice[] = [
    ...colorPalette.map((ramp) => ({
        value: ramp.id,
        label: shortColorLabel(ramp.label),
        color: ramp.shades['600'],
    })),
    { value: 'dark', label: '深色', color: '#0f172a' },
]

export interface TocItem {
    id: string
    title: string
}

export interface DocsShell {
    content: HTMLElement
    /** 切换 home / docs 布局 */
    setMode: (mode: 'home' | 'docs') => void
    /** 高亮当前文档页 */
    setActivePage: (id: string) => void
    /** 高亮顶栏一级导航 */
    setActiveNav: (kind: Route['kind']) => void
    /** 根据正文内的示例标题生成右侧目录 */
    buildToc: () => void
    focusContent: () => void
}

function read(key: string): string | null {
    try {
        return window.localStorage.getItem(key)
    } catch {
        return null
    }
}

function write(key: string, value: string): void {
    try {
        window.localStorage.setItem(key, value)
    } catch {
        /* 隐私模式下忽略写入失败 */
    }
}

export function currentTheme(): string {
    return document.documentElement.dataset.kuiTheme ?? read(THEME_KEY) ?? 'blue'
}

export function applyTheme(value: string): void {
    document.documentElement.dataset.kuiTheme = value
    write(THEME_KEY, value)
}

function renderNav(): string {
    return docNav
        .map(
            (group) => `
<section class="docs-nav__group" data-nav-group="${group.id}">
    <button type="button" class="docs-nav__group-head" data-group-toggle aria-expanded="true" aria-controls="nav-${group.id}">
        <i class="${group.icon}" aria-hidden="true"></i>
        <span class="docs-nav__group-title">${group.title}</span>
        <span class="docs-nav__count">${group.items.length}</span>
        <i class="fa fa-angle-down docs-nav__chevron" aria-hidden="true"></i>
    </button>
    <ul class="docs-nav__list" id="nav-${group.id}">
        ${group.items
            .map(
                (item) => `<li>
            <a class="docs-nav__link" href="#/${item.id}" data-page="${item.id}" data-keywords="${item.title} ${item.keywords ?? ''}">
                <span>${item.title}</span>
            </a>
        </li>`,
            )
            .join('')}
    </ul>
</section>`,
        )
        .join('')
}

function renderShell(): string {
    return `
<header class="docs-topbar" data-docs-topbar>
    <a class="docs-brand" href="#/home" aria-label="KUI 首页">
        <img class="docs-brand__logo" src="./images/kui-logo.png" alt="" width="32" height="32">
        <span class="docs-brand__text">
            <strong>KUI</strong>
            <small>现代前端 UI 库</small>
        </span>
    </a>

    <nav class="docs-primary" aria-label="一级导航">
        <a class="docs-primary__link" href="#/home" data-primary="home">首页</a>
        <a class="docs-primary__link" href="#/dashboard" data-primary="docs">组件库</a>
    </nav>

    <label class="docs-search" data-docs-search-wrap>
        <i class="fa fa-search" aria-hidden="true"></i>
        <input type="search" class="docs-search__input" data-docs-search placeholder="搜索组件、页面或关键字" aria-label="搜索组件">
        <kbd class="docs-search__kbd">/</kbd>
    </label>

    <div class="docs-topbar__actions">
        <button type="button" class="docs-topbar__icon docs-settings-trigger" data-docs-settings aria-label="打开设置" aria-expanded="false" aria-controls="docs-settings">
            <i class="fa fa-cog" aria-hidden="true"></i>
        </button>
        <button type="button" class="docs-topbar__icon" data-docs-menu aria-label="打开组件导航" aria-expanded="false">
            <i class="fa fa-bars" aria-hidden="true"></i>
        </button>
    </div>
</header>

<div class="docs-layout">
    <aside class="docs-sidebar" data-docs-sidebar aria-label="组件导航">
        <nav class="docs-nav">
            <p class="docs-nav__caption">组件与页面</p>
            ${renderNav()}
            <p class="docs-nav__empty" data-nav-empty hidden>没有匹配的组件</p>
        </nav>
        <div class="docs-sidebar__foot">
            <button type="button" class="docs-sidebar__foot-btn" data-docs-expand-all>展开全部分组</button>
            <button type="button" class="docs-sidebar__foot-btn" data-docs-collapse-all>收起全部分组</button>
        </div>
    </aside>

    <div class="docs-main">
        <main class="docs-content" id="docs-content" tabindex="-1"></main>
        <aside class="docs-toc" data-docs-toc hidden aria-label="本页目录">
            <p class="docs-toc__title">本页目录</p>
            <ul class="docs-toc__list" data-docs-toc-list></ul>
        </aside>
    </div>
</div>

<button type="button" class="docs-float-collapse" data-docs-toggle-sidebar aria-pressed="false" aria-label="收起左侧导航" title="收起左侧导航">
    <i class="fa fa-angle-double-left" aria-hidden="true"></i>
</button>

<div class="docs-scrim" data-docs-scrim hidden></div>

<aside class="docs-settings" id="docs-settings" data-docs-settings-panel hidden aria-label="外观与布局设置">
    <header class="docs-settings__head">
        <div>
            <h2>设置</h2>
            <p>只影响当前浏览器，随时可以恢复默认。</p>
        </div>
        <button type="button" class="docs-settings__close" data-docs-settings-close aria-label="关闭设置">
            <i class="fa fa-times" aria-hidden="true"></i>
        </button>
    </header>
    <section class="docs-settings__section">
        <h3>主题</h3>
        <div class="docs-settings__themes">
            ${themeChoices
                .map(
                    (theme) => `<button type="button" class="docs-settings__theme" data-theme-value="${theme.value}" style="--docs-theme-color: ${theme.color}">
                        <span class="docs-theme-dot" aria-hidden="true"></span>
                        <span>${theme.label}</span>
                        <i class="fa fa-check" aria-hidden="true"></i>
                    </button>`,
                )
                .join('')}
        </div>
    </section>
    <section class="docs-settings__section">
        <h3>布局</h3>
        <label class="docs-settings__row">
            <span>
                <strong>隐藏顶部栏</strong>
                <small>滚动阅读时只保留内容与右侧目录。</small>
            </span>
            <input type="checkbox" data-docs-hide-top>
        </label>
        <label class="docs-settings__row">
            <span>
                <strong>隐藏左侧导航</strong>
                <small>专注当前组件，需要时再从顶部按钮展开。</small>
            </span>
            <input type="checkbox" data-docs-hide-sidebar>
        </label>
    </section>
    <footer class="docs-settings__foot">
        <button type="button" class="btn btn-default btn-sm" data-docs-settings-reset>恢复默认</button>
        <button type="button" class="btn btn-primary btn-sm" data-docs-settings-done>完成</button>
    </footer>
</aside>

<button type="button" class="docs-float-settings" data-docs-settings aria-label="打开设置">
    <i class="fa fa-cog" aria-hidden="true"></i>
</button>
`
}

export function renderDocsShell(root: HTMLElement): DocsShell {
    applyTheme(currentTheme())
    root.classList.add('docs')
    root.innerHTML = renderShell()

    const content = root.querySelector<HTMLElement>('#docs-content')
    const sidebar = root.querySelector<HTMLElement>('[data-docs-sidebar]')
    const scrim = root.querySelector<HTMLElement>('[data-docs-scrim]')
    const toggleSidebar = root.querySelector<HTMLElement>('[data-docs-toggle-sidebar]')
    const menuButton = root.querySelector<HTMLElement>('[data-docs-menu]')
    const settingsPanel = root.querySelector<HTMLElement>('[data-docs-settings-panel]')
    const settingsTriggers = Array.from(root.querySelectorAll<HTMLElement>('[data-docs-settings]'))
    const settingsClose = root.querySelector<HTMLElement>('[data-docs-settings-close]')
    const settingsDone = root.querySelector<HTMLElement>('[data-docs-settings-done]')
    const settingsReset = root.querySelector<HTMLElement>('[data-docs-settings-reset]')
    const hideTopInput = root.querySelector<HTMLInputElement>('[data-docs-hide-top]')
    const hideSidebarInput = root.querySelector<HTMLInputElement>('[data-docs-hide-sidebar]')
    const search = root.querySelector<HTMLInputElement>('[data-docs-search]')
    const searchWrap = root.querySelector<HTMLElement>('[data-docs-search-wrap]')
    const navEmpty = root.querySelector<HTMLElement>('[data-nav-empty]')
    const toc = root.querySelector<HTMLElement>('[data-docs-toc]')
    const tocList = root.querySelector<HTMLElement>('[data-docs-toc-list]')
    if (!content || !sidebar || !scrim || !toggleSidebar || !menuButton || !search || !toc || !tocList || !settingsPanel) {
        throw new Error('文档站外壳渲染失败')
    }

    /* ---------- 主题 ---------- */
    const syncThemeDots = (): void => {
        const active = currentTheme()
        root.querySelectorAll<HTMLElement>('[data-theme-value]').forEach((button) => {
            button.classList.toggle('is-active', button.dataset.themeValue === active)
            button.setAttribute('aria-pressed', String(button.dataset.themeValue === active))
        })
    }
    root.querySelectorAll<HTMLElement>('[data-theme-value]').forEach((button) => {
        const onClick = (): void => {
            applyTheme(button.dataset.themeValue ?? 'blue')
            syncThemeDots()
        }
        button.addEventListener('click', onClick)
        trackPersistent(() => button.removeEventListener('click', onClick))
    })
    syncThemeDots()

    /* ---------- 侧栏整体收缩 ---------- */
    const isCollapsed = (): boolean => root.classList.contains('is-collapsed')
    const setCollapsed = (collapsed: boolean): void => {
        root.classList.toggle('is-collapsed', collapsed)
        toggleSidebar.setAttribute('aria-pressed', String(collapsed))
        toggleSidebar.setAttribute('aria-label', collapsed ? '展开左侧导航' : '收起左侧导航')
        toggleSidebar.title = collapsed ? '展开左侧导航' : '收起左侧导航'
        toggleSidebar.querySelector('i')?.classList.toggle('fa-angle-double-right', collapsed)
        toggleSidebar.querySelector('i')?.classList.toggle('fa-angle-double-left', !collapsed)
        if (hideSidebarInput) hideSidebarInput.checked = collapsed
        write(SIDEBAR_KEY, collapsed ? 'collapsed' : 'expanded')
    }
    setCollapsed(read(SIDEBAR_KEY) === 'collapsed')
    toggleSidebar.addEventListener('click', () => setCollapsed(!isCollapsed()))

    /* ---------- 设置抽屉 ---------- */
    const setSettings = (open: boolean, restoreFocus = true): void => {
        settingsPanel.hidden = !open
        root.classList.toggle('is-settings-open', open)
        settingsTriggers.forEach((trigger) => trigger.setAttribute('aria-expanded', String(open)))
        scrim.hidden = !open && !root.classList.contains('is-drawer-open')
        if (open) {
            const active = settingsPanel.querySelector<HTMLElement>('[data-theme-value].is-active')
            active?.focus()
        } else if (restoreFocus) {
            settingsTriggers[0]?.focus()
        }
    }
    settingsTriggers.forEach((trigger) => trigger.addEventListener('click', () => setSettings(settingsPanel.hidden)))
    settingsClose?.addEventListener('click', () => setSettings(false))
    settingsDone?.addEventListener('click', () => setSettings(false))

    const setTopbarHidden = (hidden: boolean): void => {
        root.classList.toggle('is-topbar-hidden', hidden)
        if (hideTopInput) hideTopInput.checked = hidden
        write(TOPBAR_KEY, hidden ? 'hidden' : 'shown')
    }
    setTopbarHidden(read(TOPBAR_KEY) === 'hidden')
    hideTopInput?.addEventListener('change', () => setTopbarHidden(hideTopInput.checked))
    hideSidebarInput?.addEventListener('change', () => setCollapsed(hideSidebarInput.checked))

    settingsReset?.addEventListener('click', () => {
        applyTheme('blue')
        syncThemeDots()
        setTopbarHidden(false)
        setCollapsed(false)
    })

    /* ---------- 窄屏抽屉 ---------- */
    const setDrawer = (open: boolean): void => {
        if (open) setSettings(false, false)
        root.classList.toggle('is-drawer-open', open)
        scrim.hidden = !open
        menuButton.setAttribute('aria-expanded', String(open))
        document.body.classList.toggle('docs-drawer-open', open)
    }
    menuButton.addEventListener('click', () => setDrawer(!root.classList.contains('is-drawer-open')))
    scrim.addEventListener('click', () => {
        setDrawer(false)
        setSettings(false)
    })

    /* ---------- 分组折叠 ---------- */
    let collapsedGroups: string[] = []
    try {
        collapsedGroups = JSON.parse(read(GROUP_KEY) ?? '[]') as string[]
    } catch {
        collapsedGroups = []
    }
    const persistGroups = (): void => write(GROUP_KEY, JSON.stringify(collapsedGroups))

    const groupElements = Array.from(root.querySelectorAll<HTMLElement>('[data-nav-group]'))
    const setGroup = (group: HTMLElement, collapsed: boolean): void => {
        const id = group.dataset.navGroup ?? ''
        group.classList.toggle('is-collapsed', collapsed)
        group.querySelector<HTMLElement>('[data-group-toggle]')?.setAttribute('aria-expanded', String(!collapsed))
        if (collapsed && !collapsedGroups.includes(id)) {
            collapsedGroups.push(id)
        } else if (!collapsed) {
            collapsedGroups = collapsedGroups.filter((item) => item !== id)
        }
    }
    groupElements.forEach((group) => {
        setGroup(group, collapsedGroups.includes(group.dataset.navGroup ?? ''))
        group.querySelector<HTMLElement>('[data-group-toggle]')?.addEventListener('click', () => {
            setGroup(group, !group.classList.contains('is-collapsed'))
            persistGroups()
        })
    })

    root.querySelector('[data-docs-expand-all]')?.addEventListener('click', () => {
        groupElements.forEach((group) => setGroup(group, false))
        persistGroups()
    })
    root.querySelector('[data-docs-collapse-all]')?.addEventListener('click', () => {
        groupElements.forEach((group) => setGroup(group, true))
        persistGroups()
    })

    /* ---------- 搜索 ---------- */
    const links = Array.from(root.querySelectorAll<HTMLElement>('[data-page]'))
    const filterNav = (keyword: string): void => {
        const needle = keyword.trim().toLowerCase()
        let visible = 0
        links.forEach((link) => {
            const haystack = (link.dataset.keywords ?? '').toLowerCase()
            const matched = !needle || haystack.includes(needle)
            const item = link.closest('li')
            if (item instanceof HTMLElement) {
                item.hidden = !matched
            }
            if (matched) {
                visible += 1
            }
        })
        groupElements.forEach((group) => {
            const count = group.querySelectorAll<HTMLElement>('li:not([hidden])').length
            group.hidden = count === 0
            if (needle && count > 0) {
                group.classList.remove('is-collapsed')
            }
        })
        if (navEmpty) {
            navEmpty.hidden = visible > 0
        }
    }
    search.addEventListener('input', () => filterNav(search.value))
    search.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            search.value = ''
            filterNav('')
            search.blur()
        }
    })

    const onGlobalKeydown = (event: KeyboardEvent): void => {
        const target = event.target
        const typing = target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        if (event.key === '/' && !typing && !root.classList.contains('is-home')) {
            event.preventDefault()
            search.focus()
            search.select()
        } else if (event.key === 'Escape') {
            setDrawer(false)
            setSettings(false, false)
        }
    }
    window.addEventListener('keydown', onGlobalKeydown)
    trackPersistent(() => window.removeEventListener('keydown', onGlobalKeydown))

    /* ---------- 本页目录 ---------- */
    let tocObserver: IntersectionObserver | null = null
    const buildToc = (): void => {
        const items: TocItem[] = Array.from(content.querySelectorAll<HTMLElement>('[data-demo-title]')).map(
            (title, index) => {
                const section = title.closest<HTMLElement>('[data-demo]')
                if (section && !section.id) {
                    section.id = `demo-${index + 1}`
                }
                return { id: section?.id ?? '', title: title.textContent ?? '' }
            },
        )

        if (items.length < 2) {
            toc.hidden = true
            return
        }
        toc.hidden = false
        tocList.innerHTML = items
            .map((item) => `<li><a class="docs-toc__link" href="#${item.id}" data-toc-link="${item.id}">${item.title}</a></li>`)
            .join('')

        tocList.querySelectorAll<HTMLElement>('[data-toc-link]').forEach((link) => {
            link.addEventListener('click', (event) => {
                event.preventDefault()
                document.getElementById(link.dataset.tocLink ?? '')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            })
        })

        tocObserver?.disconnect()
        tocObserver = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0]
                if (!visible) {
                    return
                }
                const id = (visible.target as HTMLElement).id
                tocList.querySelectorAll<HTMLElement>('[data-toc-link]').forEach((link) => {
                    link.classList.toggle('is-active', link.dataset.tocLink === id)
                })
            },
            { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
        )
        content.querySelectorAll<HTMLElement>('[data-demo]').forEach((section) => tocObserver?.observe(section))
    }

    return {
        content,
        setMode: (mode) => {
            root.classList.toggle('is-home', mode === 'home')
            if (mode === 'home') {
                toc.hidden = true
                setDrawer(false)
            }
            setSettings(false)
            if (searchWrap) {
                searchWrap.hidden = mode === 'home'
            }
        },
        setActivePage: (id) => {
            links.forEach((link) => {
                const active = link.dataset.page === id
                link.classList.toggle('is-active', active)
                if (active) {
                    link.setAttribute('aria-current', 'page')
                    link.closest<HTMLElement>('[data-nav-group]')?.classList.remove('is-collapsed')
                    link.closest<HTMLElement>('[data-nav-group]')?.querySelector<HTMLElement>('[data-group-toggle]')?.setAttribute('aria-expanded', 'true')
                    link.scrollIntoView({ block: 'nearest' })
                } else {
                    link.removeAttribute('aria-current')
                }
            })
            setDrawer(false)
            setSettings(false, false)
        },
        setActiveNav: (kind) => {
            root.querySelectorAll<HTMLElement>('[data-primary]').forEach((link) => {
                const active = link.dataset.primary === kind
                link.classList.toggle('is-active', active)
                if (active) {
                    link.setAttribute('aria-current', 'page')
                } else {
                    link.removeAttribute('aria-current')
                }
            })
        },
        buildToc,
        focusContent: () => content.focus({ preventScroll: true }),
    }
}

/** 上一页 / 下一页，追加在正文末尾 */
export function renderPageNav(prevId: string | null, nextId: string | null): string {
    const find = (id: string | null): (typeof docPages)[number] | undefined =>
        id ? docPages.find((page) => page.id === id) : undefined
    const prev = find(prevId)
    const next = find(nextId)
    if (!prev && !next) {
        return ''
    }
    const single = !prev || !next
    return `
<nav class="docs-pager${single ? ' docs-pager--single' : ''}" aria-label="页面导航">
    ${
        prev
            ? `<a class="docs-pager__link docs-pager__link--prev" href="#/${prev.id}">
                <span class="docs-pager__dir"><i class="fa fa-arrow-left" aria-hidden="true"></i> 上一篇</span>
                <strong>${prev.title}</strong>
            </a>`
            : ''
    }
    ${
        next
            ? `<a class="docs-pager__link docs-pager__link--next" href="#/${next.id}">
                <span class="docs-pager__dir">下一篇 <i class="fa fa-arrow-right" aria-hidden="true"></i></span>
                <strong>${next.title}</strong>
            </a>`
            : ''
    }
</nav>`
}
