import { Component } from '../../core/component'
import { getInstance } from '../../core/instances'
import { mergeOptions, readDataOptions, type PlainObject } from '../../core/options'

export type DataGridRow = Record<string, unknown>
export type SortOrder = 'asc' | 'desc' | ''

export interface DataGridColumn {
    /** 字段名 */
    field: string
    /** 表头文案 */
    title: string
    /** 列宽（像素），锁定列必须给出 */
    width?: number
    /** 对齐 */
    align?: 'left' | 'center' | 'right'
    /** 是否可排序 */
    sortable?: boolean
    /** 是否可筛选 */
    filterable?: boolean
    /** 锁定：左侧 / 右侧，true 等价于左侧 */
    locked?: boolean | 'left' | 'right'
    /** 自定义单元格内容（返回 HTML） */
    formatter?: (value: unknown, row: DataGridRow, index: number) => string
    /** 表头组合 */
    children?: DataGridColumn[]
}

export interface DataGridState {
    /** 当前页（从 1 开始） */
    page: number
    /** 每页条数 */
    pageSize: number
    /** 排序字段 */
    sortField: string
    /** 排序方向 */
    sortOrder: SortOrder
    /** 列筛选值 */
    filters: Record<string, string>
    /** 全局搜索词 */
    keyword: string
    /** 选中的行主键 */
    selected: string[]
}

export interface DataGridOptions extends PlainObject {
    /** 列定义 */
    columns: DataGridColumn[]
    /** 数据 */
    rows: DataGridRow[]
    /** 行主键字段 */
    rowKey: string
    /** 每页条数 */
    pageSize: number
    /** 可选每页条数 */
    pageSizes: number[]
    /** 是否可多选 */
    selectable: boolean
    /** 是否可展开详情 */
    expandable: boolean
    /** 是否显示筛选行 */
    filterable: boolean
    /** 是否显示分页 */
    pagination: boolean
    /** 是否斑马纹 */
    striped: boolean
    /** 空数据文案 */
    emptyText: string
    /** 展开行内容 */
    detail?: (row: DataGridRow) => string
    /** 状态变化回调 */
    onChange?: (state: DataGridState) => void
}

/**
 * 复杂表格。
 * 面向真实业务列表：表头组合、列筛选、点击排序、左侧锁定、展开详情、分页与多选，
 * 数据和状态都收敛在 options 里，外部只通过 setRows / refresh 驱动。
 */
export class DataGrid extends Component<DataGridOptions> {
    static readonly componentName = 'data-grid'
    static readonly selector = '[data-kui-data-grid]'
    static readonly defaults: DataGridOptions = {
        columns: [],
        rows: [],
        rowKey: 'id',
        pageSize: 8,
        pageSizes: [8, 12, 20, 50],
        selectable: true,
        expandable: true,
        filterable: true,
        pagination: true,
        striped: true,
        emptyText: '没有匹配的数据',
    }

    private state: DataGridState
    private body!: HTMLTableSectionElement
    private footer!: HTMLElement
    private summary!: HTMLElement
    private search!: HTMLInputElement
    private expanded = new Set<string>()
    private lockedOffsets = new Map<string, number>()
    private selectAllBox: HTMLInputElement | null = null

    private constructor(element: HTMLElement, options: Partial<DataGridOptions> = {}) {
        super(element, DataGrid.componentName, mergeOptions(DataGrid.defaults, normalizeDataGridOptions(options)))
        this.state = {
            page: 1,
            pageSize: this.options.pageSize,
            sortField: '',
            sortOrder: '',
            filters: {},
            keyword: '',
            selected: [],
        }
        this.computeLockedOffsets()
        this.mount()
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<DataGridOptions> = {}): DataGrid {
        const element = DataGrid.resolveElement(target)
        return (
            getInstance<DataGrid>(element, DataGrid.componentName) ??
            new DataGrid(element, { ...readDataOptions<DataGridOptions>(element), ...options })
        )
    }

    /** 当前状态快照 */
    get snapshot(): DataGridState {
        return { ...this.state, filters: { ...this.state.filters }, selected: [...this.state.selected] }
    }

    /** 当前页可见行 */
    get visibleRows(): DataGridRow[] {
        return this.paginate(this.process()).rows
    }

