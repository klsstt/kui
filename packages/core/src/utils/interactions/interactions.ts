import { applyTabActiveRadiusStyles, type TabActiveRadiusOptions } from '../../core/dom/styles'

export interface ClassToggleOptions {
    className?: string
}

export interface TextareaLengthOptions {
    errorClass?: string
    exceed?: boolean
    maxlength?: number
    minlength?: number
}

export interface TogglePasswordOptions {
    el?: Element | string
    ev?: string
}

export interface KTabOptions extends TabActiveRadiusOptions {
    className?: string
    index?: number
    tabBar?: string
    tabCon?: string
    tabEvent?: string
}

export interface KFoldOptions {
    className?: string
    mainCell?: string
    speed?: string|number
    titCell?: string
    trigger?: string
    triggerType?: boolean
    type?: 1 | 2| 3
}

export interface KTagsOptions {
    maxlength?: number
    number?: number
    tagsDefault?: string[]
    value?: string
}

export interface LazyLoadOptions {
    appear?: (remaining:number, options: LazyLoadOptions) => void
    data_attribute?:string
    load?: (remaining:number,options:LazyLoadOptions) => void
    placeholder?: string
    skip_invisible?: boolean
    threshold?: number
}

export interface OnePageNavOptions{
    begin?: false | (()=>void)
    changeHash?: boolean
    currentClass?: string
    end?: false | (()=>void)
    filter?: string
    scrollOffset?: number
    scrollSpeed?: number
    scrollThreshold?: number
}

export interface StickUpOptions {
    itemClass?: string
    itemHover?: string
    parts?: string[]
    topMargin?: number | string
}

export interface EmailSuggestOptions {
    domains?: string[]
    sugClass?: string
}

export interface PreviewOptions {
    bigImgWidth?: number,
    className?: string
}

export function formatNumberGroups(value: string | number, step: number, splitor: string): string {
    let str = value.toString()
    const length = str.length
    // 边界保护：step 非法或大于字符串长度时直接返回原值，避免 length % step 产生 NaN
    if(step > 0 && length > step) {
        const firstLength = length % step
        const groups = []
        const first = str.substring(0, firstLength)
        if (first) {
            groups.push(first)
        }
        for(let index = 0; index< Math.floor(length/step); index+=1){
            groups.push(str.substring(firstLength + index * step, firstLength + (index + 1)* step))
        }
        str = groups.join(splitor)
    }
    return str
}

export function showModalAlert(info: string, speed= 0): HTMLElement {
    document.querySelectorAll('.modal-alert').forEach((element) => element.remove())
    const modal = document.createElement('div')
    modal.id= 'modal-alert'
    modal.className = 'modal modal-alert radius'
    // 使用 textContent 而非 innerHTML，避免 info 内容注入 HTML（XSS 防护）
    const content = document.createElement('div')
    content.className = 'modal-alert-info'
    content.textContent = info
    modal.append(content)
    if(speed <= 0){
        const footer = document.createElement('div')
        footer.className = 'modal-footer'
        const confirm = document.createElement('button')
        confirm.className = 'btn btn-primary radius'
        confirm.type = 'button'
        confirm.textContent = '确定'
        confirm.addEventListener('click', hideModalAlert)
        footer.append(confirm)
        modal.append(footer)
    }
    document.body.append(modal)
    modal.style.display = 'block'
    if(speed > 0){
        window.setTimeout(hideModalAlert, speed)
    }
    return modal
}

export function hideModalAlert(): void {
    document.querySelector(`#modal-alert`)?.remove()
}

export function bindInlineAlerts(root: ParentNode = document): void {
    root.querySelectorAll<HTMLElement>('.kalert i').forEach((icon) => {
        bindHoverClass(icon)
        icon.addEventListener('click', () => {
            icon.closest('.kalert')?.remove()
        })
    })
}

// 模块级保存当前返回顶部按钮的滚动监听器，重复创建时可释放旧监听，避免泄漏
let toTopScrollHandler: (() => void) | null = null

