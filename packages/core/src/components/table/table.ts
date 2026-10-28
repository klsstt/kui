import { Component } from "../../core/component";
import { delegate, type EventDisposer } from "../../core/events";
import { getInstance } from '../../core/instances';
import { mergeOptions, readDataOptions } from '../../core/options';
import { getTableRowLabel, readStaticTableData, resolveTableElement } from "./table-dom";
import {
    countTablePages,
    defaultTableFetcher,
    filterTableRows,
    normalizeTableRows,
    paginateTableRows,
    shouldIgnoreTableSelection,
    sortTableRows,
    stringifyTableValue,
    type IndexedTableRow,
    type TableColumn,
    type TableFetchOptions,
    type TableOptions,
    type TableResponse,
    type TableRow,
    type TableSortOrder,
} from './table-model';

export type {
    TableColumn,
    TableFetchOptions,
    TableOptions,
    TableFetcher,
    TableProps,
    TableResponse,
    TableRow,
    TableSortOrder,
} from "./table-model";

let tableId = 0

export class Table extends Component<TableOptions> {
    static readonly componentName = 'table'
    static readonly selector = '[data-kui-table], table[data-toggle="table"], .kui-table'
    static readonly defaults: TableOptions =  {
        cardView: false,
        clickToSelect: false,
        columns: [],
        data: [],
        detailView: false,
        emptyText: 'No Data',
        fetcher: defaultTableFetcher,
        mobileResponsive: false,
        pageSize: 10,
        pagination: false,
        search: false,
        searchPlaceholder: 'Search',
        searchText: '',
        selectable: false,
        showColumns: false,
        showRefresh: false,
        showToggle: false,
        sortName: null,
        sortOrder: 'asc',
        url: '',
    }

    private readonly tableElement: HTMLTableElement
    private paginationElement: HTMLElement | null = null
    private toolbarElement: HTMLElement | null = null
    private toolbarBound = false
    private cardView = false
    private page = 1
    private readonly expandedRows = new Set<number>()
    private readonly selectedRows = new Set<number>()

    private constructor(element: HTMLElement, options: Partial<TableOptions> = {}) {
        super(element, Table.componentName, mergeOptions(Table.defaults, options))
        this.tableElement = resolveTableElement(element)
        this.tableElement.id ||= `kui-table-${++tableId}`
        const staticData = this.options.columns.length === 0 && this.options.data.length === 0 ? readStaticTableData(this.tableElement) : null
        if (staticData) {
            this.options.columns = staticData.columns
            this.options.data = staticData.data
        }

        this.cardView = this.options.cardView
        this.bindEvents()
        this.render()
        if (this.options.url && this.options.data.length === 0)  {
            void this.refresh().catch(() => undefined)
        }
    }

    static getOrCreate(target: HTMLElement | string, options: Partial<TableOptions> = {}): Table {
        const element = Table.resolveElement(target)
        return (
            getInstance<Table>(element, Table.componentName) ?? new Table(element, { ...readDataOptions<TableOptions>(element), ...options })
        )
    }

    load(data: TableRow[] | TableResponse): void {
        const rows = Array.isArray(data) ? data : data.rows
        this.options.data = rows
        this.page = 1
        this.selectedRows.clear()
        this.render()
        this.options.onLoadSuccess?.(rows)
        this.emit('kui:table:loaded', { data: rows })
    }

    append(data: TableRow | TableRow[]): void {
        this.options.data = [...this.options.data, ...normalizeTableRows(data)]
        this.render()
    }

    prepend(data: TableRow | TableRow[]): void {
        this.options.data = [...normalizeTableRows(data), ...this.options.data]
        this.render()
    }

    insertRow(params: { index: number; row: TableRow }): void {
        const rows = [...this.options.data]
        rows.splice(params.index, 0, params.row)
        this.options.data = rows
        this.render()
    }

    updateRow(params: { index: number; replace?: boolean; row: TableRow }): void {
        const existing = this.options.data[params.index]
        if (!existing) {
            return
        }

        this.options.data[params.index] = params.replace ? params.row : { ...existing, ...params.row }
        this.render()
    }

    updateCell(params: { field: string; index: number; value: unknown }): void {
        const existing = this.options.data[params.index]
        if (!existing) {
            return
        }

        this.options.data[params.index] = { ...existing, [params.field]: params.value }
        this.render()
    }

    remove(params: { field?: string; values?: unknown[] } | ((row: TableRow, index: number) => boolean)): void {
        if (typeof params === 'function') {
            this.options.data = this.options.data.filter((row, index) => !params(row, index))
        } else if (params.field && params.values) {
            const values = new Set(params.values)
            this.options.data = this.options.data.filter((row) => !values.has(row[params.field ?? '']))
        }

        this.selectedRows.clear()
        this.render()
    }

