import type { TreeItem } from '@kui/core'
import type { DocPageContext } from '../../docs/types'
import { callout, codeSample, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 树形数据。
 * 电商分类是固定 44px 的单行：箭头、复选、名称与右对齐数量，
 * 层级只用每级 20px 缩进和一条极浅的左侧导线表达。
 * 省市区复用同一份 children 数据，点击行回显完整路径。
 */

const regionTree: TreeItem[] = [
    {
        id: 'zhejiang',
        name: '浙江省',
        open: true,
        children: [
            { id: 'hangzhou', name: '杭州市', open: true, children: [{ id: 'xihu', name: '西湖区' }, { id: 'binjiang', name: '滨江区' }, { id: 'yuhang', name: '余杭区' }] },
            { id: 'ningbo', name: '宁波市', children: [{ id: 'haishu', name: '海曙区' }, { id: 'yinzhou', name: '鄞州区' }] },
        ],
    },
    {
        id: 'jiangsu',
        name: '江苏省',
        open: true,
        children: [
            { id: 'nanjing', name: '南京市', children: [{ id: 'gulou', name: '鼓楼区' }, { id: 'jianye', name: '建邺区' }] },
            { id: 'suzhou', name: '苏州市', children: [{ id: 'gusu', name: '姑苏区' }, { id: 'sip', name: '工业园区' }] },
        ],
    },
    {
        id: 'guangdong',
        name: '广东省',
        children: [
            { id: 'guangzhou', name: '广州市', children: [{ id: 'tianhe', name: '天河区' }, { id: 'yuexiu', name: '越秀区' }] },
            { id: 'shenzhen', name: '深圳市', children: [{ id: 'nanshan', name: '南山区' }, { id: 'futian', name: '福田区' }] },
        ],
    },
]

function regionTreeRows(nodes: TreeItem[], level = 1, parentPath: string[] = [], indent = '    '): string {
    return nodes
        .map((node) => {
            const name = node.name ?? ''
            const path = [...parentPath, name]
            const id = `tr-region-${node.id ?? path.join('-')}`
            const children = node.children ?? []
            const hasChildren = children.length > 0
            const open = hasChildren && node.open === true
            const rowIndent = `${indent}    `
            const contentIndent = `${rowIndent}    `
            const toggle = hasChildren
                ? `<button type="button" class="tr-toggle" data-tr-region-toggle data-tr-name="${name}" aria-expanded="${open}" aria-controls="${id}" aria-label="${open ? '收起' : '展开'} ${name}"><i class="fa ${open ? 'fa-angle-down' : 'fa-angle-right'}" aria-hidden="true"></i></button>`
                : '<span class="tr-toggle-space" aria-hidden="true"></span>'
            const group = hasChildren
                ? `\n${rowIndent}<ul class="kui-list kui-list--flush kui-nestable__children" id="${id}" role="group"${open ? '' : ' hidden'}>\n${regionTreeRows(children, level + 1, path, contentIndent)}\n${rowIndent}</ul>`
                : ''
            return `${indent}<li role="treeitem"${hasChildren ? ` aria-expanded="${open}"` : ''} aria-selected="false">
${rowIndent}<div class="kui-list__item tr-row" data-tr-level="${level}" data-tr-region-row data-tr-region-value="${path.join(' / ')}">
${contentIndent}${toggle}
${contentIndent}<button type="button" class="tr-region-hit tr-name" data-tr-region-hit>${name}</button>
${rowIndent}</div>${group}
${indent}</li>`
        })
        .join('\n')
}

function regionTreeMarkup(nodes: TreeItem[]): string {
    return `<ul class="kui-list" role="tree" aria-label="省市区" data-tr-region-tree>
${regionTreeRows(nodes)}
</ul>`
}

function selectionItem(box: HTMLInputElement): HTMLLIElement {
    const path = box.dataset.trPath ?? ''
    const parts = path.split(' / ')
    const item = document.createElement('li')
    item.className = 'tr-result__item'

    const body = document.createElement('span')
    body.className = 'tr-result__body'
    const title = document.createElement('span')
    title.className = 'tr-result__name'
    title.textContent = parts[parts.length - 1] ?? ''
    const meta = document.createElement('span')
    meta.className = 'tr-result__path'
    meta.textContent = parts.length > 1 ? parts.slice(0, -1).join(' / ') : '一级分类'
    body.append(title, meta)

    const remove = document.createElement('button')
    remove.type = 'button'
    remove.className = 'tr-remove'
    remove.dataset.trRemove = box.value
    remove.setAttribute('aria-label', `移除 ${path}`)
    remove.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>'

    item.append(body, remove)
    return item
}

function setBranch(button: HTMLElement, expanded: boolean): void {
    const group = document.getElementById(button.getAttribute('aria-controls') ?? '')
    const icon = button.querySelector<HTMLElement>('i')
    const item = button.closest('li')
    if (group) {
        group.hidden = !expanded
    }
    button.setAttribute('aria-expanded', String(expanded))
    button.setAttribute('aria-label', `${expanded ? '收起' : '展开'} ${button.dataset.trName ?? '分类'}`)
    item?.setAttribute('aria-expanded', String(expanded))
    if (icon) {
        icon.className = expanded ? 'fa fa-angle-down' : 'fa fa-angle-right'
    }
}

function toggleBorder(frame: HTMLElement | null, button: HTMLElement): void {
    const borderless = frame?.classList.toggle('kui-tree--borderless') ?? false
    const label = borderless ? '显示边框' : '隐藏边框'
    button.setAttribute('aria-pressed', String(borderless))
    button.setAttribute('aria-label', label)
    button.title = label
    const text = button.querySelector<HTMLElement>('[data-tr-border-label]')
    if (text) {
        text.textContent = label
    }
}

function renderSelection(tree: HTMLElement, scope: ParentNode): void {
    const checks = Array.from(tree.querySelectorAll<HTMLInputElement>('[data-tr-check]'))
    const selected = scope.querySelector<HTMLElement>('[data-tr-selected]')
    const empty = scope.querySelector<HTMLElement>('[data-tr-empty]')
    const count = scope.querySelector<HTMLElement>('[data-tr-count]')
    const checked = checks.filter((box) => box.checked)

    if (selected) {
        selected.replaceChildren(...checked.map(selectionItem))
        selected.hidden = checked.length === 0
    }
    if (empty) {
        empty.hidden = checked.length > 0
    }
    if (count) {
        count.textContent = String(checked.length)
    }
}

function selectRegion(tree: HTMLElement, row: HTMLElement, path: HTMLElement | null): void {
    tree.querySelectorAll<HTMLElement>('.tr-row.is-active').forEach((item) => {
        item.classList.remove('is-active')
        item.closest('li')?.setAttribute('aria-selected', 'false')
    })
    row.classList.add('is-active')
    row.closest('li')?.setAttribute('aria-selected', 'true')
    if (path) {
        const value = row.dataset.trRegionValue ?? ''
        path.textContent = `当前路径：${value}`
        path.title = value
    }
}

export default function render({ root, meta }: DocPageContext): void {
    const regionMarkup = regionTreeMarkup(regionTree)
        .split('\n')
        .map((line) => (line ? `            ${line}` : line))
        .join('\n')

    root.innerHTML = `
${pageHead(meta, {
    lead: '树形数据回答「这条记录属于谁」。电商分类把层级压到单行：只保留展开箭头、复选、名称和右对齐数量，深度交给每级 20px 缩进表达；省市区复用同一份 children 结构，只保留展开按钮、名称与一行当前路径。',
    tags: ['Tree', '.kui-tree', '.kui-list', 'children'],
})}

${demo({
    title: '电商分类树：三级、独立多选与结果面板',
    desc: '每行固定 44px，单行只有箭头、复选、名称与右对齐数量；没有第二行说明，也不用徽章和分类图标。层级只靠每级 20px 缩进与一条极浅导线，悬停整行 surface-hover，勾选行是主色 6% 加左侧 2px 色条。',
    tags: ['三级分类', '44px 行高', 'data-tr-check', 'data-tr-border', '结果面板'],
    script: `
const tree = document.querySelector<HTMLElement>('[data-tr-tree]')
const frame = document.querySelector<HTMLElement>('[data-tr-frame]')
const borderToggle = document.querySelector<HTMLElement>('[data-tr-border]')
const checks = Array.from(tree?.querySelectorAll<HTMLInputElement>('[data-tr-check]') ?? [])
const selected = document.querySelector<HTMLElement>('[data-tr-selected]')
const empty = document.querySelector<HTMLElement>('[data-tr-empty]')
const count = document.querySelector<HTMLElement>('[data-tr-count]')

const renderSelected = (): void => {
    const checked = checks.filter((box) => box.checked)
    if (selected) {
        selected.replaceChildren()
        selected.hidden = checked.length === 0
        checked.forEach((box) => {
            const path = box.dataset.trPath ?? ''
            const parts = path.split(' / ')
            const item = document.createElement('li')
            item.className = 'tr-result__item'
            const body = document.createElement('span')
            body.className = 'tr-result__body'
            const title = document.createElement('span')
            title.className = 'tr-result__name'
            title.textContent = parts[parts.length - 1] ?? ''
            const meta = document.createElement('span')
            meta.className = 'tr-result__path'
            meta.textContent = parts.length > 1 ? parts.slice(0, -1).join(' / ') : '一级分类'
            body.append(title, meta)
            const remove = document.createElement('button')
            remove.type = 'button'
            remove.className = 'tr-remove'
            remove.dataset.trRemove = box.value
            remove.setAttribute('aria-label', '移除 ' + path)
            remove.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>'
            item.append(body, remove)
            selected.append(item)
        })
    }
    if (empty) empty.hidden = checked.length > 0
    if (count) count.textContent = String(checked.length)
}

const setBranch = (button: HTMLElement, expanded: boolean): void => {
    const group = document.getElementById(button.getAttribute('aria-controls') ?? '')
    const icon = button.querySelector<HTMLElement>('i')
    if (group) group.hidden = !expanded
    button.setAttribute('aria-expanded', String(expanded))
    button.setAttribute('aria-label', (expanded ? '收起 ' : '展开 ') + (button.dataset.trName ?? '分类'))
    button.closest('li')?.setAttribute('aria-expanded', String(expanded))
    if (icon) icon.className = expanded ? 'fa fa-angle-down' : 'fa fa-angle-right'
}

tree?.querySelectorAll<HTMLElement>('[data-tr-toggle]').forEach((button) => {
    button.addEventListener('click', () => setBranch(button, button.getAttribute('aria-expanded') !== 'true'))
})

checks.forEach((box) => {
    box.addEventListener('change', () => {
        box.closest('.kui-list__item')?.classList.toggle('is-active', box.checked)
        renderSelected()
    })
})

selected?.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null
    const remove = target?.closest<HTMLElement>('[data-tr-remove]')
    const box = checks.find((item) => item.value === remove?.dataset.trRemove)
    if (!box) return
    box.checked = false
    box.closest('.kui-list__item')?.classList.remove('is-active')
    renderSelected()
})