export function createToTop(bottom = 60) : HTMLElement {
    document.querySelectorAll('.toTop').forEach((element) => element.remove())
    // 移除旧实例绑定的滚动监听器，防止重复调用时监听器无限累积
    if(toTopScrollHandler){
        window.removeEventListener('scroll', toTopScrollHandler)
        toTopScrollHandler = null
    }
    const trigger = document.createElement('a')
    // 避免 javascript: URL（违反 CSP 且存在安全风险），实际跳转由 click 事件拦截
    trigger.href = '#'
    trigger.className = 'tools-right toTop iconfont'
    trigger.title = '返回顶部'
    trigger.setAttribute('alt', '返回顶部')
    trigger.style.display = 'none'
    trigger.style.bottom = `${bottom}px`
    trigger.innerHTML = '&#xe684;'
    trigger.addEventListener('click', (event) => {
        // 拦截默认锚点跳转，避免修改 URL hash
        event.preventDefault()
        window.scrollTo({top:0, behavior: 'smooth'})
    })
    const update = () => {
        trigger.style.display = window.scrollY > 0 || document.documentElement.scrollTop > 0 ? '' : 'none'
    }
    // 由模块级引用持有，供下一次 createToTop 调用时移除
    toTopScrollHandler = update
    window.addEventListener('scroll', update)
    document.body.append(trigger)
    update()
    return trigger
}

export function bindKTab(root: HTMLElement, options: KTabOptions = {}): () => void {
    const settings = {className : 'current', index: 0, tabBar: '.tabBar span', tabCon: '.tabCon', tabEvent: 'click', ...options}
    const tabs = Array.from(root.querySelectorAll<HTMLElement>(settings.tabBar))
    const panels = Array.from(root.querySelectorAll<HTMLElement>(settings.tabCon))
    tabs.forEach((tab) => applyTabActiveRadiusStyles(tab, settings))
    const activate = (index:number) => {
        tabs.forEach((tab, tabIndex) => tab.classList.toggle(settings.className, tabIndex === index))
        panels.forEach((panel,panelIndex) => {
            panel.style.display = panelIndex === index?'':'none'
        })
    }
    const disposers = tabs.map((tab,index) => {
        const handler = () => activate(index)
        tab.addEventListener(settings.tabEvent,handler)
        return () => tab.removeEventListener(settings.tabEvent, handler)
    })
    activate(settings.index)
    return () => disposers.forEach((disposer) => disposer())
}

export function bindKFold(root: HTMLElement, options: KFoldOptions = {}): () => void {
    const settings = {
        className: 'selected',
        mainCell: '.item .kfold-body',
        titCell: '.item .kfold-header',
        trigger: 'click',
        triggerType: false,
        type: 1 as 1 | 2 | 3,
        ...options
    }
    const headers = Array.from(root.querySelectorAll<HTMLElement>(settings.titCell))
    const toggle = (header: HTMLElement) => {
        const body = header.nextElementSibling instanceof HTMLElement ? header.nextElementSibling : null
        if(!body) {
            return
        }
        const visible = body.style.display !=='none'
        if(visible && settings.type === 2){
            return
        }
        if(!visible && settings.type !==3){
            root.querySelectorAll<HTMLElement>(settings.mainCell).forEach((candidate) => {
                candidate.style.display = 'none'
            })
            headers.forEach((candidate) => {
                candidate.classList.remove(settings.className)
                candidate.querySelector('b')?.replaceChildren('+')
            })
        }

        const nextVisible = !visible
        body.style.display = nextVisible ? '' : 'none'
        header.classList.toggle(settings.className, nextVisible)
        header.querySelector('b')?.replaceChildren(nextVisible ? '-' : '+')
    }
    const disposers = headers.map((header) => {
        // triggerType 模式下事件应绑定到内部触发器（i:last-child），绑定与解绑需使用同一对象
        const trigger = settings.triggerType ? header.querySelector<HTMLElement>('i:last-child') ?? header : header
        const handler = () => toggle(header)
        trigger.addEventListener(settings.trigger, handler)
        return () => trigger.removeEventListener(settings.trigger, handler)
    })
    return () => disposers.forEach((disposer) => disposer())
}