    removeAll(): void {
        this.options.data = []
        this.selectedRows.clear()
        this.render()
    }

    async refresh(options: Partial<TableFetchOptions> = {}): Promise<void> {
        const url = options.url ?? this.options.url
        if (!url) {
            this.render()
            return
        }

        if(!this.emit('kui:table:refresh', { url})){
            return
        }

        const response = await this.options.fetcher({
            url,
            page: options.page ?? this.page,
            pageSize: options.pageSize ?? this.options.pageSize,
            searchText: options.searchText ?? this.options.searchText,
            sortName: options.sortName ?? this.options.sortName,
            sortOrder: options.sortOrder ?? this.options.sortOrder,
        })
        this.load(response)
    }

    search(text: string): void {
        this.options.searchText = text
        this.page = 1
        this.renderTable()
        this.emit('kui:table:searched', { searchText: text })
    }

    getData(): TableRow[] {
        return [...this.options.data]
    }

    getOptions(): TableOptions {
        return { ...this.options, data: [...this.options.data] , columns: [...this.options.columns] }
    }

    setColumns(columns: TableColumn[]): void {
        this.options.columns = columns
        this.render()
    }

    sort(field: string, order: TableSortOrder=this.nextSortOrder(field)): void {
        if (!this.emit('kui:table:sort', { field, order })) {
            return
        }

        this.options.sortName = field
        this.options.sortOrder = order
        this.render()
        this.options.onSort?.(field, order)
    }

    nextPage(): void {
        this.goToPage(this.page + 1)
    }

    previousPage(): void {
        this.goToPage(this.page - 1)
    }

    goToPage(page: number): void {
        const nextPage = Math.min(Math.max(page, 1), this.totalPages())
        if (nextPage === this.page) {
            return
        }

        if (!this.emit('kui:table:page', { page: nextPage })) {
            return
        }

        this.page = nextPage
        this.render()
        this.options.onPageChange?.(this.page, this.options.pageSize)
    }

    getSelectedRows(): TableRow[]  {
        return Array.from(this.selectedRows).map((index) => this.options.data[index]).filter(Boolean)
    }

    getSelections(): TableRow[] {
        return this.getSelectedRows()
    }

    check(index: number): void {
        this.selectedRows.add(index)
        this.render()
        const row = this.options.data[index]
        if (row) {
            this.options.onCheck?.(row, index)
        }
        this.emit('kui:table:selection-change', { selectedRows: this.getSelectedRows() })
    }

    uncheck(index: number): void {
        this.selectedRows.delete(index)
        this.render()
        const row = this.options.data[index]
        if (row) {
            this.options.onUncheck?.(row, index)
        }
        this.emit('kui:table:selection-change', { selectedRows: this.getSelectedRows() })
    }

    checkBy(params: { field: string; values: unknown[] }): void {
        const values = new Set(params.values)
        this.options.data.forEach((row, index) => {
            if (values.has(row[params.field])) {
                this.selectedRows.add(index)
            }
        })
        this.render()
        this.emit('kui:table:selection-change', { selectedRows: this.getSelectedRows() })
    }

    uncheckBy(params: { field: string; values: unknown[] }): void {
        const values = new Set(params.values)
        this.options.data.forEach((row, index) => {
            if (values.has(row[params.field])) {
                this.selectedRows.delete(index)
            }
        })
        this.render()
        this.emit('kui:table:selection-change', { selectedRows: this.getSelectedRows() })
    }

    checkAll(): void {
        this.options.data.forEach((_row, index) => this.selectedRows.add(index))
        this.render()
        this.options.onCheckAll?.(this.getSelectedRows())
        this.emit('kui:table:selection-change', { selectedRows: this.getSelectedRows() })
    }

    uncheckAll(): void {
        this.selectedRows.clear()
        this.render()
        this.options.onUncheckAll?.()
        this.emit('kui:table:selection-change', { selectedRows: [] })
    }

    showColumn(field: string): void {
        this.setColumnVisibility(field, true)
    }

    hideColumn(field: string): void {
        this.setColumnVisibility(field, false)
    }

    toggleView(cardView = !this.cardView): void {
        this.cardView = cardView
        this.options.cardView = cardView
        this.render()
        this.emit('kui:table:view-toggle', { cardView })
    }

