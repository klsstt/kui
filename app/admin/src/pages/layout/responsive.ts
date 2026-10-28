import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable } from '../../docs/ui'

/**
 * 响应式。
 * 移动优先的意思是：默认只有一列，宽度够了才增加列；
 * 组件内部用容器查询跟随父容器，而不是再写一套断点。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '响应式不靠另一套页面：默认单列，宽度够了才增加列数；组件内部用容器查询跟随父容器宽度，所以同一段结构放进手机、PAD、TV 都不需要改写。',
    tags: ['@container', '.kui-device', '.kui-grid'],
})}

${callout('KUI 只有两个视口断点：<code>40rem</code> 用于分栏、步骤条与页头堆叠，<code>48rem</code> 用于导航条折叠。其余自适应一律交给 <code>auto-fit</code> 网格与 <code>@container</code>，不需要为每个设备写一份样式。')}

${demo({
    title: '容器查询：同一段分栏',
    desc: '同一段 .kui-split 放进 320px 与 520px 的容器：前者堆叠，后者分栏，代码完全相同。',
    tags: ['.kui-device', '@container kui-board'],
    html: `
<div class="kui-cluster" style="--kui-cluster-align: flex-start; --kui-cluster-gap: var(--kui-space-4)">
    <div class="kui-device kui-device--phone" style="--kui-device-height: 16rem">
        <div class="kui-device__screen">
            <div class="kui-device__content">
                <div class="kui-board kui-stack kui-stack--tight">
                    <strong>订单详情</strong>
                    <div class="kui-split" style="--kui-split-sidebar: 7rem">
                        <aside class="kui-stack kui-stack--tight">
                            <span class="badge badge-primary">待发货</span>
                            <span class="form-hint">KUI-20481</span>
                        </aside>
                        <section class="kui-stack kui-stack--tight">
                            <span class="form-hint">容器宽度不足 30rem，主次两列自动堆叠成一列。</span>
                        </section>
                    </div>
                </div>
            </div>
        </div>
        <span class="kui-device__label">320px · 堆叠</span>
    </div>
    <div class="kui-device kui-device--pad" style="--kui-device-height: 16rem">
        <div class="kui-device__screen">
            <div class="kui-device__content">
                <div class="kui-board kui-stack kui-stack--tight">
                    <strong>订单详情</strong>
                    <div class="kui-split" style="--kui-split-sidebar: 7rem">
                        <aside class="kui-stack kui-stack--tight">
                            <span class="badge badge-primary">待发货</span>
                            <span class="form-hint">KUI-20481</span>
                        </aside>
                        <section class="kui-stack kui-stack--tight">
                            <span class="form-hint">容器宽度足够，两列并排显示。</span>
                        </section>
                    </div>
                </div>
            </div>
        </div>
        <span class="kui-device__label">520px · 分栏</span>
    </div>
</div>`,
})}

${demo({
    title: '列数随宽度降级',
    desc: 'grid 只声明最小列宽：320px 一列、520px 两列，节点数量不变，也不会出现半列。',
    tags: ['.kui-grid--md', '--kui-grid-min'],
    html: `
<div class="kui-cluster" style="--kui-cluster-align: flex-start; --kui-cluster-gap: var(--kui-space-4)">
    <div class="kui-device kui-device--phone" style="--kui-device-height: 15rem">
        <div class="kui-device__screen">
            <div class="kui-device__content">
                <div class="kui-board kui-stack kui-stack--tight">
                    <strong>指标</strong>
                    <div class="kui-grid kui-grid--md">
                        <div class="kui-board">成交额</div>
                        <div class="kui-board">订单数</div>
                        <div class="kui-board">退款率</div>
                    </div>
                </div>
            </div>
        </div>
        <span class="kui-device__label">320px · 一列</span>
    </div>
    <div class="kui-device kui-device--pad" style="--kui-device-height: 15rem">
        <div class="kui-device__screen">
            <div class="kui-device__content">
                <div class="kui-board kui-stack kui-stack--tight">
                    <strong>指标</strong>
                    <div class="kui-grid kui-grid--md">
                        <div class="kui-board">成交额</div>
                        <div class="kui-board">订单数</div>
                        <div class="kui-board">退款率</div>
                    </div>
                </div>
            </div>
        </div>
        <span class="kui-device__label">520px · 两列</span>
    </div>
</div>`,
})}

${demo({
    title: '窄屏降级',
    desc: '页头、工具栏、列表项都靠 flex-wrap 降级：320px 里动作换到下一行，信息不截断、不横向滚动。',
    tags: ['.kui-page-header', '.kui-toolbar', 'flex-wrap'],
    html: `
<div class="kui-device kui-device--phone" style="--kui-device-height: 19rem">
    <div class="kui-device__screen">
        <div class="kui-device__content kui-stack kui-stack--tight">
            <header class="kui-page-header">
                <div class="kui-page-header__text">
                    <h2 class="kui-page-header__title">团队成员</h2>
                    <p class="kui-page-header__desc">共 12 人</p>
                </div>
                <div class="kui-page-header__actions">
                    <button type="button" class="btn btn-primary btn-sm">邀请</button>
                </div>
            </header>
            <div class="kui-toolbar">
                <div class="input-group">
                    <span class="input-addon"><i class="fa fa-search" aria-hidden="true"></i></span>
                    <input class="form-control form-control-sm" type="search" placeholder="搜索成员" aria-label="搜索成员">
                </div>
                <button type="button" class="btn btn-default btn-sm">筛选</button>
            </div>
            <ul class="kui-list kui-list--flush">
                <li class="kui-list__item">
                    <span class="kui-list__media"><span class="kui-avatar kui-avatar--sm kui-avatar--primary">林</span></span>
                    <span class="kui-list__body">
                        <span class="kui-list__title">林澈</span>
                        <span class="kui-list__meta">产品设计 · 管理员</span>
                    </span>
                </li>
            </ul>
        </div>
    </div>
    <span class="kui-device__label">320px · 窄屏</span>
</div>`,
})}

${propsTable([
    { name: '.kui-device', type: 'class', defaultValue: '—', desc: '设备外框，为内部的容器查询提供固定宽度。' },
    { name: '.kui-device--phone / --pad / --tv / --desktop', type: 'class', defaultValue: 'phone', desc: '预设屏幕尺寸：320 / 520 / 640 / 720px 宽。' },
    { name: '--kui-device-width / --kui-device-height', type: 'attribute', defaultValue: '320px / 560px', desc: '覆盖屏幕宽高，只用于预览。' },
    { name: '.kui-device__content', type: 'class', defaultValue: '—', desc: '不加载 iframe 时直接承载页面内容，并声明行内容器。' },
    { name: '@container kui-board (width < 30rem)', type: 'attribute', defaultValue: '—', desc: '内容面内部的 split 在此宽度下堆叠为单列。' },
    { name: '@media (max-width: 40rem)', type: 'attribute', defaultValue: '—', desc: '分栏、步骤条、页头在此视口宽度下堆叠。' },
    { name: '@media (max-width: 48rem)', type: 'attribute', defaultValue: '—', desc: '导航条折叠为抽屉式菜单，显示 .navbar-toggler。' },
])}

`
}