export function bindKTags(root: HTMLElement, options: KTagsOptions = {}):() => void {
    const settings = {
        maxlength: 20,
        number: 5,
        tagsDefault: ['Html','CSS','JS'],
        value: 'KUI+前端框架',
        ...options
    }
    root.innerHTML = `
        <div class="ktags-wraper">
           <div class= "ktags-editor cl"></div>
           <div class="ktags-input-wraper"><input type="text" class="input-text ktags-input" maxlength="${settings.maxlength}" value=""></div>
           <div class ="ktags-list"><div class="ktags-notag" style="display:none">暂无常用标签</div><div class="ktags-has"></div></div>
           <input type="hidden" class="ktags-val" name="" value="${settings.value}">
        </div>
    `
    const editor = root.querySelector<HTMLElement>('.ktags-editor')
    const input = root.querySelector<HTMLInputElement>('.ktags-input')
    const hidden = root.querySelector<HTMLInputElement>('.ktags-val')
    const defaults = root.querySelector<HTMLElement>('.ktags-has')

    settings.tagsDefault.slice(0, settings.number).forEach((tag) => {
        const item = document.createElement('span')
        item.textContent = tag
        item.addEventListener('click', () => {
            setTags(readTags(hidden).concat(tag))
            item.remove()
        })
        defaults?.append(item)
    })

    const setTags = (tags: string[]) => {
        const uniqueTags = uniqueTagList(tags).slice(0, settings.number)
        if(hidden){
            hidden.value = uniqueTags.join(',')
        }
        if(editor){
            // 整体重建编辑区，避免重复追加导致的节点堆积
            editor.replaceChildren()
            if(uniqueTags.length){
                const icon = document.createElement('i')
                icon.className = 'ktags-icon iconfont'
                icon.innerHTML = '&#xe600;'
                editor.append(icon)
            }
            uniqueTags.forEach((tag) => {
                const token = document.createElement('span')
                token.className='ktags-token'
                token.textContent = tag
                token.addEventListener('click', () => setTags(readTags(hidden).filter((candidate)=> candidate !== tag)))
                editor.append(token)
            })
        }
    }

    const commitInput = () => {
        if(!input?.value.trim()){
            return
        }
        setTags(readTags(hidden).concat(splitTags(input.value)))
        input.value = ''
        input.blur()
    }

    input?.addEventListener('keydown', (event) => {
        if(event.key === 'Enter' || event.key === '' || event.keyCode === 108){
            event.preventDefault()
            commitInput()

        }
    })
    input?.addEventListener('change',commitInput)
    setTags(splitTags(settings.value))
    return () => {
        root.innerHTML = ''
    }
}

export function bindLazyLoad(elements: Iterable<HTMLElement>, options: LazyLoadOptions = {}):()=> void{
    const settings = {
        data_attribute: 'original',
        placeholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuCLAAAAAElFTkSuQmCC',
        skip_invisible: true,
        threshold: 0,
        ...options
    }

    const targets = Array.from(elements)
    let remaining = targets.length
    const load = (element: HTMLElement) => {
        if((element as HTMLElement & {loaded?: boolean}).loaded){
            return
        }
        const original = element.getAttribute(`data-${settings.data_attribute}`)
        if(!original){
            return
        }
        settings.appear?.(remaining,settings)
        if(element instanceof HTMLImageElement) {
            element.src = original
        }else{
            element.style.backgroundImage = `url(${original})`
        }
        (element as HTMLElement & {loaded?: boolean}).loaded = true
        remaining -= 1
        settings.load?.(remaining,settings)
    }
    const observer = 'IntersectionObserver' in window?new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if(entry.isIntersecting){
                load(entry.target as HTMLElement)
                // 回调仅在 observer 创建并 observe 后触发，此处恒为非 null，可选链消除 TS 空值告警
                observer?.unobserve(entry.target)
            }
        })
    },{rootMargin: `${settings.threshold}px`}):null

    targets.forEach((element) => {
        if(element instanceof HTMLImageElement && !element.getAttribute('src')){
            element.src = settings.placeholder
        }
        element.addEventListener('click',() =>  load(element), {once: true})
        if(observer){
            observer.observe(element)
        } else {
            load(element)
        }
    })

    return () => observer?.disconnect()
}

