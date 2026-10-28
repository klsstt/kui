/**
 * 文档站类型定义。
 * 一个页面 = 一条导航元数据 + 一个渲染函数，渲染函数只负责填充内容区。
 */

export interface DocNavItem {
    /** 路由片段，等于页面 id */
    id: string
    /** 菜单标题 */
    title: string
    /** 搜索关键词（英文名、选择器等） */
    keywords?: string
}

export interface DocNavGroup {
    /** 分组 id */
    id: string
    /** 分组标题 */
    title: string
    /** 分组图标 */
    icon: string
    /** 分组下的页面 */
    items: DocNavItem[]
}

export interface DocPageMeta extends DocNavItem {
    /** 所属分组 id */
    groupId: string
    /** 所属分组标题 */
    groupTitle: string
    /** 在整站导航中的序号，从 1 开始 */
    order: number
}

export interface DocPageContext {
    /** 页面内容容器 */
    root: HTMLElement
    /** 当前页面元数据 */
    meta: DocPageMeta
    /** 上一页，首页时为 null */
    prev: DocPageMeta | null
    /** 下一页，末页时为 null */
    next: DocPageMeta | null
}

export type DocPageRenderer = (context: DocPageContext) => void
