import type { PlainObject } from "../../core/options";

export type TableRow = Record<string, unknown>;
export type TableSortOrder = 'asc' | 'desc'
export type TableFetcher = (options: TableFetcherOptions) => Promise<TableRow[] | TableResponse>

export interface TableFetchOptions extends PlainObject {
    url: string
    page: number
    pageSize: number
    searchText: string
    sortName: string | null
    sortOrder: TableSortOrder
}

export interface TableResponse extends PlainObject {
    rows: TableRow[]
    total?: number
}


export interface TableColumn extends PlainObject {
    field: string
    title: string
    sortable?: boolean
    align?: 'left' | 'center' | 'right'
    visible?: boolean
    formatter?: (value: unknown, row: TableRow, column: TableColumn) => string | HTMLElement
}

export interface TableOptions extends PlainObject {
    cardView: boolean
    clickToSelect: boolean
    columns: TableColumn[]
    data: TableRow[]
    detailFormatter?: (index: number, row: TableRow) => string | HTMLElement
    detailView: boolean
    emptyText: string
    fetcher: TableFetcher
    mobileResponsive: boolean
    pageSize: number
    pagination: boolean
    search: boolean
    searchPlaceholder: string
    searchText: string
    selectable: boolean
    showColumns: boolean
    showRefresh: boolean
    showToggle: boolean
    sortName: string | null
    sortOrder: TableSortOrder
    url: string
    onCheck?: (row: TableRow, index: number) => void
    onCheckAll?: (rows: TableRow[]) => void
    onClickRow?: (row: TableRow, element: HTMLTableRowElement, index: number) => void
    onLoadSuccess?: (rows: TableRow[]) => void
    onPageChange?: (page: number, pageSize: number) => void
    onSort?: (field: string, order: TableSortOrder) => void
    onUncheck?: (row: TableRow, index: number) => void
    onUncheckAll?: () => void
}

export type TableProps = TableOptions

export interface IndexedTableRow {
    row: TableRow
    rawIndex: number
}

export function filterTableRows(
    data: TableRow[],
    columns: TableColumn[],
    searchEnabled: boolean,
    searchText: string,
): IndexedTableRow[] {
    const text = searchText.trim().toLowerCase()
    const rows = data.map((row, rawIndex) => ({row, rawIndex}))
    if (!searchEnabled || !text) return rows
    return rows.filter(({row}) =>
        columns.some((column) => stringifyTableValue(row[column.field]).toLowerCase().includes(text))
    )
}

export function sortTableRows(
    rows: IndexedTableRow[],
    sortName: string | null,
    sortOrder: TableSortOrder,
): IndexedTableRow[] {
    if (!sortName) return rows
    return rows.sort((left, right) => compareValues(left.row[sortName], right.row[sortName], sortOrder))
}

export function paginateTableRows(rows: IndexedTableRow[], page: number, pageSize: number): IndexedTableRow[] {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
}

export function countTablePages(rows: IndexedTableRow[], pageSize: number): number {
    return Math.max(1, Math.ceil(rows.length / pageSize))
}

export function normalizeTableRows(data: TableRow | TableRow[]): TableRow[] {
    return Array.isArray(data) ? data : [data]
}

export function shouldIgnoreTableSelection(target: EventTarget | null): boolean {
    return target instanceof Element && Boolean(target.closest('a, button, input, label, select, textarea, [data-ignore-click-to-select]'))
}

export async function defaultTableFetcher(options: TableFetchOptions): Promise<TableRow[] | TableResponse> {
    const response = await fetch(options.url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    if (!response.ok) throw new Error(`KUI table request failed: ${response.status}`)
    return response.json() as Promise<TableRow[] | TableResponse>
}

export function stringifyTableValue(value: unknown): string {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
        return String(value)
    }
    if (value instanceof Date) return value.toISOString()
    try {
       return JSON.stringify(value) ?? ''
    } catch {
        return ''
    }
}

function compareValues(leftValue: unknown, rightValue: unknown, order: TableSortOrder): number {
    const direction = order === 'asc' ? 1 : -1
    if (typeof leftValue === 'number' && typeof rightValue === 'number') return (leftValue - rightValue) * direction
    return stringifyTableValue(leftValue).localeCompare(stringifyTableValue(rightValue), undefined, {
        numeric: true,
        sensitivity: 'base',
    }) * direction
}
