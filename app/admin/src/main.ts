import '@kui/style/full'

import './styles/site.scss'

import { disposePage } from './context'
import { withViewTransition } from './motion'
import { docPages, findPage, pageNeighbours } from './docs/nav'
import { loadPageRenderer } from './docs/registry'
import { currentRoute, isEmbedded, onRouteChange, type Route } from './docs/router'
import { renderDocsShell, renderPageNav, type DocsShell } from './docs/shell'
import { mountPage, resetDemoSeq } from './docs/ui'
import type { DocPageMeta, DocPageRenderer } from './docs/types'
import renderHome from './pages/home'

/**
 * KUI 站点入口。
 * 首页是宣传门户，组件库是文档；两者共用顶栏，组件库下才出现左侧分类菜单。
 */

const rootElement = document.querySelector<HTMLElement>('#app')
if (!rootElement) {
    throw new Error('未找到 #app 挂载点')
}
const appRoot: HTMLElement = rootElement

let renderToken = 0

function renderPageInto(container: HTMLElement, renderer: DocPageRenderer, meta: DocPageMeta): void {
    const { prev, next } = pageNeighbours(meta.id)
    renderer({ root: container, meta, prev, next })
    if (prev || next) {
        container.insertAdjacentHTML('beforeend', renderPageNav(prev?.id ?? null, next?.id ?? null))
    }
}

/** 未注册的页面给一条明确的退路，而不是空白页 */
function notFound(meta: DocPageMeta): DocPageRenderer {
    return ({ root }) => {
        root.innerHTML = `
<div class="doc-page__head">
    <p class="doc-page__crumb"><span>${meta.groupTitle}</span></p>
    <h1 class="doc-page__title">页面正在准备中</h1>
    <p class="doc-page__lead">「${meta.title}」的示例还没有上线，可以先从左侧其他分类开始。</p>
</div>`
    }
}

function mountDocs(): void {
    const shell: DocsShell = renderDocsShell(appRoot)

    const render = async (route: Route): Promise<void> => {
        const token = (renderToken += 1)
        disposePage()
        resetDemoSeq()
        window.scrollTo({ top: 0, behavior: 'auto' })

        if (route.kind === 'home' || route.kind === 'design') {
            withViewTransition(() => {
                shell.setMode('home')
                shell.content.innerHTML = ''
                renderHome(shell.content)
                shell.setActiveNav(route.kind === 'design' ? 'design' : 'home')
            })
            shell.focusContent()
            document.title = 'KUI · 现代前端 UI 库'
            if (route.kind === 'design') {
                window.requestAnimationFrame(() => {
                    document.getElementById('design-language')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                })
            }
            return
        }

        const meta = findPage(route.id) ?? docPages[0]
        let renderer: DocPageRenderer | null = null
        try {
            renderer = await loadPageRenderer(meta.id)
        } catch {
            renderer = null
        }
        if (token !== renderToken) {
            return
        }
        const resolved = renderer ?? notFound(meta)

        withViewTransition(() => {
            shell.setMode('docs')
            shell.content.innerHTML = ''
            renderPageInto(shell.content, resolved, meta)
            shell.setActivePage(meta.id)
            shell.setActiveNav('docs')
            mountPage(shell.content)
            shell.buildToc()
        })
        shell.focusContent()
        document.title = `${meta.title} · KUI 现代前端 UI 库`
    }

    onRouteChange((route) => void render(route))
    void render(currentRoute())
}

function mountEmbedded(): void {
    document.body.classList.add('is-embed')
    appRoot.classList.add('docs', 'docs--embed')
    appRoot.innerHTML = '<main class="docs-content docs-content--embed" id="docs-content" tabindex="-1"></main>'
    const content = appRoot.querySelector<HTMLElement>('#docs-content')
    if (!content) {
        throw new Error('嵌入式内容区渲染失败')
    }

    const render = async (route: Route): Promise<void> => {
        const meta = findPage(route.id) ?? docPages[0]
        const token = (renderToken += 1)
        disposePage()
        resetDemoSeq()
        let renderer: DocPageRenderer | null = null
        try {
            renderer = await loadPageRenderer(meta.id)
        } catch {
            renderer = null
        }
        if (token !== renderToken) {
            return
        }
        content.innerHTML = ''
        renderPageInto(content, renderer ?? notFound(meta), meta)
        mountPage(content)
        document.title = `${meta.title} · KUI`
    }

    onRouteChange((route) => void render(route))
    void render(currentRoute())
}

if (isEmbedded()) {
    mountEmbedded()
} else {
    mountDocs()
}
