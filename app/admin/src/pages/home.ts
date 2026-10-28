import { docNav } from '../docs/nav'

/**
 * KUI Index：宣传首页。
 * 首屏用真实组件拼出一张会呼吸的「设计元素组合」横幅，
 * 之后依次回答三个问题：我们坚持什么、设计细节在哪、组件能覆盖什么。
 */

const stats = [
    { value: '38', label: '核心组件' },
    { value: '46', label: '组件文档页' },
    { value: '3', label: '内置主题' },
    { value: '4', label: '端适配' },
]

const values = [
    {
        icon: 'fa fa-eye',
        title: '清晰',
        desc: '信息分组、分层、状态与操作入口必须能被用户快速觉察到。标题、字体、字段和结果各自承担明确角色，不靠装饰区分层级。',
        points: ['一屏一个主操作', '三级文字强度', '状态与动作固定位置'],
    },
    {
        icon: 'fa fa-anchor',
        title: '稳定',
        desc: '固定格式的元素使用稳定的尺寸、样式与策略。合理的空间光效配合克制的动态效果，让界面在变化中保持可预期。',
        points: ['尺寸与间距成体系', '阴影表达空间关系', '动效有时长与缓动'],
    },
    {
        icon: 'fa fa-compress',
        title: '克制',
        desc: '不过度装饰。圆角、阴影、背景和图标只服务于阅读、定位和操作确认，任何一个视觉元素都要能回答「它解决了什么问题」。',
        points: ['一个强调色', '图标不独立表意', '装饰不影响阅读'],
    },
]

const details = [
    { icon: 'fa fa-cube', title: '统一全局 Token', desc: '颜色、间距、排版、圆角、阴影、层级、动效只有一份真源，换肤只覆盖种子令牌。' },
    { icon: 'fa fa-clone', title: '空间与光影', desc: '四级阴影 + 边框弱化，用高度差表达「浮起、选中、拖拽」，而不是堆叠投影。' },
    { icon: 'fa fa-magic', title: '动效模式', desc: '120 / 180ms 两档时长，统一 cubic-bezier，进入、离开、展开、加载各有固定写法。' },
    { icon: 'fa fa-universal-access', title: '可访问性内建', desc: '焦点环、键盘导航、ARIA 与对比度是组件的一部分，文档站 46 页通过 axe 扫描。' },
    { icon: 'fa fa-television', title: '全端一致', desc: '同一套组件在移动端、PAD、TV 与 Web 上按容器自适应，触控目标与字号随端调整。' },
    { icon: 'fa fa-paint-brush', title: '主题体系', desc: '经典蓝、生态绿、深色三套主题共享语义层，业务只引用语义令牌。' },
]

const layers = [
    { name: '@kui/tokens', role: '设计令牌唯一真源', points: ['四层令牌', 'TS / CSS / JSON 三份输出', '构建期一致性校验'] },
    { name: '@kui/style', role: '基础与组件样式', points: ['Cascade Layers 分层', '容器查询响应式', '20+ 组件样式文件'] },
    { name: '@kui/core', role: '框架无关的 DOM 行为', points: ['Component 基类', 'getOrCreate 单例', 'dispose 零残留'] },
]

function categoryCards(): string {
    return docNav
        .map(
            (group) => `
<a class="home-cat" href="#/${group.items[0].id}">
    <span class="home-cat__icon"><i class="${group.icon}" aria-hidden="true"></i></span>
    <span class="home-cat__body">
        <strong>${group.title}</strong>
        <small>${group.items
            .slice(0, 4)
            .map((item) => item.title)
            .join(' · ')}${group.items.length > 4 ? ' …' : ''}</small>
    </span>
    <span class="home-cat__count">${group.items.length}</span>
</a>`,
        )
        .join('')
}

