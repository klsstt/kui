import { stringifyTableValue, type TableColumn, type TableRow } from "./table-model";

export function resolveTableElement(root: HTMLElement): HTMLTableElement {
    if (root instanceof HTMLTableElement) return root
    const existing = root.querySelector<HTMLTableElement>('table')
    if (existing) return existing
    const table = document.createElement('table')
    root.append(table)
    return table
}

export function readStaticTableData(table: HTMLTableElement): { columns: TableColumn[], data: TableRow[] } | null {
    const headerCells = Array.from(table.querySelectorAll<HTMLTableCellElement>('thead th'))
    const bodyRows = Array.from(table.querySelectorAll<HTMLTableRowElement>('tbody tr'))
    if (headerCells.length === 0 || bodyRows.length === 0) return null

    const columns = headerCells.map((cell, index) => ({field: `column${index}`, title: cell.textContent?.trim()  || `Column ${index + 1}`}))

    const data = bodyRows.map((row) => {
        const cells = Array.from(row.querySelectorAll<HTMLTableCellElement>('td'))
        return columns.reduce<TableRow>((record, column, index) => {
            record[column.field] = cells[index]?.textContent?.trim() ?? ''
            return record
        }, {})
    })
    return { columns, data }
}

export function getTableRowLabel(row: TableRow, columns: TableColumn[], rawIndex: number): string {
    const firstColumn = columns[0]
    const label = stringifyTableValue(firstColumn ? row[firstColumn.field] : null).trim()
    return label || `第 ${rawIndex} 行`
}
