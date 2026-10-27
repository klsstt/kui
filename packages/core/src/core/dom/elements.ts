export type ElementTarget<TElement extends Element = HTMLElement> =
| TElement
| string
| null
| undefined;

export function isElement(value: unknown): value is Element {
    return value instanceof Element;
}

export function getElement<TElement extends HTMLElement = HTMLElement>(target: ElementTarget<TElement>, root: ParentNode = document,

): TElement {
    if(typeof target === 'string'){
        const element = root.querySelector<TElement>(target);
        if(!element){
            throw new Error(`KUI target not found : ${target}`);
        }
        return element;
    }

    if(target instanceof HTMLElement){
        return target;
    }

    throw new Error(`KUI target is not a valid HTMLElement : ${target}`);
}

export function getSelectorFromElement(element: HTMLElement): string | null {
    const dataSelector = element.getAttribute('data-kui-target') ?? element.getAttribute('data-target');
    const href = element.getAttribute('href');
    const selector = dataSelector ?? (href?.startsWith('#')? href : null);

    if(!selector || selector === '#'){
        return null;
    }

    return selector.trim();
}

export function reflow(element: HTMLElement): number {
    return element.offsetWidth;
}
