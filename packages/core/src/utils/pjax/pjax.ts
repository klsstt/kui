export type PjaxRequestFetcher = (url: string, init: RequestInit) => Promise<string>

export interface PjaxOptions {
    container?: Element | string
    data?: FormData | Record<string, string> | string | URLSearchParams | null
    fetcher?: PjaxRequestFetcher
    fragment?: string
    headers?: HeadersInit
    push?: boolean
    replace?: boolean
    timeout?: number
    type?: string
    url?: string
}

export interface PjaxApi {
    (options: PjaxOptions): Promise<string>
    click(eventOrLink: Event | HTMLAnchorElement, options?: PjaxOptions): Promise<string>
    defaults: Required<Pick<PjaxOptions, 'timeout' | 'type'>> & Pick<PjaxOptions, 'container' | 'fragment'>
    disable(): void
    enable(): void
    reload(container?: Element | string, options?: PjaxOptions): Promise<string>
    submit(eventOrForm: Event | HTMLFormElement, options?: PjaxOptions): Promise<string>
}

let enabled = true

const defaults: PjaxApi['defaults'] = {
    container: '[data-pjax-container], .kui-page',
    fragment: undefined,
    timeout: 650,
    type: 'GET',
}

export const pjax = Object.assign(runPjax, {
    click: pjaxClick,
    defaults,
    disable: () => {
        enabled = false
    },
    enable: () => {
        enabled = true
    },
    reload: pjaxReload,
    submit: pjaxSubmit,
}) as PjaxApi

export async function runPjax(options: PjaxOptions): Promise<string> {
    if (!enabled) {
        window.location.href = options.url ?? window.location.href
        return ''
    }

    const normalized = { ...defaults, ...options }
    const container = resolveContainer(normalized.container)
    if (!container) {
        throw new Error(`KUI pjax requires a container: ${normalized.container}`)
    }

    const url = new URL(normalized.url ?? window.location.href, window.location.href)
    const method = (normalized.type ?? 'GET').toUpperCase()
    const init: RequestInit = {
        method,
        headers: {
            'X-PJAX': 'true',
            'X-Requested-With': 'XMLHttpRequest',
            ...normalizeHeaders(normalized.headers),
        }
    }

    if (normalized.data && method === 'GET') {
        new URLSearchParams(normalized.data as Record<string, string>).forEach((value, key) => url.searchParams.append(key, value))
    } else if (normalized.data) {
        init.body = isRequestBody(normalized.data) ? normalized.data : new URLSearchParams(normalized.data)
    }

    emit(container, 'pjax:start', {options: normalized})
    try {
        const html = await(normalized.fetcher ?? defaultFetcher)(url.toString(), init)
        const nextHtml = extractFragment(html, normalized.fragment ?? undefined)
        container.innerHTML = nextHtml
        updateHistory(url, normalized)
        emit(container, 'pjax:success', {html: nextHtml, options: normalized})
        emit(container, 'pjax:complete', {html: nextHtml, options: normalized})
        return nextHtml
    } catch (error) {
        emit(container, 'pjax:error', {error, options: normalized})
        emit(container, 'pjax:complete', {error, options: normalized})
        throw error
    }
}

export function pjaxClick(eventOrLink: Event | HTMLAnchorElement, options?: PjaxOptions = {}): Promise<string> {
    const event = eventOrLink instanceof Event ? eventOrLink : undefined
    const link = event ? closestAnchor(event.target) : eventOrLink instanceof HTMLAnchorElement ? eventOrLink : null
    if(!link){
        throw new Error('$.pjax.click requires an anchor element.')
    }

    event?.preventDefault()
    return runPjax({
        container: link.getAttribute('data-pjax') || options.container,
        fragement: link.getAttribute('data-fragment') || options.fragement,
        url: link.href,
        ...options,
    })
}

export function pjaxSubmit(eventOrForm: Event | HTMLFormElement, options: PjaxOptions = {}): Promise<string> {
    const event = eventOrForm instanceof Event ? eventOrForm : undefined
    const form = event ? closestForm(event.target) : eventOrForm instanceof HTMLFormElement ? eventOrForm : null
    if(!form){
        throw new Error('$.pjax.submit requires a form element.')
    }

    event?.preventDefault()
    return runPjax({
        container: form.getAttribute('data-pjax') || options.container,
        data: new FormData(form),
        type: form.method || options.type,
        url: form.action,
        ...options,
    })
}

export function pjaxReload(container?: Element | string, options: PjaxOptions = {}): Promise<string> {
    return runPjax({
        container: container || options.container,
        replace: true,
        url: window.location.href,
        ...options,
    })
}

export function defaultFetcher(url: string, init: RequestInit): Promise<string> {
    const response = await fetch(url, init)
    if (!response.ok) {
        throw new Error(`KUI pjax request failed with status ${response.status}`)
    }
    return response.text()
}

function resolveContainer(container: PjaxOptions['container']): Element | null {
    if (container instanceof Element) {
        return container
    }
    return document.querySelector(container ?? String(defaults.container))
}

function extractFragment(html: string, fragment?: string): string {
    if (!fragment) {
        return html
    }
    const template = document.createElement('template')
    template.innerHTML = html
    return template.content.querySelector(fragment)?.innerHTML ?? html
}

function updateHistory(url: URL, options: PjaxOptions) : void {
    if (options.push === false) {
        return
    }
    if (options.replace) {
        window.history.replaceState({}, '', url.toString())
    }
    window.history.pushState({}, '', url.toString())
}

function closestAnchor(target: EventTarget | null): HTMLAnchorElement | null {
    return target instanceof Element ? target.closest<HTMLAnchorElement>('a[href]') : null
}

function closestForm(target: EventTarget | null): HTMLFormElement | null {
    return target instanceof Element ? target.closest<HTMLFormElement>('form') : null
}

function emit(container: Element, name: string, detail: unknown): void {
    container.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }))
}

function normalizeHeaders(headers: HeadersInit | undefined): Record<string, string> {
    if(!headers){
        return {}
    }
    if (headers instanceof Headers) {
        return Object.fromEntries(headers.entries())
    }
    if (Array.isArray(headers)) {
        return Object.fromEntries(headers)
    }
    return headers
}

function isRequestBody(data: NonNullable<PjaxOptions['data']>): data is FormData | string | URLSearchParams {
    return data instanceof FormData || data instanceof URLSearchParams || typeof data === 'string'
}