export function bindOnePageNav(root: HTMLElement, options: OnePageNavOptions = {}):() => void {
    const settings = {
        changeHash: false,
        currentClass: 'current',
        filter: '',
        scrollOffset: 0,
        scrollSpeed: 750,
        scrollThreshold: 0.5,
        ...options
    }
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')).filter((link) =>
        settings.filter ? link.matches(settings.filter) : true
    )
    const activate = (link: HTMLAnchorElement) => {
        root.querySelectorAll(`.${settings.currentClass}`).forEach((element) => element.classList.remove(settings.currentClass))
        link.parentElement?.classList.add(settings.currentClass)
    }
    const clickDisposers = links.map((link) => {
        const handler = (event: Event) => {
            event.preventDefault()
            const target = document.querySelector<HTMLElement>(link.hash)
            if (!target){
                return
            }
            if (typeof settings.begin === 'function') settings.begin()
            activate(link)
            window.scrollTo({ top: target.offsetTop - settings.scrollOffset, behavior: settings.scrollSpeed > 0 ? 'smooth' : 'auto' })
            if (settings.changeHash) {
                window.location.hash = link.hash
            }
            if (typeof settings.end === 'function') settings.end()
        }
        link.addEventListener('click', handler)
        return () => link.removeEventListener('click', handler)
    })
    const onScroll = () => {
        const active = links
           .map((link) => ({ link, target: document.querySelector<HTMLElement>(link.hash) }))
           .filter((entry): entry is {link: HTMLAnchorElement; target: HTMLElement} => Boolean(entry.target))
           .filter(({ target }) => target.offsetTop - settings.scrollOffset <= window.scrollY + window.innerHeight * settings.scrollThreshold)
           .pop()
        if (active) {
            activate(active.link)
        }
    }
    window.addEventListener('scroll', onScroll)
    return () => {
        clickDisposers.forEach((dispose) => dispose())
        window.removeEventListener('scroll', onScroll)
    }
}

export function bindStickUp(element: HTMLElement, options: StickUpOptions = {}): () => void {
    element.classList.add('stuckMenu')
    const topMargin = parseTopMargin(options.topMargin)
    const initialTop = element.offsetTop
    const update = () => {
        element.classList.toggle('isStuck', window.scrollY > initialTop - topMargin)
    }
    window.addEventListener('scroll', update)
    update()
    return () => window.removeEventListener('scroll', update)
}

export function startMarquee(height: number, speed=50,delay=2000): () => void {
    const scrollBox = document.querySelector<HTMLElement>('#marquee')
    const holder = document.querySelector<HTMLElement>('#holder')
    if (!scrollBox || !holder || holder.offsetHeight <= height) {
        return () => undefined
    }
    scrollBox.innerHTML += scrollBox.innerHTML.replace('holder', 'holder2')
    let pause = false
    let timer: number | null = null
    const start = () => {
        timer = window.setInterval(() => {
            if(pause){
                return
            }
            scrollBox.scrollTop += 2
            if (scrollBox.scrollTop >= scrollBox.scrollHeight / 2) {
                scrollBox.scrollTop = 0
            }
        }, speed)
    }
    const enter = () => {
        pause = true
    }
    const leave = () => {
        pause = false
    }
    scrollBox.addEventListener('mouseenter', enter)
    scrollBox.addEventListener('mouseleave', leave)
    window.setTimeout(start, delay)
    return () => {
        if (timer !== null) {
            window.clearInterval(timer)
        }
        scrollBox.removeEventListener('mouseenter', enter)
        scrollBox.removeEventListener('mouseleave', leave)
    }
}

