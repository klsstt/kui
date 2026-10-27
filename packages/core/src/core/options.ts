export type PlainObject = Record<string, unknown>;

export function mergeOptions<TOptions extends object>(
    defaults: TOptions,
    ...sources: Array<Partial<TOptions> | undefined>
): TOptions {
    return Object.assign({}, defaults, ...sources);
}

export function readDataOptions<TOptions extends object>(element: HTMLElement): Partial<TOptions> {
    return Object.entries(element.dataset).reduce<Partial<TOptions>>((options, [key, value]) => {
        if(value === undefined || key.startsWith('kui')){
            return options;
        }

        return {
            ...options,
            [key]: parseDataValue(value),
        } as Partial<TOptions>;
    }, {});
}

function parseDataValue(value: string): unknown {
    if(value === 'true'){
        return true;
    }
    if(value === 'false'){
        return false;
    }
    if(value === 'null'){
        return null;
    }
    if(value === 'undefined'){
        return undefined;
    }
    if(value !=='' && Number.isFinite(Number(value))){
        return Number(value);
    }
    return value;
}
