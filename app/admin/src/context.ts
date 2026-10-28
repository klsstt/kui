/**
 * 页面级与常驻级资源登记。
 * 路由切换只释放「页面级」资源，外壳（顶栏、侧边导航）的组件实例常驻，
 * 这样既保证「实例零残留」，又不会误销毁长期存在的交互。
 */

type Disposer = () => void

const pageDisposers: Disposer[] = []
const persistentDisposers: Disposer[] = []

/** 登记一个随页面释放的资源 */
export function trackDispose(disposer: Disposer): void {
    pageDisposers.push(disposer)
}

/** 登记一个随页面释放的 KUI 组件实例 */
export function trackComponent(component: { dispose(): void }): void {
    trackDispose(() => component.dispose())
}

/** 登记一个常驻资源（外壳组件） */
export function trackPersistent(disposer: Disposer): void {
    persistentDisposers.push(disposer)
}

/** 登记一个常驻 KUI 组件实例 */
export function trackPersistentComponent(component: { dispose(): void }): void {
    trackPersistent(() => component.dispose())
}

/** 释放当前页全部资源 */
export function disposePage(): void {
    while (pageDisposers.length) {
        const disposer = pageDisposers.pop()
        try {
            disposer?.()
        } catch {
            /* 释放失败不阻塞切换 */
        }
    }
}

/** 释放全部资源（整站卸载或退出登录时使用） */
export function disposeAll(): void {
    disposePage()
    while (persistentDisposers.length) {
        const disposer = persistentDisposers.pop()
        try {
            disposer?.()
        } catch {
            /* 忽略 */
        }
    }
}

/** 当前登记的页面级资源数量，用于在界面上佐证「零残留」 */
export function pageResourceCount(): number {
    return pageDisposers.length
}
