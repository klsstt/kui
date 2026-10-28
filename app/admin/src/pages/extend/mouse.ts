import { ContextMenu, Draggable } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 鼠标交互。
 * 右键菜单解决「对这一个对象能做什么」，拖动解决「把它放到哪里」，双击解决「就地改名」。
 * 三者按鼠标键与手势区分，同一个元素可以同时拥有，不需要额外的模式开关。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '鼠标交互把几个容易混淆的意图分开：右键是对当前对象的操作集合，拖动是位置调整，双击是就地编辑。KUI 让它们按鼠标键与手势各管一段，同一个元素可以同时拥有菜单、拖拽与重命名，不需要模式开关。',
    tags: ['ContextMenu', 'Draggable', '.dropdown-menu'],
})}

${sectionTitle('右键菜单', '菜单在指针位置弹出，图标统一、分组明确；最后一项是危险操作，单独用分隔线隔开。')}

${demo({
    title: '文件操作菜单',
    desc: '菜单项都有图标，危险项用 is-danger 着色；打开后方向键选择、Enter 执行、Esc 关闭，Shift + F10 可以不用鼠标打开。',
    tags: ['data-kui-toggle="context"', 'onItem', '.is-danger'],
    script: `
const trigger = document.querySelector('[data-mouse-target]')
const status = document.querySelector('[data-mouse-status]')

ContextMenu.getOrCreate(trigger, {
    target: '#mouse-menu',
    onItem: (event, trigger, item) => {
        status.textContent = '已执行：' + item.textContent.trim()
    },
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-board" data-mouse-target data-kui-toggle="context" data-target="#mouse-menu" tabindex="0" role="region" aria-label="右键菜单触发区">
        <div class="kui-stack kui-stack--tight">
            <p class="kui-page-header__eyebrow">共享空间 / 设计稿</p>
            <h2 class="kui-page-header__title">结算页终版.fig</h2>
            <p class="kui-page-header__desc">12.4 MB · 今天 09:42 更新</p>
            <p class="form-hint">在区域内点击右键，或用键盘 Shift + F10 打开菜单。</p>
        </div>
    </div>
    <div id="mouse-menu"><ul class="dropdown-menu">
        <li><button type="button" class="dropdown-item"><i class="fa fa-folder-open-o" aria-hidden="true"></i> 打开</button></li>
        <li><button type="button" class="dropdown-item"><i class="fa fa-pencil" aria-hidden="true"></i> 重命名</button></li>
        <li><button type="button" class="dropdown-item"><i class="fa fa-files-o" aria-hidden="true"></i> 创建副本</button></li>
        <li><button type="button" class="dropdown-item"><i class="fa fa-share-alt" aria-hidden="true"></i> 分享链接</button></li>
        <li class="divider"></li>
        <li><button type="button" class="dropdown-item is-danger"><i class="fa fa-times" aria-hidden="true"></i> 删除</button></li>
    </ul></div>
    <p class="form-hint" data-mouse-status>尚未选择菜单项。</p>
</div>`,
})}

${sectionTitle('拖动与边界', '只有把手能发起拖动，位置在回调里计算并夹在容器内；松手后位置保留，随时可以复位。')}

