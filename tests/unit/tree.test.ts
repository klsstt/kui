import { beforeEach, describe, expect, it } from 'vitest'
import { Tree, type TreeItem } from '../../packages/core/src/components/tree/tree'

/**
 * 树形控件行为契约。
 * 覆盖层级渲染、展开折叠与行内操作事件。
 */

const data: TreeItem[] = [
    {
        name: '设计系统',
        open: true,
        children: [{ name: '设计令牌' }, { name: '组件' }],
    },
    { name: '文档站' },
]

function mountTree(options: Partial<{ animate: boolean }> = {}): { host: HTMLElement; instance: Tree } {
    document.body.innerHTML = '<div data-kui-tree class="tree"></div>'
    const host = document.querySelector<HTMLElement>('[data-kui-tree]')!
    return { host, instance: Tree.getOrCreate(host, { data, ...options }) }
}

describe('Tree', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
    })

    it('渲染出根节点与子节点', () => {
        const { host } = mountTree()
        expect(host.querySelectorAll('li').length).toBeGreaterThanOrEqual(3)
        expect(host.textContent).toContain('设计系统')
        expect(host.textContent).toContain('设计令牌')
    })

    it('每个节点具备 treeitem 语义', () => {
        const { host } = mountTree()
        const items = Array.from(host.querySelectorAll('li'))
        expect(items.length).toBeGreaterThan(0)
        for (const item of items) {
            expect(item.getAttribute('role')).toBe('treeitem')
        }
    })

    it('collapse 与 expand 可切换全部节点', () => {
        const { host, instance } = mountTree()
        instance.collapse()
        expect(host.querySelectorAll('li.open').length).toBe(0)
        instance.expand()
        expect(host.querySelectorAll('li.open').length).toBeGreaterThan(0)
    })

    it('展开与折叠会同步 aria-expanded', () => {
        const { host, instance } = mountTree()
        const branch = host.querySelector<HTMLElement>('li.has-list')!
        instance.collapse(branch)
        expect(branch.getAttribute('aria-expanded')).toBe('false')
        instance.expand(branch)
        expect(branch.getAttribute('aria-expanded')).toBe('true')
    })

    it('销毁后不再响应交互', () => {
        const { host, instance } = mountTree()
        const branch = host.querySelector<HTMLElement>('li.has-list')!
        instance.dispose()
        expect(() => instance.expand(branch)).not.toThrow()
    })
})
