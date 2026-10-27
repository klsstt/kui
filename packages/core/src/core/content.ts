export interface TrustedHTMLLike {
    readonly toString: () => string;
}

export type HtmlContent = string | Node | TrustedHTMLLike;
export type HtmlContentSource = 'custom' | 'error' | 'internal' | 'loading' | 'remote';

export interface HtmlSanitizerContext {
    component: string;
    source: HtmlContentSource;
    url?: string;
}

export type HtmlSanitizer = (
    unsafeHtml: string,
    context: Readonly<HtmlSanitizerContext>,
) => string | TrustedHTMLLike;

export function setHtmlContent(
    target: HTMLElement,
    content: HtmlContent,
    context: HtmlSanitizerContext,
    sanitizer?: HtmlSanitizer,
): void {
    if (content instanceof Node) {
        target.replaceChildren(content);
        return;
    }

    const safeContent = typeof content === 'string' && sanitizer ? sanitizer(content, context) : content;
    const sink = target as unknown as { innerHTML: string | TrustedHTMLLike };
    sink.innerHTML = safeContent;
}

export function createHtmlContentNode(
    content: HtmlContent,
    context: HtmlSanitizerContext,
    sanitizer?: HtmlSanitizer,
): Node {
    if (content instanceof Node) {
        return content;
    }

    const wrapper = document.createElement('div');
    setHtmlContent(wrapper, content, context, sanitizer);
    return wrapper;
}