export default function renderHome(root: HTMLElement): void {
    root.innerHTML = `
<section class="home-hero">
    <div class="home-hero__copy">
        <p class="home-hero__eyebrow">KUI INDEX · 现代前端 UI 库</p>
        <h1 class="home-hero__title">把复杂界面，收敛成一套<br><em>可复用的设计语言</em></h1>
        <p class="home-hero__lead">
            基于 DOM 节点与 Vite 驱动的 HTML5 全端 UI 库。同一套组件与设计令牌覆盖移动端、PAD、TV 与 Web，
            不绑定框架，也不要求你改变技术栈。
        </p>
        <div class="home-hero__actions">
            <a class="btn btn-primary btn-lg" href="#/dashboard"><i class="fa fa-cubes" aria-hidden="true"></i> 进入组件库</a>
            <a class="btn btn-outline btn-default btn-lg" href="#/design">查看设计规范</a>
        </div>
        <dl class="home-hero__stats">
            ${stats.map((item) => `<div><dt>${item.value}</dt><dd>${item.label}</dd></div>`).join('')}
        </dl>
    </div>

    <div class="home-hero__banner" aria-hidden="true">
        <div class="home-banner">
            <span class="home-banner__glow"></span>
            <span class="home-banner__ring"></span>
            <span class="home-banner__grid"></span>

            <div class="home-banner__card home-banner__card--stat">
                <div class="kui-stat__head"><span class="kui-stat__label">今日成交额</span><span class="kui-stat__icon"><i class="fa fa-line-chart"></i></span></div>
                <p class="kui-stat__value">486,210<small>元</small></p>
                <p class="kui-stat__foot"><span class="kui-stat__delta is-up"><i class="fa fa-arrow-up"></i>12.4%</span> 较昨日</p>
            </div>

            <div class="home-banner__card home-banner__card--actions">
                <span class="btn btn-primary btn-sm">保存并发布</span>
                <span class="btn btn-outline btn-default btn-sm">取消</span>
                <div class="kui-cluster">
                    <span class="badge badge-success">已上线</span>
                    <span class="badge badge-warning">待审核</span>
                    <span class="badge badge-primary">灰度 20%</span>
                </div>
            </div>

            <div class="home-banner__card home-banner__card--progress">
                <div class="kui-cluster kui-justify-between"><span class="kui-stat__label">迁移进度</span><strong>78%</strong></div>
                <div class="progress progress-sm"><div class="progress-bar" style="width: 78%"></div></div>
                <div class="kui-cluster">
                    <span class="kui-avatar kui-avatar--sm kui-avatar--primary">林</span>
                    <span class="kui-avatar kui-avatar--sm kui-avatar--success">周</span>
                    <span class="kui-avatar kui-avatar--sm">何</span>
                    <span class="kui-avatar-group__more">+3</span>
                </div>
            </div>

            <div class="home-banner__logo">
                <img src="./images/kui-logo.png" alt="" width="72" height="72">
                <span>KUI</span>
            </div>
            <span class="home-banner__chip home-banner__chip--a">--kui-color-primary</span>
            <span class="home-banner__chip home-banner__chip--b">--kui-space-4</span>
            <span class="home-banner__chip home-banner__chip--c">--kui-shadow-md</span>
        </div>
    </div>
</section>

<section class="home-section" id="design-language">
    <header class="home-section__head">
        <p class="home-section__eyebrow">设计价值观</p>
        <h2>三个词，决定每个组件的取舍</h2>
        <p>当实现有分歧时，我们回到这三条判断：信息是否清晰、行为是否稳定、装饰是否克制。</p>
    </header>
    <div class="home-values">
        ${values
            .map(
                (value) => `
<article class="home-value">
    <span class="home-value__icon"><i class="${value.icon}" aria-hidden="true"></i></span>
    <h3>${value.title}</h3>
    <p>${value.desc}</p>
    <ul>${value.points.map((point) => `<li><i class="fa fa-check" aria-hidden="true"></i>${point}</li>`).join('')}</ul>
</article>`,
            )
            .join('')}
    </div>
</section>

<section class="home-section">
    <header class="home-section__head">
        <p class="home-section__eyebrow">设计细节</p>
        <h2>一致性不是限制，是让人不用重新学习</h2>
        <p>令牌、光影、动效、可访问性、全端适配与主题，六件事在组件之外先把体验统一起来。</p>
    </header>
    <div class="home-details">
        ${details
            .map(
                (item) => `
<article class="home-detail">
    <i class="${item.icon}" aria-hidden="true"></i>
    <strong>${item.title}</strong>
    <p>${item.desc}</p>
</article>`,
            )
            .join('')}
    </div>
</section>

<section class="home-section">
    <header class="home-section__head">
        <p class="home-section__eyebrow">组件能力</p>
        <h2>从页面骨架到复杂数据，覆盖一个产品从 0 到 1</h2>
        <p>八个分类、46 个文档页、38 个组件，每个示例都提供可复制的源码。</p>
    </header>
    <div class="home-cats">${categoryCards()}</div>
</section>

<section class="home-section">
    <header class="home-section__head">
        <p class="home-section__eyebrow">技术底座</p>
        <h2>三层结构，按需取用</h2>
        <p>只要视觉就引样式层，只要行为就引行为层；每层都可以单独发布与升级。</p>
    </header>
    <div class="home-layers">
        ${layers
            .map(
                (layer, index) => `
<article class="home-layer">
    <span class="home-layer__index" aria-hidden="true">0${index + 1}</span>
    <h3>${layer.name}</h3>
    <p>${layer.role}</p>
    <ul>${layer.points.map((point) => `<li>${point}</li>`).join('')}</ul>
</article>`,
            )
            .join('')}
    </div>
</section>

<section class="home-cta">
    <div>
        <h2>准备好把界面交给一套系统了吗？</h2>
        <p>从工作台骨架开始，或者直接查看某个组件的源码。</p>
    </div>
    <div class="home-cta__actions">
        <a class="btn btn-primary btn-lg" href="#/dashboard">进入组件库</a>
        <a class="btn btn-outline btn-default btn-lg" href="#/code-block">看看源码怎么用</a>
    </div>
</section>`
}