document.querySelectorAll<HTMLElement>('[data-tr-expand-all]').forEach((button) => {
    button.addEventListener('click', () => tree?.querySelectorAll<HTMLElement>('[data-tr-toggle]').forEach((item) => setBranch(item, true)))
})

document.querySelectorAll<HTMLElement>('[data-tr-collapse-all]').forEach((button) => {
    button.addEventListener('click', () => tree?.querySelectorAll<HTMLElement>('[data-tr-toggle]').forEach((item) => setBranch(item, false)))
})

document.querySelectorAll<HTMLElement>('[data-tr-clear]').forEach((button) => {
    button.addEventListener('click', () => {
        checks.forEach((box) => {
            box.checked = false
            box.closest('.kui-list__item')?.classList.remove('is-active')
        })
        renderSelected()
    })
})

borderToggle?.addEventListener('click', () => {
    const borderless = frame?.classList.toggle('kui-tree--borderless') ?? false
    const label = borderless ? '显示边框' : '隐藏边框'
    borderToggle.setAttribute('aria-pressed', String(borderless))
    borderToggle.setAttribute('aria-label', label)
    borderToggle.title = label
    const text = borderToggle.querySelector<HTMLElement>('[data-tr-border-label]')
    if (text) text.textContent = label
})

renderSelected()
`,
    html: `