    /** 替换数据 */
    setRows(rows: DataGridRow[]): void {
        this.options.rows = rows
        this.state.page = 1
        this.renderBody()
    }

    /** 设置全局搜索词 */
    setKeyword(keyword: string): void {
        this.state.keyword = keyword
        if (this.search) {
            this.search.value = keyword
        }
        this.state.page = 1
        this.renderBody()
    }

    /** 设置排序 */
    sort(field: string, order: SortOrder): void {
        this.state.sortField = field
        this.state.sortOrder = order
        this.renderBody()
    }

    /** 跳转到指定页 */
    setPage(page: number): void {
        this.state.page = page
        this.renderBody()
    }

    /** 重绘 */
    refresh(): void {
        this.state.page = 1
        this.renderBody()
    }

    /** 叶子列 */
    private get leaves(): DataGridColumn[] {
        return this.options.columns.flatMap((column) => column.children?.length ? column.children : [column])
    }

    private computeLockedOffsets(): void {
        let offset = 0
        this.leaves.forEach((column) => {
            if (!column.locked) {
                return
            }
            this.lockedOffsets.set(column.field, offset)
            offset += column.width ?? 120
        })
    }

    private mount(): void {
        const element = this.element
        element.classList.add('kui-data-grid')
        element.classList.toggle('is-striped', this.options.striped)
        element.replaceChildren()

        const toolbar = document.createElement('div')
        toolbar.className = 'kui-data-grid__toolbar'

        const search = document.createElement('div')
        search.className = 'kui-data-grid__search'
        const icon = document.createElement('i')
        icon.className = 'fa fa-search'
        icon.setAttribute('aria-hidden', 'true')
        const input = document.createElement('input')
        input.type = 'search'
        input.className = 'form-control'
        input.placeholder = '搜索全部字段'
        input.setAttribute('aria-label', '搜索表格')
        this.search = input
        this.listen(input, 'input', () => {
            this.state.keyword = input.value
            this.state.page = 1
            this.renderBody()
        })
        search.append(icon, input)

        const status = document.createElement('span')
        status.className = 'kui-data-grid__status'
        status.dataset.gridStatus = ''

        toolbar.append(search, status)

        const viewport = document.createElement('div')
        viewport.className = 'kui-data-grid__viewport'

        const table = document.createElement('table')
        table.className = 'table kui-data-grid__table'
        const head = document.createElement('thead')
        this.buildHead(head)
        const body = document.createElement('tbody')
        table.append(head, body)
        this.body = body
        viewport.append(table)

        const footer = document.createElement('div')
        footer.className = 'kui-data-grid__footer'
        const summary = document.createElement('p')
        summary.className = 'kui-data-grid__summary'
        const pager = document.createElement('div')
        pager.className = 'kui-data-grid__pager'
        pager.dataset.gridPager = ''
        footer.append(summary, pager)
        this.footer = footer
        this.summary = summary

        element.append(toolbar, viewport, footer)
        if (!this.options.pagination) {
            footer.hidden = true
        }
        this.renderBody()
    }

