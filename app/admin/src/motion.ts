/**
 * 动效工具。
 * 遵循「克制」的设计价值观：只用 opacity / transform，且尊重 prefers-reduced-motion。
 */

const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

export function prefersReducedMotion(): boolean {
    return reduceMotionQuery.matches
}

/**
 * 视图过渡。
 * 支持 View Transitions API 的浏览器走原生过渡，其余浏览器直接切换。
 * 回调内部负责全部 DOM 操作：过渡 API 会延后执行回调，时序不能依赖调用点。
 */
export function withViewTransition(update: () => void): void {
    const documentWithTransition = document as Document & {
        startViewTransition?: (callback: () => void) => { finished: Promise<void> }
    }

    if (prefersReducedMotion() || !documentWithTransition.startViewTransition) {
        update()
        return
    }

    documentWithTransition.startViewTransition(() => {
        update()
    })
}