    private bindEvents(): void {
        this.listen(this.element, 'click', (event) =>  {
            const target = event.target
            if (!(target instanceof Element)) {
                return
            }

            const sortButton = target.closest<HTMLElement>('[data-kui-table-field]')
            if (sortButton) {
                const field = sortButton.dataset.kuiSortField
                const column = this.options.columns.find((candidate) => candidate.field === field)
                if (field && column && column.sortable) {
                    this.sort(field)
                }
                return
            }
            const detailButton = target.closest<HTMLButtonElement>('[data-kui-detail-row]')
            if (detailButton) {
                this.toggleDetail(Number(detailButton.dataset.kuiDetailRow))
                return
            }
            const tableRow = target.closest<HTMLTableRowElement>('[data-kui-row-index]')
            const rowIndex = Number(tableRow?.dataset.kuiRowIndex)
            const row = this.options.data[rowIndex]
            if (tableRow && row && this.tableElement.contains(tableRow)) {
                this.options.onClickRow?.(row, tableRow, rowIndex)
                if (this.options.clickToSelect && this.options.selectable && !shouldIgnoreTableSelection(event.target)) {
                    this.toggleRowSelection(rowIndex)
                }
            }
        })

        this.listen(this.element, 'change', (event) => {
            const target = event.target
            if (!(target instanceof HTMLInputElement) || !target.matches('[data-kui-select-row]')) {
                return
            }

            const rowIndex = Number(target.dataset.kuiSelectRow)
            if (target.checked) {
                this.selectedRows.add(rowIndex)
                const row = this.options.data[rowIndex]
                if (row) {
                    this.options.onCheck?.(row, rowIndex)
                }
            } else {
                this.selectedRows.delete(rowIndex)
                const row = this.options.data[rowIndex]
                if (row) {
                    this.options.onUncheck?.(row, rowIndex)
                }
            }
            this.emit('kui:table:selection-change', { selectedRows: this.getSelectedRows() })
        })
    }

    private render(): void {
        this.renderToolbar()
        this.renderTable()
    }

    private renderTable(): void {
        this.tableElement.classList.add('table', 'kui-table')
        this.tableElement.classList.toggle('kui-table--card', this.cardView)
        this.tableElement.classList.toggle('kui-table--responsive', this.options.mobileResponsive)
        this.tableElement.innerHTML = ''
        this.tableElement.append(this.renderHead(), this.renderBody())
        this.renderPagination()
    }

    private renderToolbar(): void {
        if (!this.hasToolbar()) {
            this.toolbarElement?.remove()
            this.toolbarElement = null
            this.toolbarBound = false
            return
        }

        const toolbar = this.ensureToolbarElement()
        toolbar.innerHTML = ''

        if(this.options.search) {
            const search = document.createElement('input')
            search.type = 'search'
            search.className = 'kui-table-toolbar__search'
            search.placeholder = this.options.searchPlaceholder
            search.value = this.options.searchText
            search.dataset.kuiTableSearch = 'true'
            toolbar.append(search)
        }

        const actions = document.createElement('div')
        actions.className = 'kui-table-toolbar__actions'

        if(this.options.showRefresh) {
            const refresh = document.createElement('button')
            refresh.type = 'button'
            refresh.className = 'btn btn-default'
            refresh.dataset.kuiTableRefresh = 'true'
            refresh.textContent = '刷新'
            actions.append(refresh)
        }

        if (this.options.showToggle) {
            const toggle = document.createElement('button')
            toggle.type = 'button'
            toggle.className = 'btn btn-default'
            toggle.dataset.kuiTableToggle = 'true'
            toggle.textContent = this.cardView ? '表格视图' : '卡片视图'
            actions.append(toggle)
        }

        if (this.options.showColumns) {
            actions.append(this.renderColumnMenu())
        }

        if (actions.children.length) {
            toolbar.append(actions)
        }
    }

    private renderColumnMenu(): HTMLElement {
        const menu = document.createElement('details')
        menu.className = 'kui-table-toolbar__columns'
        const summary = document.createElement('summary')
        summary.className = 'btn btn-default'
        summary.textContent = '列'
        menu.append(summary)

        const list = document.createElement('div')
        list.className = 'kui-table-toolbar__colum-list'
        this.options.columns.forEach((column) => {
            const label = document.createElement('label')
            const checkbox = document.createElement('input')
            checkbox.type = 'checkbox'
            checkbox.checked = column.visible !== false
            checkbox.dataset.kuiTableColumn = column.field
            label.append(checkbox, document.createTextNode(column.title))
            list.append(label)
        })
        menu.append(list)
        return menu
    }