<style>
/* 树形示例的局部样式：只作用于 data-tr-shell，不进入共享样式 */
[data-tr-shell] .tr-toolbar {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
    margin-bottom: 12px;
}

[data-tr-shell] .tr-selected {
    flex: 0 0 auto;
    color: var(--kui-color-text-muted);
    font-size: 12px;
    white-space: nowrap;
}

[data-tr-shell] .tr-selected strong {
    color: var(--kui-color-text);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

[data-tr-shell] .tr-actions {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 2px;
}

[data-tr-shell] .tr-action {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 28px;
    padding: 0 8px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    color: var(--kui-color-text-muted);
    cursor: pointer;
    font: inherit;
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
}

[data-tr-shell] .tr-action:hover {
    background: var(--kui-color-surface-hover);
    color: var(--kui-color-text);
}

[data-tr-shell] .tr-action:focus-visible,
[data-tr-shell] .tr-toggle:focus-visible,
[data-tr-shell] .tr-remove:focus-visible {
    outline: 2px solid var(--kui-color-primary);
    outline-offset: 1px;
}

[data-tr-shell] .tr-action i {
    font-size: 11px;
}

/* 单行 44px：箭头、复选、名称、右对齐数量；不再有第二行与行内分隔线 */
[data-tr-shell] .kui-list__item.tr-row {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 44px;
    min-height: 44px;
    padding: 0 12px;
    border-bottom: 0;
}

[data-tr-shell] .tr-row:hover:not(.is-active),
[data-tr-shell] .tr-row:focus-within:not(.is-active) {
    background: var(--kui-color-surface-hover);
}

[data-tr-shell] .tr-row.is-active {
    background: color-mix(in srgb, var(--kui-color-primary) 6%, var(--kui-color-surface));
    box-shadow: inset 2px 0 0 var(--kui-color-primary);
}

[data-tr-shell] .tr-toggle {
    display: inline-flex;
    flex: 0 0 24px;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--kui-color-text-subtle);
    cursor: pointer;
    font: inherit;
    font-size: 12px;
    line-height: 1;
}

[data-tr-shell] .tr-toggle:hover {
    background: color-mix(in srgb, var(--kui-color-text) 6%, transparent);
    color: var(--kui-color-text);
}

[data-tr-shell] .tr-toggle-space {
    display: inline-block;
    flex: 0 0 24px;
    width: 24px;
    height: 24px;
}

[data-tr-shell] .tr-label {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    gap: 8px;
    min-width: 0;
    cursor: pointer;
}

[data-tr-shell] .tr-check {
    flex: 0 0 auto;
    width: 16px;
    height: 16px;
    margin: 0;
}

[data-tr-shell] .tr-name {
    min-width: 0;
    overflow: hidden;
    color: var(--kui-color-text);
    font-size: 13px;
    font-weight: 400;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
}

[data-tr-shell] .tr-row[data-tr-level='1'] .tr-name {
    font-size: 14px;
    font-weight: 600;
}

[data-tr-shell] .tr-row[data-tr-level='2'] .tr-name {
    font-size: 13px;
    font-weight: 500;
}

[data-tr-shell] .tr-row[data-tr-level='3'] .tr-name {
    color: var(--kui-color-text-muted);
    font-size: 13px;
    font-weight: 400;
}

[data-tr-shell] .tr-count {
    flex: 0 0 auto;
    margin-left: auto;
    color: var(--kui-color-text-subtle);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    white-space: nowrap;
}

[data-tr-shell] .kui-tree {
    padding-block: 4px;
}

/* 每级缩进 20px：11px 外边距 + 1px 透明导线 + 8px 内边距 */
[data-tr-shell] .kui-nestable__children {
    margin-left: 11px;
    padding-left: 8px;
    border-left: 1px solid transparent;
}