export function bindEmailSuggest(input: HTMLInputElement, options: EmailSuggestOptions = {}): () => void {
    const settings = {
        domains: ['163.com','126.com', 'sohu.com', '139.com', 'sina.com', 'qq.com', 'gmail.com'],
        sugClass: 'emailSug',
        ...options
    }
    let selectedIndex = 0
    let wrapper: HTMLElement | null = null
    const hide = () => {
        wrapper?.remove()
        wrapper = null
    }
    const render = () => {
        const value = input.value.trim()
        if(!value){
            return
        }
        const name = value.replace(/@.*/, '')
        const suffix = value.includes('@') ? value.slice(value.indexOf('@') + 1) : ''
        const domains = settings.domains.filter((domain) => domain.includes(suffix))
        wrapper?.remove()
        wrapper = document.createElement('div')
        wrapper.className = `${settings.sugClass}-wrapper`
        const list = document.createElement('ul')
        list.className = `${settings.sugClass}-list`
        domains.forEach((domain, index) => {
            const item = document.createElement('li')
            item.className = `${settings.sugClass}-item${index === selectedIndex ? ' active' : ''}`
            item.textContent = `${name}@${domain}`
            item.addEventListener('mouseenter', () => {
                selectedIndex = index
                render()
            })
            item.addEventListener('click', (event) => {
                input.value = item.textContent ?? ''
                hide()
            })
            list.append(item)
        })
        wrapper.append(list)
        input.after(wrapper)
    }
    const keyup = (event: KeyboardEvent) => {
        const items = wrapper ? Array.from(wrapper.querySelectorAll<HTMLElement>(`.${settings.sugClass}-item`)) : []
        if (event.key === 'ArrowDown') {
            selectedIndex = items.length ? (selectedIndex + 1) % items.length : 0
        } else if (event.key === 'ArrowUp') {
            selectedIndex = items.length ? (selectedIndex - 1 + items.length) % items.length : 0
        } else if (event.key === 'Enter') {
            items[selectedIndex]?.click()
            selectedIndex = 0
            return
        }
        render()
    }
    input.addEventListener('keyup', keyup)
    input.addEventListener('blur', () => window.setTimeout(hide, 200))
    return () => {
        input.removeEventListener('keyup', keyup)
        hide()
    }
}

export function enableElements(elements: Iterable<HTMLElement>, enabled =true): void {
    Array.from(elements).forEach((element) => {
        if ('disabled' in element) {
            (element as HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).disabled = !enabled
        }
    })
}

export function selectElements(elements: Iterable<HTMLElement>, selected = true): void {
    Array.from(elements).forEach((element) => {
        if(element instanceof HTMLInputElement && (element.type === 'checkbox' || element.type === 'radio')) {
            element.checked = selected
        } else if (element instanceof HTMLOptionElement) {
            if(selected && element.parentElement instanceof HTMLSelectElement && element.parentElement.type === 'select-one') {
                Array.from(element.parentElement.options).forEach((option) => {
                    option.selected = false
                })
            }
            element.selected = selected
        }
    })
}

export function bindHoverClass(elements: HTMLElement, options: ClassToggleOptions = {}): () => void {
    const className = options.className ?? 'hover'
    const hover = () => elements.classList.add(className)
    const leave = () => elements.classList.remove(className)
    elements.addEventListener('mouseenter',hover)
    elements.addEventListener('mouseleave',leave)
    return () => {
        elements.removeEventListener('mouseenter',hover)
        elements.removeEventListener('mouseleave',leave)
    }
}

export function bindFocusBlurClass(elements: HTMLElement, options: ClassToggleOptions = {}):() => void {
    const className = options.className ?? 'focus'
    const focus = () => {
        elements.classList.add(className)
        elements.classList.remove('inputError')
    }
    const blur = () => elements.classList.remove(className)
    elements.addEventListener('focus',focus)
    elements.addEventListener('blur',blur)
    return () => {
        elements.removeEventListener('focus',focus)
        elements.removeEventListener('blur',blur)
    }
}