${demo({
    title: '把手与边界',
    desc: 'move 设为 false，位置由 drag 回调自己写；before 在每次按下时量一次容器边界，拖动过程中只做夹取。',
    tags: ['handle', 'move: false', 'before / drag'],
    script: `
const stage = document.querySelector('[data-mouse-stage]')
const card = document.querySelector('[data-mouse-card]')
const readout = document.querySelector('[data-mouse-position]')
let position = { x: 0, y: 0 }
let start = { x: 0, y: 0 }
let limits = { minX: 0, maxX: 0, minY: 0, maxY: 0 }

Draggable.getOrCreate(card, {
    handle: '[data-mouse-handle]',
    move: false,
    before: () => {
        const bounds = stage.getBoundingClientRect()
        const rect = card.getBoundingClientRect()
        const left = rect.left - position.x
        const top = rect.top - position.y
        limits = {
            minX: bounds.left - left,
            maxX: bounds.right - rect.width - left,
            minY: bounds.top - top,
            maxY: bounds.bottom - rect.height - top,
        }
        start = { ...position }
    },
    drag: ({ offset }) => {
        position.x = Math.min(Math.max(start.x + offset.x, limits.minX), limits.maxX)
        position.y = Math.min(Math.max(start.y + offset.y, limits.minY), limits.maxY)
        card.style.transform = 'translate3d(' + position.x + 'px, ' + position.y + 'px, 0)'
        readout.textContent = '偏移 x ' + Math.round(position.x) + ' · y ' + Math.round(position.y)
    },
})

document.querySelector('[data-mouse-reset]').addEventListener('click', () => {
    position = { x: 0, y: 0 }
    card.style.transform = 'translate3d(0, 0, 0)'
    readout.textContent = '偏移 x 0 · y 0'
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-toolbar">
        <div class="kui-toolbar__group">
            <button type="button" class="btn btn-default btn-sm" data-mouse-reset><i class="fa fa-undo" aria-hidden="true"></i> 复位</button>
        </div>
        <div class="kui-toolbar__group">
            <span class="badge badge-neutral" data-mouse-position>偏移 x 0 · y 0</span>
        </div>
    </div>
    <div class="kui-board" data-mouse-stage>
        <div class="panel" data-mouse-card>
            <div class="panel-heading" data-mouse-handle title="按住拖动">
                <h3 class="panel-title"><i class="fa fa-arrows" aria-hidden="true"></i> 季度复盘</h3>
                <span class="form-hint">按住标题拖动</span>
            </div>
            <div class="panel-body">卡片只能在容器内移动，越界的位置会被夹回边缘；松手后位置保留。</div>
        </div>
        <div class="kui-empty" aria-hidden="true">
            <i class="fa fa-arrows-alt" aria-hidden="true"></i>
            <strong>可拖动区域</strong>
            <p>边界在每次按下时量一次，拖动过程中只做夹取，不反复读布局。</p>
        </div>
    </div>
</div>`,
})}

${sectionTitle('同一个对象，三种手势', '左键拖动、右键或中键打开菜单、双击就地改名；各自只关心自己的按键，所以可以叠在同一个卡片上。')}

${demo({
    title: '拖动、菜单与重命名',
    desc: '双击标题进入重命名，回车或失焦确认、Esc 撤销；中键与右键打开同一份菜单，状态栏显示最近一次操作。',
    tags: ['dblclick', 'auxclick', 'mouseButton: left'],
    script: `
const card = document.querySelector('[data-mouse-multi-card]')
const title = document.querySelector('[data-mouse-multi-title]')
const status = document.querySelector('[data-mouse-multi-status]')
const menu = ContextMenu.getOrCreate(card, { target: '#mouse-multi-menu' })

Draggable.getOrCreate(card, {
    handle: '[data-mouse-multi-handle]',
    mouseButton: 'left',
    drag: ({ offset }) => {
        // 这里只跟手；带边界的写法见上一个示例
        card.style.transform = 'translate3d(' + offset.x + 'px, ' + offset.y + 'px, 0)'
    },
})

card.addEventListener('dblclick', () => {
    title.contentEditable = 'true'
    title.focus()
    status.textContent = '双击：输入新名称，回车确认。'
})

card.addEventListener('auxclick', (event) => {
    if (event.button !== 1) return
    event.preventDefault()
    menu.show(event)
    status.textContent = '中键：打开菜单'
})

card.addEventListener('contextmenu', () => {
    status.textContent = '右键：打开菜单'
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-toolbar">
        <div class="kui-toolbar__group">
            <span class="badge badge-neutral" data-mouse-multi-status>尚未操作</span>
        </div>
        <p class="form-hint">左键拖动 · 双击重命名 · 中键或右键打开菜单</p>
    </div>
    <div class="kui-board" data-mouse-multi-stage>
        <div class="panel" data-mouse-multi-card data-kui-toggle="context" data-target="#mouse-multi-menu" tabindex="0">
            <div class="panel-heading" data-mouse-multi-handle title="按住拖动">
                <h3 class="panel-title"><i class="fa fa-arrows" aria-hidden="true"></i> 共享文件</h3>
                <span class="form-hint">把手</span>
            </div>
            <div class="panel-body">
                <h3 class="panel-title" data-mouse-multi-title>结算页终版.fig</h3>
                <p class="form-hint">双击标题改名；右键或中键打开同一份菜单。</p>
            </div>
        </div>
        <div class="kui-empty" aria-hidden="true">
            <i class="fa fa-mouse-pointer" aria-hidden="true"></i>
            <strong>三种意图</strong>
            <p>左键改变位置，右键与中键列出操作，双击进入重命名；键盘用户用 Shift + F10 代替右键。</p>
        </div>
    </div>
    <div id="mouse-multi-menu"><ul class="dropdown-menu">
        <li><button type="button" class="dropdown-item"><i class="fa fa-thumb-tack" aria-hidden="true"></i> 置顶</button></li>
        <li><button type="button" class="dropdown-item"><i class="fa fa-link" aria-hidden="true"></i> 复制链接</button></li>
        <li><button type="button" class="dropdown-item"><i class="fa fa-pencil" aria-hidden="true"></i> 重命名</button></li>
        <li class="divider"></li>
        <li><button type="button" class="dropdown-item is-danger"><i class="fa fa-times" aria-hidden="true"></i> 移出看板</button></li>
    </ul></div>
</div>`,
})}

