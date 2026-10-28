import type { DocPageRenderer } from './types'

/**
 * 页面按需加载。
 * 文档站有 40+ 个页面，一次性打进主包会让首屏为一个用户可能永远不看的页面付流量；
 * 这里每个页面一个动态入口，Vite 会自动拆成独立 chunk。
 */

type PageModule = { default: DocPageRenderer }

const loaders: Record<string, () => Promise<PageModule>> = {
    dashboard: () => import('../pages/frame/dashboard'),
    templates: () => import('../pages/frame/templates'),
    'device-preview': () => import('../pages/frame/device-preview'),

    typography: () => import('../pages/basic/typography'),
    color: () => import('../pages/basic/color'),
    buttons: () => import('../pages/basic/buttons'),
    badges: () => import('../pages/basic/badges'),
    progress: () => import('../pages/basic/progress'),
    ribbon: () => import('../pages/basic/ribbon'),
    'code-block': () => import('../pages/basic/code-block'),
    motion: () => import('../pages/basic/motion'),

    layout: () => import('../pages/layout/layout'),
    container: () => import('../pages/layout/container'),
    content: () => import('../pages/layout/content'),
    row: () => import('../pages/layout/row'),
    responsive: () => import('../pages/layout/responsive'),
    panel: () => import('../pages/layout/panel'),

    tabs: () => import('../pages/nav/tabs'),
    navbar: () => import('../pages/nav/navbar'),
    alert: () => import('../pages/nav/alert'),
    overlay: () => import('../pages/nav/overlay'),
    mask: () => import('../pages/nav/mask'),
    guide: () => import('../pages/nav/guide'),
    steps: () => import('../pages/nav/steps'),
    timeline: () => import('../pages/nav/timeline'),

    'table-basic': () => import('../pages/data/table-basic'),
    'table-advanced': () => import('../pages/data/table-advanced'),
    tree: () => import('../pages/data/tree'),
    list: () => import('../pages/data/list'),
    comments: () => import('../pages/data/comments'),
    messages: () => import('../pages/data/messages'),
    social: () => import('../pages/data/social'),

    'form-basic': () => import('../pages/form/form-basic'),
    select: () => import('../pages/form/select'),
    rating: () => import('../pages/form/rating'),
    editable: () => import('../pages/form/editable'),
    'hinted-input': () => import('../pages/form/hinted-input'),

    image: () => import('../pages/media/image'),
    carousel: () => import('../pages/media/carousel'),
    cropper: () => import('../pages/media/cropper'),
    'org-chart': () => import('../pages/media/org-chart'),
    icons: () => import('../pages/media/icons'),

    mouse: () => import('../pages/extend/mouse'),
    masonry: () => import('../pages/extend/masonry'),
    nestable: () => import('../pages/extend/nestable'),
    'rich-text': () => import('../pages/extend/rich-text'),
}

/** 页面是否已注册 */
export function hasPage(id: string): boolean {
    return id in loaders
}

/** 读取页面渲染函数，未注册时返回 null */
export async function loadPageRenderer(id: string): Promise<DocPageRenderer | null> {
    const loader = loaders[id]
    if (!loader) {
        return null
    }
    const module = await loader()
    return module.default
}
