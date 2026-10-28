export type MouseButtonName = 'all' | 'left' | 'middle' | 'right';

export interface KuiStoreFacade {
    enable: boolean;
    silent: boolean;
    page: Record<string, unknown>;
    pageSave(): void;
    pageRemove(key: string): void;
    pageClear(): void;
    pageGet<TValue>(key: string, defaultValue?: TValue): TValue | unknown;
    pageSet(objOrKey: Record<string, unknown> | string, val?: unknown): void;
    check(): boolean;
    length(): number;
    removeItem(key: string): KuiStoreFacade;
    remove(key: string): KuiStoreFacade;
    getItem(key: string): string | null;
    get<TValue>(key: string, defaultValue?: TValue): TValue | unknown;
    key(index: number): string | null;
    setItem(key: string, val: string): KuiStoreFacade;
    set(key: string, val: unknown): KuiStoreFacade;
    clear(): KuiStoreFacade;
    forEach(callback: (key: string, val: unknown) => void): KuiStoreFacade;
    getAll(): Record<string, unknown>;
    serialize(value: unknown): string;
    deserialize(value: unknown): unknown;
}

let lastUuidAmend = 0;

export function uuid(): number {
    return Date.now() * 1000 + (lastUuidAmend++ % 1000);
}

export function callEvent<TEvent extends {result?: unknown}>(
    func: unknown,
    event?: TEvent,
    proxy?: unknown,
): boolean {
    if(typeof func !== 'function'){
        return true;
    }
    const result = proxy === undefined ? func(event) : func.call(proxy, event);
    if(event){
        event.result = result;
    }
    return !(result !== undefined && !result);
}

export function clientLang(): string {
    const configured = typeof window === 'undefined' ? undefined : (window as Window & {config?: {clientLang?: string}}).config?.clientLang;
    const htmlLang = typeof document === 'undefined' ? undefined : document.documentElement.lang;
    const nav = typeof navigator === 'undefined' ? undefined : navigator as Navigator & { userLanguage?: string};
    return (configured || htmlLang || nav?.userLanguage || nav?.language || 'zh-CN').replace('-','_').toLowerCase();
}
export function strCode(str: string): number {
    let code = 0;
    for (let index = 0; index < str.length; index+=1) {
       code += index * str.charCodeAt(index);
    }
    return code;
}

export function getMouseButtonCode(mouseButton: MouseButtonName|number|undefined|null): number {
    if(typeof mouseButton === 'number'){
        return mouseButton;
    }
    const buttonMap: Record<MouseButtonName, number> = {all: -1, left: 0, middle: 1, right: 2};
    return mouseButton ? buttonMap[mouseButton] : -1;
}

export class Store implements KuiStoreFacade {
    enable = false;
    silent = true;
    page: Record<string, unknown> ;

    private readonly storage: StorageLike;
    private readonly pageName = createPageName();
    private memory: Record<string, string> = {};

    constructor(storage: StorageLike|null = getAvailableStorage()) {
        this.enable = Boolean(storage);
        this.storage = storage ?? this.createMemoryStorage();
        this.page = this.get<Record<string, unknown>>(this.pageName, {}) as Record<string, unknown>;
    }

    pageSave(): void {
        const nextPage = Object.fromEntries(Object.entries(this.page).filter(([, value]) => value !== null));
        this.page = nextPage;
        if (Object.keys(nextPage).length === 0 ){
            this.remove(this.pageName);
        }else{
            this.set(this.pageName, nextPage);
        }
    }

    pageRemove(key: string): void {
        if(typeof this.page[key] !== 'undefined'){
            this.page[key] = null;
            this.pageSave();
        }
    }

    pageClear(): void {
        this.page = {};
        this.pageSave();
    }

    pageGet<TValue>(key: string, defaultValue?: TValue): TValue | unknown {
        const value = this.page[key];
        return defaultValue !== undefined && (value === null || typeof value === 'undefined') ? defaultValue : value;
    }

    pageSet(objOrKey: Record<string, unknown> | string, val?: unknown): void {
        if(typeof objOrKey === 'string'){
            this.page[this.serialize(objOrKey)] = val;
        }else{
            this.page = {...this.page,...objOrKey};
        }
        this.pageSave();
    }

    check(): boolean {
        if(!this.enable && !this.silent){
            throw new Error('Browser does not support localStorage or store is not enabled')
        }
        return this.enable;
    }

    length(): number {
        return this.storage.length;
    }

    removeItem(key: string): KuiStoreFacade {
        this.storage.removeItem(key);
        return this;
    }

    remove(key: string): KuiStoreFacade {
        this.storage.removeItem(key);
        return this;
    }

    getItem(key: string): string | null {
        return this.storage.getItem(key);
    }

    get<TValue>(key: string, defaultValue?: TValue): TValue | unknown {
       const value = this.deserialize(this.getItem(key));
       if((value === null || typeof value === 'undefined')&&typeof defaultValue !== 'undefined'){
            return defaultValue;
       }
       return value;
    }

    key(index: number): string | null {
        return this.storage.key(index);
    }

    setItem(key: string, val: string): KuiStoreFacade {
        this.storage.setItem(key, val);
        return this;
    }

    set(key: string, val: unknown): KuiStoreFacade {
        if(typeof val === 'undefined'){
            return this.remove(key);
        }
        this.setItem(key, this.serialize(val));
        return this;
    }

    clear(): KuiStoreFacade {
        this.storage.clear();
        return this;
    }

    forEach(callback: (key: string, val: unknown) => void): KuiStoreFacade {
        for (let index = this.length() - 1; index >= 0; index-=1) {
            const key = this.storage.key(index);
            if(key){
                callback(key, this.get(key));
            }
        }
        return this;
    }

    getAll(): Record<string, unknown> {
        const all: Record<string, unknown> = {};
        this.forEach((key, value) => {
            all[key] = value;
        });
        return all;
    }

    serialize(value: unknown): string {
        return typeof value === 'string' ? value : JSON.stringify(value);
    }

    deserialize(value: unknown): unknown {
        if(typeof value !== 'string'){
            return value;
        }

        try{
            return JSON.parse(value);
        }catch{
            return value||undefined;
        }
    }

    private createMemoryStorage(): StorageLike {
        const memory = () => this.memory;
        return {
            get length() {
                return Object.keys(memory()).length;
            },
            key: (index: number) => Object.keys(this.memory)[index] ?? null,
            getItem: (key: string) => memory()[key] ?? null,
            setItem: (key: string, val: string) => {
                memory()[key] = val;
            },
            removeItem: (key: string) => {
                delete this.memory[key];
            },
            clear: () => {
                this.memory = {};
            },
        };
    }
}

export const store = new Store();

export const kui = {
    uuid,
    callEvent,
    clientLang,
    strCode,
    getMouseButtonCode,
    store,
}

interface StorageLike {
    readonly length: number;
    clear(): void;
    getItem(key: string): string | null;
    key(index: number): string | null;
    removeItem(key: string): void;
    setItem(key: string, value: string): void;
}

function getAvailableStorage(): StorageLike | null {
    if(typeof window === 'undefined'){
        return null;
    }
    try{
        return window.localStorage;
    } catch{
        return null;
    }
}

function createPageName(): string {
    return typeof window === 'undefined' ? 'page_' : `page_${window.location.pathname}${window.location.search}`;
}