/* 只在第一级分组保留一条极浅导线，更深的层级不再画线 */
[data-tr-shell] .kui-tree > .kui-list > li > .kui-nestable__children {
    border-left-color: color-mix(in srgb, var(--kui-color-border-subtle) 60%, transparent);
}

[data-tr-shell] .tr-result {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 4px 0 0 16px;
    border-left: 1px solid var(--kui-color-border-subtle);
}

[data-tr-shell] .tr-result__empty {
    padding: 8px 0;
    margin: 0;
    color: var(--kui-color-text-subtle);
    font-size: 12px;
    line-height: 1.6;
}

[data-tr-shell] .tr-result__list {
    display: flex;
    flex-direction: column;
    max-height: 264px;
    padding: 0;
    margin: 0;
    overflow-y: auto;
    list-style: none;
}

[data-tr-shell] .tr-result__item {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 4px 0;
}

[data-tr-shell] .tr-result__body {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

[data-tr-shell] .tr-result__name {
    overflow: hidden;
    color: var(--kui-color-text);
    font-size: 13px;
    font-weight: 500;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
}

[data-tr-shell] .tr-result__path {
    overflow: hidden;
    color: var(--kui-color-text-subtle);
    font-size: 11px;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
}

[data-tr-shell] .tr-remove {
    display: inline-flex;
    flex: 0 0 24px;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--kui-color-text-subtle);
    cursor: pointer;
    font: inherit;
    font-size: 11px;
    line-height: 1;
}

[data-tr-shell] .tr-remove:hover {
    background: var(--kui-color-surface-hover);
    color: var(--kui-color-text);
}

/* 区域树沿用同一套 44px 单行：只有箭头、名称与一行当前路径 */
[data-tr-shell][data-tr-region-scope] .kui-tree {
    user-select: none;
}

[data-tr-shell][data-tr-region-scope] .tr-row {
    cursor: pointer;
}

[data-tr-shell][data-tr-region-scope] .tr-region-hit {
    display: block;
    flex: 1 1 auto;
    min-width: 0;
    padding: 0;
    border: 0;
    border-radius: 4px;
    background: transparent;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
}

[data-tr-shell][data-tr-region-scope] .tr-region-hit:focus-visible {
    outline: 2px solid var(--kui-color-primary);
    outline-offset: -2px;
}

[data-tr-shell] .tr-region-path {
    padding: 8px 0;
    margin: 0;
    overflow: hidden;
    color: var(--kui-color-text-subtle);
    font-size: 12px;
    line-height: 1.6;
    text-overflow: ellipsis;
    white-space: nowrap;
    user-select: none;
}

@media (max-width: 600px) {
    [data-tr-shell] .tr-action--icon {
        padding: 0 6px;
    }

    [data-tr-shell] .tr-action--icon .tr-action__label {
        display: none;
    }
}

