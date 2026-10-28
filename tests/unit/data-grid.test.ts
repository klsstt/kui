import { beforeEach, describe, expect, it } from 'vitest'
import { DataGrid } from '../../packages/core/src/components/data-grid/data-grid'

/**
 * 复杂表格行为契约。
 * 锁住「分页 → 搜索 → 排序 → 选中」四条会在业务里被频繁组合的能力。
 */

const rows = [
    { id: 'A-1', name: '杭州青禾贸易', area: '华东', amount: 128600 },
    { id: 'A-2', name: '成都山谷文创', area: '西南', amount: 42800 },
    { id: 'A-3', name: '深圳潮尚智造', area: '华南', amount: 386000 },
]

function mount() {
    document.body.innerHTML = '<div id="grid"></div>'
    const element = document.querySelector<HTMLElement>('#grid')!
    const grid = DataGrid.getOrCreate(element, {
        columns: [
            { field: 'id', title: '订单号', width: 120, locked: true },
            { field: 'name', title: '客户', filterable: true },
            { field: 'area', title: '大区', filterable: true },
            { field: 'amount', title: '金额', sortable: true },
        ],
        rows,
        pageSize: 2,
        selectable: false,
        expandable: false,
    })
    return { grid, element }
}

describe('DataGrid', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
    })

    it('按 pageSize 分页并给出总数', () => {
        const { grid, element } = mount()
        expect(element.querySelectorAll('tbody tr').length).toBe(2)
        expect(grid.snapshot.page).toBe(1)
        expect(element.querySelector('.kui-data-grid__summary')?.textContent).toContain('共 3 条')
    })

    it('翻页后展示剩余数据', () => {
        const { grid, element } = mount()
        grid.setPage(2)
        expect(element.querySelectorAll('tbody tr').length).toBe(1)
        expect(element.textContent).toContain('深圳潮尚智造')
    })

    it('全局搜索会重置到第一页并过滤行', () => {
        const { grid } = mount()
        grid.setPage(2)
        grid.setKeyword('华东')
        expect(grid.snapshot.page).toBe(1)
        expect(grid.visibleRows.map((row) => row.id)).toEqual(['A-1'])
    })

    it('列筛选与全局搜索可以叠加', () => {
        const { grid, element } = mount()
        grid.setKeyword('贸易')
        expect(grid.visibleRows.length).toBe(1)
        grid.setKeyword('')
        expect(element.querySelector('.kui-data-grid__summary')?.textContent).toContain('共 3 条')
    })

    it('按金额降序排序', () => {
        const { grid } = mount()
        grid.sort('amount', 'desc')
        expect(grid.visibleRows[0].amount).toBe(386000)
        grid.sort('amount', 'asc')
        expect(grid.snapshot.sortOrder).toBe('asc')
        expect(grid.visibleRows[0].amount).toBe(42800)
    })

    it('release 后不再保留实例', () => {
        const { grid, element } = mount()
        grid.dispose()
        const next = DataGrid.getOrCreate(element, { columns: grid.options.columns, rows })
        expect(next).not.toBe(grid)
    })
})
