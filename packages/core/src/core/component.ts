import { getElement, type ElementTarget } from './dom/elements';
import {
    emitCancelableKuiEvent,
    emitKuiEvent,
    on,
    type EventDisposer,
    type KuiEventDetail,
} from './events';

import { removeInstance, setInstance } from './instances';

export abstract class Component<TOptions extends object = Record<string, never>> {
    protected readonly disposers: EventDisposer[] = [];

    protected constructor(
        public readonly element: HTMLElement,
        public readonly componentName: string,
        public options: TOptions,

    ){
        setInstance(element, componentName, this);
    }

    protected listen<K extends keyof HTMLElementEventMap>(
        target: HTMLElement | Document | Window,
        type: K,
        listener: (event: HTMLElementEventMap[K]) => void,
        options?: AddEventListenerOptions,
    ):void{
        this.disposers.push(on(target, type, listener, options));
    }

    protected emit<TDetail>(name: string, payload?: TDetail): boolean {
        return emitKuiEvent(this.element, name, this.createEventDetail(payload));
    }

    protected emitCancelable<TDetail>(
        names: readonly [legacyName: string, modernName: string],
        payload?: TDetail,
    ): boolean {
        return emitCancelableKuiEvent(this.element, names, this.createEventDetail(payload));
    }

    dispose(): void {
        this.disposers.splice(0).forEach((disposer) => disposer());
        removeInstance(this.element, this.componentName);

    }

    protected createEventDetail<TDetail>(payload?: TDetail): KuiEventDetail<TDetail> {
        return {
            component: this.componentName,
            instance: this,
            payload,
        };
    }

    protected static resolveElement<TElement extends HTMLElement = HTMLElement>(
        target: ElementTarget<TElement>,
    ): TElement {
        return getElement(target);
    }
}