export function bindTogglePassword(input: HTMLInputElement, options: TogglePasswordOptions = {}): () => void {
    const eventName = options.ev ?? 'click'
    const triggers = resolveElements(options.el ?? input)
    const toggle = () => {
        input.type = input.type === 'password' ? 'text' : 'password'
    }
    triggers.forEach((trigger) => trigger.addEventListener(eventName, toggle))
    return () => triggers.forEach((trigger) => trigger.removeEventListener(eventName, toggle))
}

export function bindTextareaLength(textarea: HTMLTextAreaElement, options: TextareaLengthOptions = {}):() => void {
    const settings = { errorClass: 'error', exceed: true, maxlength: 140, minlength: 0, ...options }
    const numberbar = document.createElement('P')
    numberbar.className = 'textarea-numberbar'
    numberbar.innerHTML = `<em class="textarea-length">${textarea.value.length}</em>/${settings.maxlength}`
    textarea.parentElement?.append(numberbar)

    const update = () => {
        let value = textarea.value
        if (value.length > settings.maxlength) {
            if(settings.exceed) {
                textarea.classList.add(settings.errorClass)
            }else {
                value = value.slice(0, settings.maxlength)
                textarea.value = value
                textarea.classList.remove(settings.errorClass)
            }
        }else if (value.length < settings.minlength) {
            textarea.classList.add(settings.errorClass)
        }else {
            textarea.classList.remove(settings.errorClass)
        }
        numberbar.querySelector('.textarea-length')?.replaceChildren(String(textarea.value))
    }

    textarea.addEventListener('keyup', update)
    return () => {
        textarea.removeEventListener('keyup', update)
        numberbar.remove()
    }
}

export function bindPreview(element: HTMLElement, options: PreviewOptions = {}): () => void {
    const settings = {bigImgWidth: 300, className: 'active', ...options}
    let timer: number | null = null
    const show = () => {
        timer = window.setTimeout(() => {
            document.querySelector('#preview-wraper')?.remove()
            const img = element.querySelector<HTMLImageElement>('img')
            const src = element.dataset.src || img?.src
             if(!src){
                return
             }

             const wrapper = document.createElement('div')
             wrapper.id = 'preview-wraper'
             wrapper.style.position = 'absolute'
             wrapper.style.width = `${settings.bigImgWidth}px`
             wrapper.innerHTML = `<img src=:"{src}" width="${settings.bigImgWidth}">`
             document.body.append(wrapper)
             element.classList.add(settings.className)
        }, 500)
    }
    const hide = () => {
        if (timer !== null){
            window.clearTimeout(timer)
        }
        element.classList.remove(settings.className)
        document.querySelector('#preview-wraper')?.remove()
    }
    element.addEventListener('mouseenter', show)
    element.addEventListener('mouseleave', hide)
    return () => {
        hide(),
        element.removeEventListener('mouseenter', show)
        element.removeEventListener('mouseleave', hide)
    }
}
function resolveElements(target: Element | string): HTMLElement[] {
    if(typeof target==='string'){
        return Array.from(document.querySelectorAll<HTMLElement>(target))
    }
    return target instanceof HTMLElement ? [target]: []
}

function readTags(input: HTMLInputElement|null):string[]{
    return splitTags(input?.value ?? '')
}

function splitTags(value: string):string[]{
    return value
    .replace(/(^\s*)|(\s*$)/g,'')
    .replace(/[\s.]+/g,',')
    .replace(/^,|,$/g,'')
    .split(',')
    .filter(Boolean)
}

function uniqueTagList(tags: string[]): string[]{
    return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)))
}

function parseTopMargin(value: number|string|undefined): number {
    if(typeof value === 'number'){
        return value
    }
    if(typeof value === 'string'){
        return Number.parseInt(value.replace('px',''),10) || 0
    }
    return 0
}