@media (max-width: 40rem) {
    [data-tr-shell] .tr-result {
        padding: 12px 0 0;
        border-top: 1px solid var(--kui-color-border-subtle);
        border-left: 0;
    }
}
</style>
<div class="tr-shell" data-tr-shell>
    <div class="tr-toolbar">
        <span class="tr-selected" aria-live="polite">已选 <strong data-tr-count>0</strong></span>
        <div class="tr-actions">
            <button type="button" class="tr-action" data-tr-clear aria-label="清空已选分类" title="清空已选分类"><i class="fa fa-eraser" aria-hidden="true"></i><span class="tr-action__label">清空</span></button>
            <button type="button" class="tr-action tr-action--icon" data-tr-expand-all aria-label="展开全部" title="展开全部"><i class="fa fa-angle-double-down" aria-hidden="true"></i><span class="tr-action__label">展开全部</span></button>
            <button type="button" class="tr-action tr-action--icon" data-tr-collapse-all aria-label="收起全部" title="收起全部"><i class="fa fa-angle-double-up" aria-hidden="true"></i><span class="tr-action__label">收起全部</span></button>
            <button type="button" class="tr-action tr-action--icon" data-tr-border aria-pressed="false" aria-label="隐藏边框" title="隐藏边框"><i class="fa fa-square-o" aria-hidden="true"></i><span class="tr-action__label" data-tr-border-label>隐藏边框</span></button>
        </div>
    </div>
    <div class="kui-split kui-split--main-first" style="--kui-split-sidebar: 16rem">
        <div class="kui-tree" data-tr-frame>
            <ul class="kui-list" role="tree" aria-label="商品分类" data-tr-tree>
                <li role="treeitem" aria-expanded="true">
                    <div class="kui-list__item tr-row" data-tr-level="1">
                        <button type="button" class="tr-toggle" data-tr-toggle data-tr-name="数码影音" aria-expanded="true" aria-controls="tr-cat-digital" aria-label="收起 数码影音"><i class="fa fa-angle-down" aria-hidden="true"></i></button>
                        <label class="tr-label">
                            <input type="checkbox" class="kui-checkbox tr-check" data-tr-check value="digital" data-tr-path="数码影音">
                            <span class="tr-name">数码影音</span>
                        </label>
                        <span class="tr-count">24 件</span>
                    </div>
                    <ul class="kui-list kui-list--flush kui-nestable__children" id="tr-cat-digital" role="group">
                        <li role="treeitem" aria-expanded="true">
                            <div class="kui-list__item tr-row" data-tr-level="2">
                                <button type="button" class="tr-toggle" data-tr-toggle data-tr-name="手机通讯" aria-expanded="true" aria-controls="tr-cat-phone" aria-label="收起 手机通讯"><i class="fa fa-angle-down" aria-hidden="true"></i></button>
                                <label class="tr-label">
                                    <input type="checkbox" class="kui-checkbox tr-check" data-tr-check value="phone" data-tr-path="数码影音 / 手机通讯">
                                    <span class="tr-name">手机通讯</span>
                                </label>
                                <span class="tr-count">13 件</span>
                            </div>
                            <ul class="kui-list kui-list--flush kui-nestable__children" id="tr-cat-phone" role="group">
                                <li role="treeitem">
                                    <div class="kui-list__item tr-row" data-tr-level="3">
                                        <span class="tr-toggle-space" aria-hidden="true"></span>
                                        <label class="tr-label">
                                            <input type="checkbox" class="kui-checkbox tr-check" data-tr-check value="smartphone" data-tr-path="数码影音 / 手机通讯 / 智能手机">
                                            <span class="tr-name">智能手机</span>
                                        </label>
                                        <span class="tr-count">4 件</span>
                                    </div>
                                </li>
                                <li role="treeitem">
                                    <div class="kui-list__item tr-row" data-tr-level="3">
                                        <span class="tr-toggle-space" aria-hidden="true"></span>
                                        <label class="tr-label">
                                            <input type="checkbox" class="kui-checkbox tr-check" data-tr-check value="accessory" data-tr-path="数码影音 / 手机通讯 / 手机配件">
                                            <span class="tr-name">手机配件</span>
                                        </label>
                                        <span class="tr-count">9 件</span>
                                    </div>
                                </li>
                            </ul>
                        </li>
                        <li role="treeitem" aria-expanded="false">
                            <div class="kui-list__item tr-row" data-tr-level="2">
                                <button type="button" class="tr-toggle" data-tr-toggle data-tr-name="耳机音箱" aria-expanded="false" aria-controls="tr-cat-audio" aria-label="展开 耳机音箱"><i class="fa fa-angle-right" aria-hidden="true"></i></button>
                                <label class="tr-label">
                                    <input type="checkbox" class="kui-checkbox tr-check" data-tr-check value="audio" data-tr-path="数码影音 / 耳机音箱">
                                    <span class="tr-name">耳机音箱</span>
                                </label>
                                <span class="tr-count">11 件</span>
                            </div>
                            <ul class="kui-list kui-list--flush kui-nestable__children" id="tr-cat-audio" role="group" hidden>
                                <li role="treeitem">
                                    <div class="kui-list__item tr-row" data-tr-level="3">
                                        <span class="tr-toggle-space" aria-hidden="true"></span>
                                        <label class="tr-label">
                                            <input type="checkbox" class="kui-checkbox tr-check" data-tr-check value="headphone" data-tr-path="数码影音 / 耳机音箱 / 头戴耳机">
                                            <span class="tr-name">头戴耳机</span>
                                        </label>
                                        <span class="tr-count">6 件</span>
                                    </div>
                                </li>
                                <li role="treeitem">
                                    <div class="kui-list__item tr-row" data-tr-level="3">
                                        <span class="tr-toggle-space" aria-hidden="true"></span>
                                        <label class="tr-label">
                                            <input type="checkbox" class="kui-checkbox tr-check" data-tr-check value="speaker" data-tr-path="数码影音 / 耳机音箱 / 蓝牙音箱">
                                            <span class="tr-name">蓝牙音箱</span>
                                        </label>
                                        <span class="tr-count">5 件</span>
                                    </div>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </li>
                <li role="treeitem" aria-expanded="true">
                    <div class="kui-list__item tr-row" data-tr-level="1">
                        <button type="button" class="tr-toggle" data-tr-toggle data-tr-name="家居生活" aria-expanded="true" aria-controls="tr-cat-home" aria-label="收起 家居生活"><i class="fa fa-angle-down" aria-hidden="true"></i></button>
                        <label class="tr-label">
                            <input type="checkbox" class="kui-checkbox tr-check" data-tr-check value="home" data-tr-path="家居生活">
                            <span class="tr-name">家居生活</span>
                        </label>
                        <span class="tr-count">14 件</span>
                    </div>
                    <ul class="kui-list kui-list--flush kui-nestable__children" id="tr-cat-home" role="group">
                        <li role="treeitem" aria-expanded="false">
                            <div class="kui-list__item tr-row" data-tr-level="2">
                                <button type="button" class="tr-toggle" data-tr-toggle data-tr-name="厨房用品" aria-expanded="false" aria-controls="tr-cat-kitchen" aria-label="展开 厨房用品"><i class="fa fa-angle-right" aria-hidden="true"></i></button>
                                <label class="tr-label">
                                    <input type="checkbox" class="kui-checkbox tr-check" data-tr-check value="kitchen" data-tr-path="家居生活 / 厨房用品">
                                    <span class="tr-name">厨房用品</span>
                                </label>
                                <span class="tr-count">9 件</span>
                            </div>
                            <ul class="kui-list kui-list--flush kui-nestable__children" id="tr-cat-kitchen" role="group" hidden>
                                <li role="treeitem">
                                    <div class="kui-list__item tr-row" data-tr-level="3">
                                        <span class="tr-toggle-space" aria-hidden="true"></span>
                                        <label class="tr-label">
                                            <input type="checkbox" class="kui-checkbox tr-check" data-tr-check value="cookware" data-tr-path="家居生活 / 厨房用品 / 锅具">
                                            <span class="tr-name">锅具</span>
                                        </label>
                                        <span class="tr-count">4 件</span>
                                    </div>
                                </li>
                                <li role="treeitem">
                                    <div class="kui-list__item tr-row" data-tr-level="3">
                                        <span class="tr-toggle-space" aria-hidden="true"></span>
                                        <label class="tr-label">
                                            <input type="checkbox" class="kui-checkbox tr-check" data-tr-check value="tableware" data-tr-path="家居生活 / 厨房用品 / 餐具">
                                            <span class="tr-name">餐具</span>
                                        </label>
                                        <span class="tr-count">5 件</span>
                                    </div>
                                </li>
                            </ul>
                        </li>
                        <li role="treeitem" aria-expanded="false">
                            <div class="kui-list__item tr-row" data-tr-level="2">
                                <button type="button" class="tr-toggle" data-tr-toggle data-tr-name="家纺布艺" aria-expanded="false" aria-controls="tr-cat-textile" aria-label="展开 家纺布艺"><i class="fa fa-angle-right" aria-hidden="true"></i></button>
                                <label class="tr-label">
                                    <input type="checkbox" class="kui-checkbox tr-check" data-tr-check value="textile" data-tr-path="家居生活 / 家纺布艺">
                                    <span class="tr-name">家纺布艺</span>
                                </label>
                                <span class="tr-count">5 件</span>
                            </div>
                            <ul class="kui-list kui-list--flush kui-nestable__children" id="tr-cat-textile" role="group" hidden>
                                <li role="treeitem">
                                    <div class="kui-list__item tr-row" data-tr-level="3">
                                        <span class="tr-toggle-space" aria-hidden="true"></span>
                                        <label class="tr-label">
                                            <input type="checkbox" class="kui-checkbox tr-check" data-tr-check value="bedding" data-tr-path="家居生活 / 家纺布艺 / 床品套件">
                                            <span class="tr-name">床品套件</span>
                                        </label>
                                        <span class="tr-count">5 件</span>
                                    </div>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </li>
                <li role="treeitem" aria-expanded="false">
                    <div class="kui-list__item tr-row" data-tr-level="1">
                        <button type="button" class="tr-toggle" data-tr-toggle data-tr-name="户外运动" aria-expanded="false" aria-controls="tr-cat-outdoor" aria-label="展开 户外运动"><i class="fa fa-angle-right" aria-hidden="true"></i></button>
                        <label class="tr-label">
                            <input type="checkbox" class="kui-checkbox tr-check" data-tr-check value="outdoor" data-tr-path="户外运动">
                            <span class="tr-name">户外运动</span>
                        </label>
                        <span class="tr-count">8 件</span>
                    </div>
                    <ul class="kui-list kui-list--flush kui-nestable__children" id="tr-cat-outdoor" role="group" hidden>
                        <li role="treeitem" aria-expanded="false">
                            <div class="kui-list__item tr-row" data-tr-level="2">
                                <button type="button" class="tr-toggle" data-tr-toggle data-tr-name="露营装备" aria-expanded="false" aria-controls="tr-cat-camping" aria-label="展开 露营装备"><i class="fa fa-angle-right" aria-hidden="true"></i></button>
                                <label class="tr-label">
                                    <input type="checkbox" class="kui-checkbox tr-check" data-tr-check value="camping" data-tr-path="户外运动 / 露营装备">
                                    <span class="tr-name">露营装备</span>
                                </label>
                                <span class="tr-count">5 件</span>
                            </div>
                            <ul class="kui-list kui-list--flush kui-nestable__children" id="tr-cat-camping" role="group" hidden>
                                <li role="treeitem">
                                    <div class="kui-list__item tr-row" data-tr-level="3">
                                        <span class="tr-toggle-space" aria-hidden="true"></span>
                                        <label class="tr-label">
                                            <input type="checkbox" class="kui-checkbox tr-check" data-tr-check value="tent" data-tr-path="户外运动 / 露营装备 / 帐篷">
                                            <span class="tr-name">帐篷</span>
                                        </label>
                                        <span class="tr-count">3 件</span>
                                    </div>
                                </li>
                                <li role="treeitem">
                                    <div class="kui-list__item tr-row" data-tr-level="3">
                                        <span class="tr-toggle-space" aria-hidden="true"></span>
                                        <label class="tr-label">
                                            <input type="checkbox" class="kui-checkbox tr-check" data-tr-check value="sleeping-bag" data-tr-path="户外运动 / 露营装备 / 睡袋">
                                            <span class="tr-name">睡袋</span>
                                        </label>
                                        <span class="tr-count">2 件</span>
                                    </div>
                                </li>
                            </ul>
                        </li>
                        <li role="treeitem" aria-expanded="false">
                            <div class="kui-list__item tr-row" data-tr-level="2">
                                <button type="button" class="tr-toggle" data-tr-toggle data-tr-name="跑步装备" aria-expanded="false" aria-controls="tr-cat-running" aria-label="展开 跑步装备"><i class="fa fa-angle-right" aria-hidden="true"></i></button>
                                <label class="tr-label">
                                    <input type="checkbox" class="kui-checkbox tr-check" data-tr-check value="running" data-tr-path="户外运动 / 跑步装备">
                                    <span class="tr-name">跑步装备</span>
                                </label>
                                <span class="tr-count">3 件</span>
                            </div>
                            <ul class="kui-list kui-list--flush kui-nestable__children" id="tr-cat-running" role="group" hidden>
                                <li role="treeitem">
                                    <div class="kui-list__item tr-row" data-tr-level="3">
                                        <span class="tr-toggle-space" aria-hidden="true"></span>
                                        <label class="tr-label">
                                            <input type="checkbox" class="kui-checkbox tr-check" data-tr-check value="running-shoes" data-tr-path="户外运动 / 跑步装备 / 跑鞋">
                                            <span class="tr-name">跑鞋</span>
                                        </label>
                                        <span class="tr-count">3 件</span>
                                    </div>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </li>
            </ul>
        </div>
        <aside class="tr-result" aria-label="已选分类">
            <p class="tr-result__empty" data-tr-empty>勾选分类后在这里回显，父子不联动。</p>
            <ul class="tr-result__list" data-tr-selected hidden></ul>
        </aside>
    </div>
