import { defaultPageId, findPage } from './nav'

/**
 * 站点路由：
 * - `#/home`    宣传首页（默认）
 * - `#/design`  宣传页的设计语言段落
 * - `#/<page>`  组件文档页
 */

export type RouteKind = 'home' | 'design' | 'docs'

export interface Route {
    kind: RouteKind
    /** 文档页 id；home/design 时为对应关键字 */
    id: string
}

const HOME = 'home'
const DESIGN = 'design'
const DEFAULT_DOC = defaultPageId

export function currentRoute(): Route {
    const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0]
    if (raw === HOME || raw === '') {
        return { kind: 'home', id: HOME }
    }
    if (raw === DESIGN) {
        return { kind: 'design', id: DESIGN }
    }
    if (findPage(raw)) {
        return { kind: 'docs', id: raw }
    }
    return { kind: 'home', id: HOME }
}

export function navigate(target: string): void {
    const normalized = target === HOME || target === DESIGN || findPage(target) ? target : DEFAULT_DOC
    const hash = `#/${normalized}`
    if (window.location.hash === hash) {
        window.dispatchEvent(new HashChangeEvent('hashchange'))
        return
    }
    window.location.hash = hash
}

export function onRouteChange(handler: (route: Route) => void): void {
    window.addEventListener('hashchange', () => handler(currentRoute()))
}

/** 是否为嵌入式渲染（供 iframe 示例使用） */
export function isEmbedded(): boolean {
    return new URLSearchParams(window.location.search).get('embed') === '1'
}
