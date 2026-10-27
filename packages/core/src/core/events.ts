export type EventDisposer = () => void;
export interface KuiEventDetail<TDetail = unknown> {
  component: string;
  instance: unknown;
  payload?: TDetail;
}

export function on<K extends keyof HTMLElementEventMap>(
  target: HTMLElement | Document | Window,
  type: K,
  listener: (event: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions,
): EventDisposer {
  target.addEventListener(type, listener as EventListener, options);
  return () => target.removeEventListener(type, listener as EventListener, options);
}

export function delegate<K extends keyof HTMLElementEventMap>(
    root: HTMLElement | Document,
    type: K,
    selector: string,
    listener: (event: HTMLElementEventMap[K], matched: HTMLElement) => void,
    options?: AddEventListenerOptions,
): EventDisposer {
    const handler = (event: Event) => {
        const target = event.target;
        if(!(target instanceof Element)) {
            return;
        }

        const matched = target.closest<HTMLElement>(selector);
        if(matched && (root === document || root.contains(matched))) {
            listener(event as HTMLElementEventMap[K], matched);
        }
    }

    root.addEventListener(type, handler, options);
    return () => root.removeEventListener(type, handler, options);
}

export function emitKuiEvent<TDetail>(
    target: HTMLElement,
    name: string,
    detail: KuiEventDetail<TDetail>,
    eventInit: Omit<CustomEventInit<KuiEventDetail<TDetail>>, 'detail'> = {},
): boolean {
   const event = new CustomEvent<KuiEventDetail<TDetail>>(name, {
        bubbles: true,
        cancelable: false,
        ...eventInit,
        detail,
   })

   return target.dispatchEvent(event);
}

export function emitCancelableKuiEvent<TDetail>(
    element: HTMLElement,
    names: readonly [legacyName: string, modernName: string],
    detail: KuiEventDetail<TDetail>,
): boolean{
    return names.every((name) => {
        const event = new CustomEvent<KuiEventDetail<TDetail>>(name, {
            bubbles: true,
            cancelable: true,
            detail,
        });
        return element.dispatchEvent(event);
    })
}
