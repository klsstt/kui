const instanceStore = new WeakMap<HTMLElement, Map<string,unknown>>();

export function getInstance<TInstance>(element: HTMLElement, componentName: string): TInstance | undefined {
    // 与 setInstance/removeInstance 保持一致的输入守卫，非法输入直接返回 undefined
    if (!element || !componentName) {
        return undefined;
    }

    // 直接返回可选链结果：未命中时天然为 undefined，与声明类型保持一致
    return instanceStore.get(element)?.get(componentName) as TInstance | undefined;
}

export function setInstance<TInstance>(
    element: HTMLElement,
    componentName: string,
    instance: TInstance
): void {
    if (!element || typeof componentName !== 'string' || !componentName) {
        return;
    }

    let instances = instanceStore.get(element);
    if (!instances) {
        instances = new Map<string, unknown>();
        instanceStore.set(element, instances);
    }
    instances.set(componentName, instance);
}

export function removeInstance(element: HTMLElement, componentName: string): void {
    const instances = instanceStore.get(element);
    if (!instances || !componentName) {
        return;
    }

    instances.delete(componentName);
    if (instances.size === 0) {
        instanceStore.delete(element);
    }
}