</div>`,
})}

${demo({
    title: '省市区：同一份 children 结构的只读树',
    desc: '省、市、区三级都由 children 描述，没有额外的层级字段；行内只保留展开按钮与名称，点击行选中并在右侧或下方回显完整路径。',
    tags: ['TreeItem', 'children', '点击选中'],
    script: `
const regionTreeElement = document.querySelector<HTMLElement>('[data-tr-region-tree]')
const regionPath = document.querySelector<HTMLElement>('[data-tr-region-path]')

const setBranch = (button: HTMLElement, expanded: boolean): void => {
    const group = document.getElementById(button.getAttribute('aria-controls') ?? '')
    const icon = button.querySelector<HTMLElement>('i')
    if (group) group.hidden = !expanded
    button.setAttribute('aria-expanded', String(expanded))
    button.setAttribute('aria-label', (expanded ? '收起 ' : '展开 ') + (button.dataset.trName ?? '地区'))
    button.closest('li')?.setAttribute('aria-expanded', String(expanded))
    if (icon) icon.className = expanded ? 'fa fa-angle-down' : 'fa fa-angle-right'
}

const selectRegion = (row: HTMLElement): void => {
    regionTreeElement?.querySelectorAll<HTMLElement>('.tr-row.is-active').forEach((item) => {
        item.classList.remove('is-active')
        item.closest('li')?.setAttribute('aria-selected', 'false')
    })
    row.classList.add('is-active')
    row.closest('li')?.setAttribute('aria-selected', 'true')
    const value = row.dataset.trRegionValue ?? ''
    if (regionPath) {
        regionPath.textContent = '当前路径：' + value
        regionPath.title = value
    }
}