    private buildHead(head: HTMLTableSectionElement): void {
        const columns = this.options.columns
        const hasGroups = columns.some((column) => column.children?.length)
        const hasSelection = this.options.selectable
        const hasDetail = this.options.expandable
        const leadCount = hasSelection ? 1 : 0

        if (hasGroups) {
            const groupRow = document.createElement('tr')
            if (leadCount > 0) {
                const lead = document.createElement('th')
                lead.className = 'kui-data-grid__group kui-data-grid__lead'
                lead.colSpan = leadCount
                lead.rowSpan = 2
                lead.append(this.buildSelectAll())
                groupRow.append(lead)
            }
            columns.forEach((column) => {
                const cell = document.createElement('th')
                cell.className = 'kui-data-grid__group'
                cell.colSpan = column.children?.length ?? 1
                cell.rowSpan = column.children?.length ? 1 : 2
                cell.textContent = column.title
                if (column.align) {
                    cell.style.textAlign = column.align
                }
                groupRow.append(cell)
            })
            if (hasDetail) {
                const action = document.createElement('th')
                action.className = 'kui-data-grid__group is-locked-right'
                action.rowSpan = 2
                action.textContent = '操作'
                groupRow.append(action)
            }
            head.append(groupRow)
        }

        const headerRow = document.createElement('tr')
        if (!hasGroups && leadCount > 0) {
            const lead = document.createElement('th')
            lead.colSpan = leadCount
            lead.className = 'kui-data-grid__lead'
            lead.append(this.buildSelectAll())
            headerRow.append(lead)
        }
        this.leaves.forEach((column) => {
            headerRow.append(this.buildHeaderCell(column))
        })
        // 分组表头时操作列由第一行的 rowSpan 覆盖，避免重复出现一行“操作”
        if (hasDetail && !hasGroups) {
            const action = document.createElement('th')
            action.className = 'kui-data-grid__action-head is-locked-right'
            action.textContent = '操作'
            headerRow.append(action)
        }
        head.append(headerRow)

        if (this.options.filterable) {
            const filterRow = document.createElement('tr')
            filterRow.className = 'kui-data-grid__filters'
            if (leadCount > 0) {
                const lead = document.createElement('th')
                lead.colSpan = leadCount
                filterRow.append(lead)
            }
            this.leaves.forEach((column) => {
                const cell = document.createElement('th')
                if (column.filterable === false) {
                    filterRow.append(cell)
                    return
                }
                const input = document.createElement('input')
                input.type = 'search'
                input.className = 'form-control'
                input.placeholder = `筛选${column.title}`
                input.setAttribute('aria-label', `按${column.title}筛选`)
                this.listen(input, 'input', () => {
                    this.state.filters[column.field] = input.value
                    this.state.page = 1
                    this.renderBody()
                })
                cell.append(input)
                this.applyLock(cell, column)
                filterRow.append(cell)
            })
            if (hasDetail) {
                const action = document.createElement('th')
                action.className = 'is-locked-right'
                filterRow.append(action)
            }
            head.append(filterRow)
        }
    }

