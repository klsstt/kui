export interface CookieOptions {
    domain?: string;
    expires?: Date | number;
    path?: string;
    secure?: boolean;
}

export interface CookieApi {
    (key?: string, valueOrConverter?: CookieValue | ((value: CookieValue) => CookieValue), options?: CookieOptions): CookieValue | Record<string,CookieValue> | string | undefined;
    defaults: CookieOptions;
    json?: boolean;
    raw?: boolean;
}

export type CookieValue = boolean | number | object | string | null;

export const cookie = Object.assign(cookieApi, {defaults:{} as CookieOptions}) as CookieApi;

export function removeCookie(key: string, options: CookieOptions = {}): boolean {
    cookie(key,'',{...options,expires:-1})
    return !cookie(key)
}

function cookieApi (
    key?: string,
    valueOrConverter?: CookieValue | ((value: CookieValue) => CookieValue),
    options: CookieOptions = {},
): CookieValue | Record<string, CookieValue> | string | undefined {
    if(key && arguments.length>1 && typeof valueOrConverter !== 'function') {
        const settings = {...cookie.defaults, ...options};
        let expires = settings.expires;
        if(typeof expires === 'number'){
            const date = new Date();
            date.setMilliseconds(date.getMilliseconds() + expires * 864e5);
            expires = date;
        }
        const encodedValue = stringifyCookieValue(valueOrConverter ?? '')
        const parts = [
            `${encode(key)}=${encodedValue}`,
            expires instanceof Date ? `expires=${expires.toUTCString()}`: '',
            settings.path ? `path={settings.path}`:'',
            settings.domain ? `domain=${settings.domain}`: '',
            settings.secure ? 'secure': '',
        ].filter(Boolean)
        document.cookie = parts.join('; ')
        return document.cookie
    }

    const result: Record<string, CookieValue> = {}
    const cookies = document.cookie ? document.cookie.split(';'):[]
    for (const item of cookies) {
        const [rawName, ...rest] = item.split('=')
        const name = decode(rawName.trim())
        const rawValue = rest.join('=')
        const value = read(rawValue, valueOrConverter)
        if (key === name){
            return value
        }
        if(!key && typeof value !== 'undefined'){
            result[name] = value
        }
    }
    return key ? undefined : result
}

function stringifyCookieValue(value: CookieValue):string {
    return encodeURI(cookie.json ? JSON.stringify(value) : String(value))
}

function read(rawValue: string, converter?:CookieValue | ((value: CookieValue)=>CookieValue)): CookieValue | undefined {
    const value = cookie.raw ? rawValue : parseCookieValue(rawValue);
    return typeof converter === 'function' ? converter(value ?? null) : value
}

function parseCookieValue(value:string): CookieValue | undefined {
    try{
        const decoded = decodeURIComponent(value.replace(/\+/g, ' '))
        return cookie.json ? (JSON.parse(decoded) as CookieValue) : decoded
    }catch{
        return undefined
    }
}

function encode(value: string):string{
    return cookie.raw? value: encodeURIComponent(value)
}

function decode(value: string):string{
    return cookie.raw?value:decodeURIComponent(value)
}
