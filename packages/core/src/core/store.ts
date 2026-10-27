export interface Kuistore {
 get<TValue>(key: string, fallback?:TValue): TValue;
 set<TValue>(key: string, value: TValue): void;
 remove(key: string): void;
}

export function createLocalStore(storage: Storage= window.localStorage): KuiStore {
    return {
        get<TValue>(key: string, fallback?: TValue): TValue | null {
            const raw = storage.getItem(key);
            if(raw === null){
                return fallback ?? null;
            }
            try{
                return JSON.parse(raw) as TValue;
            }catch{
                return raw as TValue;
            }
        },
        set<TVlaue>(key: string, value: TVlaue): void {
            storage.setItem(key, JSON.stringify(value));
        },
        remove(key: string): void {
            storage.removeItem(key);
        }
    }
}

export interface StoreAdapter {
    get<TValue>(key: string, fallback?: TValue): TValue;
    set<TValue>(key: string, value: TValue): void;
    remove(key: string): void;
}

export class LocalStore implements StoreAdapter {
    constructor(private readonly storage: Storage = window.localStorage) {}

    get<TValue>(key: string, fallback: TValue): TValue {
        const raw = this.storage.getItem(key);
        if(raw === null){
            return fallback;
        }
        try{
            return JSON.parse(raw) as TValue;
        }catch{
            return fallback;
        }
    }

    set<TValue>(key: string, value: TValue): void {
        this.storage.setItem(key, JSON.stringify(value));
    }

    remove(key: string): void {
        this.storage.removeItem(key);
    }
}

export interface StoredState<TState extends object> {
    get(): TState;
    set(state: TState): TState;
    patch(state: Partial<TState>): TState;
    remove(): void;
    reset(): TState;
    update(updater: (state: TState) => TState): TState;
}

export interface StoredStateOptions<TState extends object> {
   normalize?:(value: unknown, fallback: TState) => TState;
   store?: StoreAdapter;
}

export function createStoredState<TState extends object>(
    key: string,
    defaults: TState,
    options: StoredStateOptions<TState> = {}
): StoredState<TState> {
    const adapter = options.store ?? new LocalStore();
    const normalize = options.normalize ?? normalizeObjectState;

    const read = () : TState => normalize(adapter.get<unknown>(key, cloneState(defaults)), cloneState(defaults));
    const write = (value: TState): TState => {
        const next = normalize(value, cloneState(defaults));
        adapter.set(key,next);
        return cloneState(next);
    }
    return {
        get: read,
        set: write,
        patch(value: Partial<TState>): TState {
            const nextState = { ...read(), ...value };
            return write(nextState);
        },
        remove(): void{
            adapter.remove(key);
        },
        reset(): TState {
            return write(cloneState(defaults));
        },
        update(updater: (state: TState) => TState): TState {
            return write(updater(read()));
        }
    }
}

function normalizeObjectState<TState extends object>(value: unknown, fallback: TState): TState {
    return isPlainObject(value) ? {...fallback, ...value} : fallback;
}

function cloneState<TState>(value: TState): TState {
    return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value: unknown): value is Record<string,unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}