    private buildHeaderCell(column: DataGridColumn): HTMLTableCellElement {
        const cell = document.createElement('th')
        cell.scope = 'col'
        cell.dataset.sortField = column.field
        if (column.sortable !== false) {
            cell.classList.add('is-sortable')
            cell.tabIndex = 0
            const toggle = (): void => {
                const next: SortOrder = this.state.sortField !== column.field ? 'asc' : this.state.sortOrder === 'asc' ? 'desc' : this.state.sortOrder === 'desc' ? '' : 'asc'
                this.state.sortField = next === '' ? '' : column.field
                this.state.sortOrder = next
                this.renderBody()
            }
            this.listen(cell, 'click', toggle)
            this.listen(cell, 'keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    toggle()
                }
            })
        }
        const label = document.createElement('span')
        label.textContent = column.title
        const arrow = document.createElement('i')
        arrow.className = 'kui-data-grid__arrow'
        arrow.setAttribute('aria-hidden', 'true')
        cell.append(label, arrow)
        if (column.align) {
            cell.style.textAlign = column.align
        }
        this.applyLock(cell, column)
        return cell
    }

    private applyLock(cell: HTMLElement, column: DataGridColumn): void {
        if (!column.locked) {
            return
        }
        const width = `${column.width ?? 120}px`
        if (column.locked === 'right') {
            cell.classList.add('is-locked-right')
            cell.style.right = '0'
            cell.style.width = width
            cell.style.minWidth = width
            return
        }
        const offset = this.lockedOffsets.get(column.field) ?? 0
        cell.classList.add('is-locked')
        cell.style.left = `${offset}px`
        cell.style.width = width
        cell.style.minWidth = width
    }

    /** 表头全选（仅当前页） */
    private buildSelectAll(): HTMLElement {
        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.className = 'kui-checkbox'
        checkbox.setAttribute('aria-label', '全选当前页')
        this.selectAllBox = checkbox
        this.listen(checkbox, 'change', () => {
            const keys = this.pageRows().map((row, index) => String(row[this.options.rowKey] ?? index))
            if (checkbox.checked) {
                this.state.selected = [...new Set([...this.state.selected, ...keys])]
            } else {
                this.state.selected = this.state.selected.filter((key) => !keys.includes(key))
            }
            this.renderBody()
        })
        return checkbox
    }

    /** 处理：筛选 → 搜索 → 排序 */
    private process(): DataGridRow[] {
        const { filters, keyword, sortField, sortOrder } = this.state
        let rows = this.options.rows

        const activeFilters = Object.entries(filters).filter(([, value]) => value.trim() !== '')
        if (activeFilters.length) {
            rows = rows.filter((row) =>
                activeFilters.every(([field, value]) =>
                    String(row[field] ?? '')
                        .toLowerCase()
                        .includes(value.trim().toLowerCase()),
                ),
            )
        }

        if (keyword.trim()) {
            const needle = keyword.trim().toLowerCase()
            rows = rows.filter((row) =>
                this.leaves.some((column) => String(row[column.field] ?? '').toLowerCase().includes(needle)),
            )
        }

        if (sortField && sortOrder) {
            const direction = sortOrder === 'asc' ? 1 : -1
            rows = [...rows].sort((left, right) => {
                const a = left[sortField]
                const b = right[sortField]
                if (typeof a === 'number' && typeof b === 'number') {
                    return (a - b) * direction
                }
                return String(a ?? '').localeCompare(String(b ?? ''), 'zh-CN') * direction
            })
        }

        return rows
    }

    private paginate(rows: DataGridRow[]): { rows: DataGridRow[]; total: number; pages: number } {
        const total = rows.length
        const pages = Math.max(1, Math.ceil(total / this.state.pageSize))
        const page = Math.min(this.state.page, pages)
        this.state.page = page
        const start = (page - 1) * this.state.pageSize
        return { rows: rows.slice(start, start + this.state.pageSize), total, pages }
    }

    private renderBody(): void {
        const processed = this.process()
        const { rows, total, pages } = this.paginate(processed)
        const leaves = this.leaves
        const columnCount = leaves.length + (this.options.selectable ? 1 : 0) + (this.options.expandable ? 1 : 0)

        this.body.replaceChildren()
        if (!rows.length) {
            const empty = document.createElement('tr')
            const cell = document.createElement('td')
            cell.colSpan = columnCount
            cell.className = 'kui-data-grid__empty'
            cell.textContent = this.options.emptyText
            empty.append(cell)
            this.body.append(empty)
        }

        rows.forEach((row, index) => {
            const key = String(row[this.options.rowKey] ?? index)
            const tr = document.createElement('tr')
            tr.dataset.rowKey = key
            if (this.state.selected.includes(key)) {
                tr.classList.add('is-selected')
            }

            if (this.options.selectable) {
                const cell = document.createElement('td')
                cell.className = 'kui-data-grid__lead'
                const checkbox = document.createElement('input')
                checkbox.type = 'checkbox'
                checkbox.className = 'kui-checkbox'
                checkbox.setAttribute('aria-label', `选择第 ${index + 1} 行`)
                checkbox.checked = this.state.selected.includes(key)
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        this.state.selected = [...new Set([...this.state.selected, key])]
                    } else {
                        this.state.selected = this.state.selected.filter((item) => item !== key)
                    }
                    tr.classList.toggle('is-selected', checkbox.checked)
                    this.syncStatus()
                    this.notify()
                })
                cell.append(checkbox)
                tr.append(cell)
            }

            leaves.forEach((column) => {
                const cell = document.createElement('td')
                if (column.align) {
                    cell.style.textAlign = column.align
                }
                const value = row[column.field]
                if (column.formatter) {
                    cell.innerHTML = column.formatter(value, row, index)
                } else {
                    cell.textContent = value === null || value === undefined || value === '' ? '—' : String(value)
                }
                this.applyLock(cell, column)
                tr.append(cell)
            })

            if (this.options.expandable) {
                const action = document.createElement('td')
                action.className = 'kui-data-grid__action is-locked-right'
                const button = document.createElement('button')
                button.type = 'button'
                button.className = 'kui-data-grid__expand'
                button.setAttribute('aria-label', '展开详情')
                button.setAttribute('aria-expanded', this.expanded.has(key) ? 'true' : 'false')
                button.innerHTML = `<i class="fa fa-chevron-right" aria-hidden="true"></i>`
                if (this.expanded.has(key)) {
                    button.classList.add('is-open')
                }
                button.addEventListener('click', () => {
                    if (this.expanded.has(key)) {
                        this.expanded.delete(key)
                    } else {
                        this.expanded.add(key)
                    }
                    this.renderBody()
                })
                action.append(button)
                tr.append(action)
            }

            this.body.append(tr)

            if (this.options.expandable && this.expanded.has(key)) {
                const detailRow = document.createElement('tr')
                detailRow.className = 'kui-data-grid__detail'
                const cell = document.createElement('td')
                cell.colSpan = columnCount
                cell.innerHTML = this.options.detail
                    ? this.options.detail(row)
                    : `<pre class="kui-code-block__pre"><code>${JSON.stringify(row, null, 2)}</code></pre>`
                detailRow.append(cell)
                this.body.append(detailRow)
            }
        })

        this.syncSortIndicators()
        this.syncStatus()
        this.renderPager(total, pages)
        this.notify()
    }

    private syncSortIndicators(): void {
        this.element.querySelectorAll<HTMLElement>('[data-sort-field]').forEach((cell) => {
            const active = cell.dataset.sortField === this.state.sortField && this.state.sortOrder !== ''
            cell.classList.toggle('is-sorted', active)
            cell.dataset.sortOrder = active ? this.state.sortOrder : ''
        })
    }

    private syncStatus(): void {
        const status = this.element.querySelector<HTMLElement>('[data-grid-status]')
        if (status) {
            const count = this.state.selected.length
            status.textContent = count ? `已选 ${count} 项` : ''
            status.classList.toggle('is-visible', count > 0)
        }
        if (this.selectAllBox) {
            const keys = this.pageRows().map((row, index) => String(row[this.options.rowKey] ?? index))
            const selected = keys.filter((key) => this.state.selected.includes(key)).length
            this.selectAllBox.checked = keys.length > 0 && selected === keys.length
            this.selectAllBox.indeterminate = selected > 0 && selected < keys.length
        }
    }

    /** 当前页的行（用于全选与状态同步） */
    private pageRows(): DataGridRow[] {
        const { rows } = this.paginate(this.process())
        return rows
    }

    private renderPager(total: number, pages: number): void {
        this.summary.textContent = `共 ${total} 条 · 第 ${this.state.page} / ${pages} 页`
        const pager = this.footer.querySelector<HTMLElement>('[data-grid-pager]')
        if (!pager || !this.options.pagination) {
            return
        }
        pager.replaceChildren()

        const size = document.createElement('select')
        size.className = 'form-control kui-data-grid__size'
        size.setAttribute('aria-label', '每页条数')
        this.options.pageSizes.forEach((option) => {
            const item = document.createElement('option')
            item.value = String(option)
            item.textContent = `${option} 条/页`
            item.selected = option === this.state.pageSize
            size.append(item)
        })
        size.addEventListener('change', () => {
            this.state.pageSize = Number(size.value)
            this.state.page = 1
            this.renderBody()
        })
        pager.append(size)

        const button = (label: string, disabled: boolean, onClick: () => void, active = false): HTMLButtonElement => {
            const element = document.createElement('button')
            element.type = 'button'
            element.className = `kui-data-grid__page${active ? ' is-active' : ''}`
            element.textContent = label
            element.disabled = disabled
            element.addEventListener('click', onClick)
            return element
        }

        pager.append(button('上一页', this.state.page <= 1, () => this.setPage(this.state.page - 1)))

        const windowSize = 5
        let start = Math.max(1, this.state.page - Math.floor(windowSize / 2))
        const end = Math.min(pages, start + windowSize - 1)
        start = Math.max(1, end - windowSize + 1)
        for (let page = start; page <= end; page += 1) {
            pager.append(button(String(page), false, () => this.setPage(page), page === this.state.page))
        }

        pager.append(button('下一页', this.state.page >= pages, () => this.setPage(this.state.page + 1)))
    }

    private notify(): void {
        this.options.onChange?.(this.snapshot)
        this.emit('kui:data-grid:change', this.snapshot)
    }
}

function normalizeDataGridOptions(options: Partial<DataGridOptions>): Partial<DataGridOptions> {
    const next = { ...options }
    const rows = next.rows as unknown
    if (typeof rows === 'string') {
        next.rows = JSON.parse(rows) as DataGridRow[]
    }
    const columns = next.columns as unknown
    if (typeof columns === 'string') {
        next.columns = JSON.parse(columns) as DataGridColumn[]
    }
    return next
}