    private renderHead(): HTMLTableSectionElement {
        const thead = document.createElement('thead')
        const row = document.createElement('tr')

        if (this.options.detailView) {
            const detailHeader = document.createElement('th')
            detailHeader.scope = 'col'
            detailHeader.setAttribute('aria-label', '行详情')
            row.append(detailHeader)
        }

        if(this.options.selectable) {
            const selectHeader = document.createElement('th')
            selectHeader.scope = 'col'
            selectHeader.setAttribute('aria-label', '选择行')
            row.append(selectHeader)
        }

        this.visibleColumns().forEach((column) => {
            const th = document.createElement('th')
            th.scope = 'col'
            if (column.align) {
                th.style.textAlign = column.align
            }

            if(column.sortable) {
                const ariaSort = this.options.sortName === column.field ? this.options.sortOrder === 'asc' ? 'ascending' : 'descending' : 'none'
                th.setAttribute('aria-sort', ariaSort)
                const button = document.createElement('button')
                button.type = 'button'
                button.className = 'kui-table__sort'
                button.textContent = this.sortLabel(column)
                button.dataset.kuiSortField = column.field
                button.setAttribute('aria-label', `${column.title}, ${ariaSort === 'ascending' ? '当前升序，切换为降序' : '按升序排序' }`)
                th.append(button)
            } else {
                th.textContent = column.title
            }

            row.append(th)
        })

        thead.append(row)
        return thead
    }

    private renderBody(): HTMLTableSectionElement {
        const tbody = document.createElement('tbody')
        const rows = this.visibleRows()

        if (rows.length === 0) {
            const tr = document.createElement('tr')
            const td = document.createElement('td')
            td.colSpan = this.tableColumnCount()
            td.textContent = this.options.emptyText
            tr.append(td)
            tbody.append(tr)
            return tbody
        }

        rows.forEach(({row, rawIndex }) => {
            const tr = document.createElement('tr')
            tr.dataset.kuiRowIndex = String(rawIndex)
            const rowLabel = getTableRowLabel(row, this.visibleColumns(), rawIndex)

            if(this.options.detailView) {
                const td = document.createElement('td')
                const button = document.createElement('button')
                const expanded = this.expandedRows.has(rawIndex)
                const detailId = `${this.tableElement.id}-detail-${rawIndex}`
                button.type = 'button'
                button.className = 'kui-table__detail-toggle'
                button.textContent = expanded ? '-' : '+'
                button.dataset.kuiDetailRow = String(rawIndex)
                button.setAttribute('aria-expanded', String(expanded))
                button.setAttribute('aria-controls', detailId)
                button.setAttribute('aria-label', `${expanded ? '收起' : '展开'}${rowLabel}的详情`)
                td.append(button)
                tr.append(td)
            }

            if(this.options.selectable) {
                const td = document.createElement('td')
                const checkbox = document.createElement('input')
                checkbox.type = 'checkbox'
                checkbox.checked = this.selectedRows.has(rawIndex)
                checkbox.dataset.kuiSelectRow = String(rawIndex)
                checkbox.setAttribute('aria-label', `选择${rowLabel}`)
                td.append(checkbox)
                tr.append(td)
            }

            this.visibleColumns().forEach((column) => {
                const td = document.createElement('td')
                if (column.align) {
                    td.style.textAlign = column.align
                }
                td.dataset.label = column.title

                const value = row[column.field]
                const formatted = column.formatter?.(value, row, column) ?? stringifyTableValue(value)
                if (formatted instanceof HTMLElement) {
                    td.append(formatted)
                } else {
                    td.textContent = formatted
                }
                tr.append(td)
            })

            tbody.append(tr)

            if(this.options.detailView) {
                tbody.append(this.renderDetailRow(row, rawIndex, this.expandedRows.has(rawIndex)))
            }
        })

        return tbody
    }

    private renderDetailRow(row: TableRow, rawIndex: number, expanded: boolean): HTMLTableRowElement {
        const detailRow = document.createElement('tr')
        detailRow.id = `${this.tableElement.id}-detail-${rawIndex}`
        detailRow.className = 'kui-table__detail-row'
        detailRow.hidden = !expanded
        const td = document.createElement('td')
        td.className = 'kui-table__detail'
        td.colSpan = this.tableColumnCount()
        const content = expanded ? this.options.detailFormatter?.(rawIndex, row) ?? '' : ''
        if (content instanceof HTMLElement) {
            td.append(content)
        }else{
            td.textContent = content
        }
        detailRow.append(td)
        return detailRow
    }