regionTreeElement?.querySelectorAll<HTMLElement>('[data-tr-region-toggle]').forEach((button) => {
    button.addEventListener('click', () => setBranch(button, button.getAttribute('aria-expanded') !== 'true'))
})

regionTreeElement?.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null
    if (!target || target.closest('[data-tr-region-toggle]')) return
    const row = target.closest<HTMLElement>('[data-tr-region-row]')
    if (row) selectRegion(row)
})
`,
    html: `
<div class="tr-region" data-tr-shell data-tr-region-scope>
    <div class="kui-split kui-split--main-first" style="--kui-split-sidebar: 16rem">
        <div class="kui-tree" data-tr-region-frame>
${regionMarkup}
        </div>
        <aside class="tr-result" aria-label="当前路径">
            <p class="tr-region-path" data-tr-region-path aria-live="polite">当前路径：未选择</p>
        </aside>
    </div>
</div>`,
})}

${sectionTitle('数据从哪来', '省市区与商品分类都可以由同一份 children 结构描述；id 用于回填，name 用于展示，children 表示下一级。')}

${codeSample(`
const regionTree: TreeItem[] = [
    { id: 'zhejiang', name: '浙江省', children: [
        { id: 'hangzhou', name: '杭州市', children: [
            { id: 'xihu', name: '西湖区' },
            { id: 'binjiang', name: '滨江区' },
        ] },
        { id: 'ningbo', name: '宁波市', children: [
            { id: 'haishu', name: '海曙区' },
        ] },
    ] },
]
`, 'ts', '省市区数据结构')}

${demo({
    title: '树、列表、表格怎么选',
    desc: '需要回答「属于谁」时用树；需要回答「有哪些」时用列表；需要横向比较多个字段时用表格。三者可以组合，但不要让一棵树承担表格的比较任务。',
    stage: 'flush',
    html: `
<table class="table">
    <thead>
        <tr><th>要回答的问题</th><th>树</th><th>列表</th><th>表格</th></tr>
    </thead>
    <tbody>
        <tr><td>这条记录属于谁</td><td>最佳：父子层级一眼可读</td><td>需要额外的层级字段</td><td>需要分组或展开行</td></tr>
        <tr><td>有哪些记录</td><td>只适合层级数据</td><td>最佳：标题与描述足够</td><td>字段多时更清楚</td></tr>
        <tr><td>横向比较多个字段</td><td>不擅长</td><td>不擅长</td><td>最佳：列对齐</td></tr>
        <tr><td>批量选择同一层节点</td><td>独立复选，父级不联动</td><td>逐项选择</td><td>表头全选当前页</td></tr>
        <tr><td>层级超过三级</td><td>改为逐级下钻</td><td>—</td><td>—</td></tr>
    </tbody>