${propsTable([
    { name: 'target', type: 'string', desc: 'ContextMenu 的菜单选择器，也可以写在触发元素的 <code>data-target</code> 上。' },
    { name: 'onItem', type: '(event, trigger, item) => void', desc: '点击或键盘激活菜单项时触发，鼠标与键盘走同一个回调。' },
    { name: 'show(event) / getMenu() / closemenu()', type: 'method', desc: '按事件坐标打开、取菜单节点、关闭；中键菜单直接调用 <code>show</code>。' },
    { name: 'kui:contextmenu:show / shown / hidden', type: 'event', desc: '打开前、打开后与关闭时派发，可用来做埋点或联动。' },
    { name: 'handle', type: 'string', desc: '拖动的把手选择器；不填则整个元素都能拖动。' },
    { name: 'mouseButton', type: `'left' | 'middle' | 'right' | 'all'`, defaultValue: `'left'`, desc: '由哪个键发起拖动，右键菜单与左键拖动因此可以共存。' },
    { name: 'move', type: 'boolean | function', defaultValue: 'true', desc: 'false 时不写内联定位，交给 <code>drag</code> 自行计算，适合有边界的场景。' },
    { name: 'before', type: '(payload) => boolean | void', desc: '拖动开始前调用，返回 false 可以取消本次拖动；边界通常在这里量。' },
    { name: 'drag / finish', type: '(payload) => void', desc: '拖动中与松手时回调，payload 含 <code>offset</code> 与 <code>smallOffset</code>。' },
    { name: 'selector / stopPropagation', type: 'string / boolean', desc: '在容器内按选择器代理拖动，以及是否阻止事件冒泡。' },
    { name: '.dropdown-menu / .dropdown-item', type: 'class', desc: '上下文菜单的结构；危险项加 <code>.is-danger</code>，分组用 <code>.divider</code>。' },
    { name: '.dragging / .drag-ready', type: 'class', desc: '拖动中与按下待拖动时由组件加在元素上，用于写拖动态样式。' },
])}

${callout('键盘用户不必依赖鼠标：触发区获得焦点后按 Shift + F10 打开菜单，方向键移动、Enter 执行、Esc 关闭。危险操作放在最后并用分隔线隔开，减少误触。')}

