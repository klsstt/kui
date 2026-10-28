import type { DocNavGroup, DocPageMeta } from './types'

/**
 * 全站导航。
 * 八个分类覆盖「页面 → 样式 → 布局 → 交互 → 数据 → 表单 → 媒体 → 扩展」的完整使用路径。
 */
export const docNav: DocNavGroup[] = [
    {
        id: 'frame',
        title: '框架页面',
        icon: 'fa fa-th-large',
        items: [
            { id: 'dashboard', title: '首页工作台', keywords: 'dashboard workbench 仪表盘' },
            { id: 'templates', title: '模板页面', keywords: 'template sidebar top layout 模板' },
            { id: 'device-preview', title: '设备预览', keywords: 'device mobile pad tv preview 预览' },
        ],
    },
    {
        id: 'basic',
        title: '基础样式',
        icon: 'fa fa-font',
        items: [
            { id: 'typography', title: '排版', keywords: 'typography font heading text 字体' },
            { id: 'color', title: '颜色', keywords: 'color token palette theme 颜色 令牌' },
            { id: 'buttons', title: '按钮', keywords: 'button btn 按钮' },
            { id: 'badges', title: '徽章标签', keywords: 'badge tag chip 徽章 标签' },
            { id: 'progress', title: '进度条', keywords: 'progress 进度' },
            { id: 'ribbon', title: 'Ribbon', keywords: 'ribbon corner 缎带 角标' },
            { id: 'code-block', title: '代码块', keywords: 'code block pre 源码' },
            { id: 'motion', title: '动效', keywords: 'motion animation transition 动效' },
        ],
    },
    {
        id: 'layout',
        title: '容器布局',
        icon: 'fa fa-columns',
        items: [
            { id: 'layout', title: '布局', keywords: 'layout stack cluster grid 布局' },
            { id: 'container', title: '容器', keywords: 'container board 容器 卡片' },
            { id: 'content', title: '内容区', keywords: 'content section 内容区' },
            { id: 'row', title: '行布局', keywords: 'row grid column 行 栅格' },
            { id: 'responsive', title: '响应式', keywords: 'responsive breakpoint container query 响应式' },
            { id: 'panel', title: '面板', keywords: 'panel card 面板' },
        ],
    },
    {
        id: 'nav',
        title: '导航交互',
        icon: 'fa fa-compass',
        items: [
            { id: 'tabs', title: '标签页', keywords: 'tab 标签页' },
            { id: 'navbar', title: '导航条', keywords: 'navbar nav 导航条' },
            { id: 'alert', title: '提示', keywords: 'alert message 提示 警告' },
            { id: 'overlay', title: '悬浮组件', keywords: 'tooltip popover dropdown 悬浮 气泡' },
            { id: 'mask', title: '遮罩浮层', keywords: 'modal drawer overlay 遮罩 模态框 抽屉' },
            { id: 'guide', title: '引导', keywords: 'tour guide 引导 新手' },
            { id: 'steps', title: '步骤条', keywords: 'steps 步骤' },
            { id: 'timeline', title: '时间线', keywords: 'timeline 时间线' },
        ],
    },
    {
        id: 'data',
        title: '数据展示',
        icon: 'fa fa-table',
        items: [
            { id: 'table-basic', title: '基础表格', keywords: 'table 表格' },
            { id: 'table-advanced', title: '复杂表格', keywords: 'data grid table 复杂表格 锁定 分组 分页' },
            { id: 'tree', title: '树形数据', keywords: 'tree 树形' },
            { id: 'list', title: '列表页面', keywords: 'list 列表' },
            { id: 'comments', title: '评论页面', keywords: 'comment 评论' },
            { id: 'messages', title: '消息与任务', keywords: 'message task 消息 任务' },
            { id: 'social', title: '社交页面', keywords: 'social feed post 社交 动态' },
        ],
    },
    {
        id: 'form',
        title: '表单输入',
        icon: 'fa fa-check-square-o',
        items: [
            { id: 'form-basic', title: '基础表单', keywords: 'form input 表单' },
            { id: 'select', title: '选择器', keywords: 'select picker 选择器 下拉' },
            { id: 'rating', title: '评分', keywords: 'rating star 评分' },
            { id: 'editable', title: '可编辑', keywords: 'editable inline 可编辑' },
            { id: 'hinted-input', title: '提示输入', keywords: 'hint prompt input 提示输入' },
        ],
    },
    {
        id: 'media',
        title: '媒体内容',
        icon: 'fa fa-picture-o',
        items: [
            { id: 'image', title: '图片', keywords: 'image img 图片' },
            { id: 'carousel', title: '轮播组件', keywords: 'carousel slider 轮播' },
            { id: 'cropper', title: '图片裁剪', keywords: 'cropper crop 裁剪' },
            { id: 'org-chart', title: '组织关系', keywords: 'org chart 组织 关系图' },
            { id: 'icons', title: '字体图标', keywords: 'icon font awesome 图标' },
        ],
    },
    {
        id: 'extend',
        title: '扩展组件',
        icon: 'fa fa-puzzle-piece',
        items: [
            { id: 'mouse', title: '鼠标交互', keywords: 'mouse drag context 鼠标 拖拽' },
            { id: 'masonry', title: '瀑布流', keywords: 'masonry 瀑布流' },
            { id: 'nestable', title: '嵌套排序', keywords: 'nestable sortable 排序' },
            { id: 'rich-text', title: '文本组件', keywords: 'rich text editor markdown 富文本' },
        ],
    },
]

/** 扁平化后的页面列表（顺序即上一页 / 下一页顺序） */
export const docPages: DocPageMeta[] = docNav.flatMap((group) =>
    group.items.map((item) => ({
        ...item,
        groupId: group.id,
        groupTitle: group.title,
        order: 0,
    })),
).map((page, index) => ({ ...page, order: index + 1 }))

export const defaultPageId = docPages[0].id

export function findPage(id: string): DocPageMeta | undefined {
    return docPages.find((page) => page.id === id)
}

export function pageNeighbours(id: string): { prev: DocPageMeta | null; next: DocPageMeta | null } {
    const index = docPages.findIndex((page) => page.id === id)
    return {
        prev: index > 0 ? docPages[index - 1] : null,
        next: index >= 0 && index < docPages.length - 1 ? docPages[index + 1] : null,
    }
}

/** 页面在分组内的序号，例如「基础样式 02」 */
export function groupIndexLabel(id: string): string {
    const page = findPage(id)
    if (!page) {
        return ''
    }
    const group = docNav.find((item) => item.id === page.groupId)
    const index = group ? group.items.findIndex((item) => item.id === id) : 0
    return `${page.groupTitle} ${String(index + 1).padStart(2, '0')}`
}