</table>`,
})}

${callout('三级以内适合直接展开；再深就把深层节点放进右侧详情或下一级页面。分类树的复选保持独立，父级只表达归属，不自动勾选子级，避免「取消一个子级却仍算选中父级」的歧义。')}

${propsTable([
    { name: 'data', type: 'TreeItem[]', defaultValue: '[]', desc: '节点数据：id、name / title、open、url、children 与可选 actions。' },
    { name: 'initialState', type: 'normal | expand | collapse | preserve', defaultValue: 'normal', desc: '初始展开策略；preserve 会把展开状态写入本地存储。' },
    { name: 'toggleTemplate', type: 'string', desc: '分支节点的展开标记模板；不传时不插入展开控件。' },
    { name: 'itemCreator', type: '(item, element) => string | HTMLElement | boolean', desc: '自定义节点内容；返回字符串按 HTML 写入内容区。' },
    { name: 'hit / expand / collapse', type: '(payload) => void', desc: '节点点击、展开与收起回调，payload 同时带 target 与 item。' },
    { name: 'accordion', type: 'boolean', defaultValue: 'false', desc: '同一层只保留一个展开分支。' },
    { name: 'actions / action', type: 'TreeActions / (payload) => void', desc: '行内操作集合与点击回调，操作用 tree-action 挂在节点右侧。' },
    { name: '.kui-tree / .kui-tree--borderless', type: 'class', desc: '树的容器：白底、可选边框；无边框态只移除容器描边，内部列表不重复描边。' },
    { name: '.tree / .list-toggle', type: 'class', desc: 'Tree 组件生成的树根类名与展开箭头；箭头随 li.open 旋转，aria-expanded 同步更新。' },
    { name: '.kui-list__item.is-active', type: 'class', desc: '示例中的勾选行：主色 6% 底色与左侧 2px 主色条；悬停整行由 surface-hover 提供。' },
    { name: '.kui-nestable__children', type: 'class', desc: '示例中的子级列表：每级缩进 20px，仅第一级分组保留一条极浅的 1px 左侧导线。' },
    { name: '[data-tr-border]', type: 'attribute', desc: '示例钩子：切换树容器 data-tr-frame 的 kui-tree--borderless 类，默认显示边框。' },
    { name: '[data-tr-check] / [data-tr-path]', type: 'attribute', desc: '示例钩子：复选值与完整路径，结果面板据此回显。' },
    { name: 'role="tree" / aria-expanded', type: 'attribute', desc: '树角色、节点角色与展开状态；展开按钮同时维护 aria-controls。' },
])}

`

    const tree = root.querySelector<HTMLElement>('[data-tr-tree]')
    if (tree) {
        const checks = Array.from(tree.querySelectorAll<HTMLInputElement>('[data-tr-check]'))
        const selected = root.querySelector<HTMLElement>('[data-tr-selected]')

        const sync = (): void => renderSelection(tree, root)

        tree.querySelectorAll<HTMLElement>('[data-tr-toggle]').forEach((button) => {
            button.addEventListener('click', () => {
                setBranch(button, button.getAttribute('aria-expanded') !== 'true')
            })
        })

        checks.forEach((box) => {
            box.addEventListener('change', () => {
                box.closest('.kui-list__item')?.classList.toggle('is-active', box.checked)
                sync()
            })
        })

        selected?.addEventListener('click', (event) => {
            const target = event.target instanceof Element ? event.target : null
            const remove = target?.closest<HTMLElement>('[data-tr-remove]')
            if (!remove?.dataset.trRemove) {
                return
            }
            const box = checks.find((item) => item.value === remove.dataset.trRemove)
            if (!box) {
                return
            }
            box.checked = false
            box.closest('.kui-list__item')?.classList.remove('is-active')
            sync()
        })

        root.querySelector<HTMLElement>('[data-tr-expand-all]')?.addEventListener('click', () => {
            tree.querySelectorAll<HTMLElement>('[data-tr-toggle]').forEach((item) => setBranch(item, true))
        })

        root.querySelector<HTMLElement>('[data-tr-collapse-all]')?.addEventListener('click', () => {
            tree.querySelectorAll<HTMLElement>('[data-tr-toggle]').forEach((item) => setBranch(item, false))
        })

        root.querySelector<HTMLElement>('[data-tr-clear]')?.addEventListener('click', () => {
            checks.forEach((box) => {
                box.checked = false
                box.closest('.kui-list__item')?.classList.remove('is-active')
            })
            sync()
        })

        sync()
    }

    const frame = root.querySelector<HTMLElement>('[data-tr-frame]')
    const borderToggle = root.querySelector<HTMLElement>('[data-tr-border]')
    if (borderToggle) {
        borderToggle.addEventListener('click', () => toggleBorder(frame, borderToggle))
    }

    const regionTreeElement = root.querySelector<HTMLElement>('[data-tr-region-tree]')
    const regionPath = root.querySelector<HTMLElement>('[data-tr-region-path]')
    if (regionTreeElement) {
        regionTreeElement.querySelectorAll<HTMLElement>('[data-tr-region-toggle]').forEach((button) => {
            button.addEventListener('click', () => {
                setBranch(button, button.getAttribute('aria-expanded') !== 'true')
            })
        })

        regionTreeElement.addEventListener('click', (event) => {
            const target = event.target instanceof Element ? event.target : null
            if (!target || target.closest('[data-tr-region-toggle]')) {
                return
            }
            const row = target.closest<HTMLElement>('[data-tr-region-row]')
            if (row) {
                selectRegion(regionTreeElement, row, regionPath)
            }
        })
    }
}