`

    const bindMenu = (trigger: HTMLElement | null, status: HTMLElement | null, target: string): ContextMenu | null => {
        if (!trigger) {
            return null
        }
        const instance = ContextMenu.getOrCreate(trigger, {
            target,
            onItem: (_event, _element, item) => {
                if (status) {
                    status.textContent = `已执行：${item.textContent?.trim() ?? '菜单项'}`
                }
            },
        })
        trackComponent(instance)
        return instance
    }

    const bindDrag = (
        stage: HTMLElement | null,
        card: HTMLElement | null,
        handle: string,
        readout: HTMLElement | null,
        hooks: { start?: () => void; finish?: () => void } = {},
    ): (() => void) | null => {
        if (!stage || !card) {
            return null
        }
        const position = { x: 0, y: 0 }
        let start = { x: 0, y: 0 }
        let limits = { minX: 0, maxX: 0, minY: 0, maxY: 0 }

        const paint = (): void => {
            if (readout) {
                readout.textContent = `偏移 x ${Math.round(position.x)} · y ${Math.round(position.y)}`
            }
        }

        trackComponent(
            Draggable.getOrCreate(card, {
                handle,
                move: false,
                before: () => {
                    const bounds = stage.getBoundingClientRect()
                    const rect = card.getBoundingClientRect()
                    const left = rect.left - position.x
                    const top = rect.top - position.y
                    limits = {
                        minX: bounds.left - left,
                        maxX: bounds.right - rect.width - left,
                        minY: bounds.top - top,
                        maxY: bounds.bottom - rect.height - top,
                    }
                    start = { ...position }
                    hooks.start?.()
                },
                drag: ({ offset }) => {
                    position.x = Math.min(Math.max(start.x + offset.x, limits.minX), limits.maxX)
                    position.y = Math.min(Math.max(start.y + offset.y, limits.minY), limits.maxY)
                    card.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`
                    paint()
                },
                finish: () => hooks.finish?.(),
            }),
        )

        return () => {
            position.x = 0
            position.y = 0
            card.style.transform = 'translate3d(0, 0, 0)'
            paint()
        }
    }

    bindMenu(root.querySelector<HTMLElement>('[data-mouse-target]'), root.querySelector<HTMLElement>('[data-mouse-status]'), '#mouse-menu')
    const resetDrag = bindDrag(
        root.querySelector<HTMLElement>('[data-mouse-stage]'),
        root.querySelector<HTMLElement>('[data-mouse-card]'),
        '[data-mouse-handle]',
        root.querySelector<HTMLElement>('[data-mouse-position]'),
    )
    root.querySelector<HTMLElement>('[data-mouse-reset]')?.addEventListener('click', () => resetDrag?.())

    /* ---------- 同一个对象，三种手势 ---------- */
    const multiCard = root.querySelector<HTMLElement>('[data-mouse-multi-card]')
    const multiTitle = root.querySelector<HTMLElement>('[data-mouse-multi-title]')
    const multiStatus = root.querySelector<HTMLElement>('[data-mouse-multi-status]')
    const multiMenu = bindMenu(multiCard, multiStatus, '#mouse-multi-menu')

    if (multiCard && multiTitle && multiStatus) {
        let original = multiTitle.textContent ?? ''

        multiCard.addEventListener('dblclick', (event) => {
            const target = event.target
            if (!(target instanceof Element)) {
                return
            }
            if (!target.closest('[data-mouse-multi-title]')) {
                multiStatus.textContent = '双击：打开预览（示例中只更新状态）'
                return
            }
            original = multiTitle.textContent ?? ''
            multiTitle.contentEditable = 'true'
            multiTitle.focus()
            const range = document.createRange()
            range.selectNodeContents(multiTitle)
            const selection = window.getSelection()
            selection?.removeAllRanges()
            selection?.addRange(range)
            multiStatus.textContent = '双击：输入新名称，回车或点击空白处确认。'
        })

        multiTitle.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault()
                multiTitle.blur()
            }
            if (event.key === 'Escape') {
                multiTitle.textContent = original
                multiTitle.blur()
            }
        })

        multiTitle.addEventListener('blur', () => {
            multiTitle.contentEditable = 'false'
            multiStatus.textContent = `已重命名为「${multiTitle.textContent?.trim() || '未命名'}」`
        })

        multiCard.addEventListener('mousedown', (event) => {
            if (event.button === 1) {
                event.preventDefault()
            }
        })

        multiCard.addEventListener('auxclick', (event) => {
            if (event.button !== 1) {
                return
            }
            event.preventDefault()
            multiStatus.textContent = '中键：打开菜单'
            multiMenu?.show(event)
        })

        multiCard.addEventListener('contextmenu', () => {
            multiStatus.textContent = '右键：打开菜单'
        })

        bindDrag(
            root.querySelector<HTMLElement>('[data-mouse-multi-stage]'),
            multiCard,
            '[data-mouse-multi-handle]',
            null,
            {
                start: () => {
                    multiStatus.textContent = '左键：拖动中，位置会夹在容器内。'
                },
                finish: () => {
                    multiStatus.textContent = '左键：拖动结束，位置已保留。'
                },
            },
        )
    }
}