    private renderPagination(): void {
        if (!this.options.pagination) {
            this.paginationElement?.remove()
            this.paginationElement = null
            return
        }

        const totalPages = this.totalPages()
        if(this.page > totalPages) {
            this.page = totalPages
        }

        const pagination = this.ensurePaginationElement()
        pagination.innerHTML = ''

        for(let page= 1; page <= totalPages; page += 1) {
            const button = document.createElement('button')
            button.type = 'button'
            button.className = page === this.page ? 'active' : ''
            button.textContent = String(page)
            button.dataset.kuiPage = String(page)
            button.setAttribute('aria-label', `跳转到第${page}页`)
            if (page === this.page) {
                button.setAttribute('aria-current', 'page')
            }
            pagination.append(button)
        }
    }

    private visibleRows(): IndexedTableRow[] {
        const rows = this.sortedRows()
        if (!this.options.pagination) {
            return rows
        }

        return paginateTableRows(rows, this.page, this.options.pageSize)
    }

    private sortedRows(): IndexedTableRow[] {
        return sortTableRows(this.filteredRows(), this.options.sortName, this.options.sortOrder)
    }

    private totalPages(): number {
        return countTablePages(this.filteredRows(), this.options.pageSize)
    }

    private filteredRows(): IndexedTableRow[] {
        return filterTableRows(this.options.data,this.options.columns,this.options.search,this.options.searchText)
    }

    private visibleColumns(): TableColumn[] {
        return this.options.columns.filter((column) => column.visible !== false)
    }

    private setColumnVisibility(field: string, visible: boolean): void {
        this.options.columns = this.options.columns.map((column) => column.field === field ? {...column, visible} : column)
        this.render()
    }

    private tableColumnCount(): number {
        return Math.max(1, this.visibleColumns().length + (this.options.selectable ? 1 : 0) + (this.options.detailView ? 1 : 0))
    }

    private toggleDetail(index: number): void {
        if (this.expandedRows.has(index)) {
            this.expandedRows.delete(index)
        } else {
            this.expandedRows.add(index)
        }
        this.render()
        this.emit('kui:table:detail-toggle', { index, expanded: this.expandedRows.has(index) })
    }

    private toggleRowSelection(index: number): void {
        if (this.selectedRows.has(index)) {
            this.uncheck(index)
        } else {
            this.check(index)
        }
    }

    private nextSortOrder(field: string): TableSortOrder {
        return this.options.sortName === field && this.options.sortOrder === 'asc' ? 'desc' : 'asc'
    }

    private sortLabel(column: TableColumn): string {
        if (this.options.sortName !== column.field) {
            return column.title
        }

        return `${column.title} (${this.options.sortOrder})`
    }

    private ensurePaginationElement(): HTMLElement {
        if (this.paginationElement) {
            return this.paginationElement
        }

        const pagination = document.createElement('nav')
        pagination.className = 'kui-table-pagination'
        pagination.setAttribute('aria-label', '表格分页')
        if (this.element === this.tableElement) {
            this.tableElement.after(pagination)
        } else {
            this.element.append(pagination)
        }
        this.listen(pagination, 'click', (event) => {
            const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-kui-page]'): null
            if (target) {
                this.goToPage(Number(target.dataset.kuiPage))
            }
        })
        this.paginationElement = pagination
        return pagination
    }

    private hasToolbar(): boolean {
        return this.options.search || this.options.showRefresh || this.options.showToggle || this.options.showColumns
    }

    private ensureToolbarElement(): HTMLElement {
        if (this.toolbarElement) {
            return this.toolbarElement
        }

        const toolbar = document.createElement('div')
        toolbar.className = 'kui-table-toolbar'
        this.tableElement.before(toolbar)
        this.toolbarElement = toolbar
        this.bindToolbarEvents(toolbar)
        return toolbar
    }

    private bindToolbarEvents(toolbar: HTMLElement): void {
        if (this.toolbarBound) {
            return
        }

        this.toolbarBound = true
        this.listen(toolbar, 'click', (event) => {
            const target = event.target
            if (target instanceof HTMLButtonElement && target.matches('[data-kui-table-search]')){
                this.search(target.value)
            }
        })

        this.listen(toolbar, 'click', (event) => {
            const target = event.target
            if (!(target instanceof Element)) {
                return
            }

            if (target.closest('[data-kui-table-refresh]')){
                void this.refresh()
                return
            }

            if(target.closest('[data-kui-table-toggle]')){
                this.toggleView()
            }
        })

        this.listen(toolbar, 'change', (event) => {
            const target = event.target
            if (!(target instanceof HTMLInputElement) || !target.dataset.kuiTableColumn) {
                return
            }
            this.setColumnVisibility(target.dataset.kuiTableColumn, target.checked)
        })
    }
}

export function bindTableDataApi(root: Document = document): EventDisposer {
    return delegate(root, 'click', Table.selector, (_event, trigger) =>  {
        Table.getOrCreate(trigger)
    })
}
