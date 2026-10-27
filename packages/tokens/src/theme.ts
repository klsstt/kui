import { defaultTokens } from './default-tokens.js';
import type { DeepPartial, KuiThemeTokens, TokenValue } from './types.js'

export function mergeThemeTokens(
    base: KuiThemeTokens = defaultTokens,
    patch: DeepPartial<KuiThemeTokens> = {},
): KuiThemeTokens {
    return {
        seed: {...base.seed, ...patch.seed },
        foundation: { ...base.foundation, ...patch.foundation },
        semantic: { ...base.semantic, ...patch.semantic },
        components: { ...base.components, ...patch.components }
    }
}

export function flattenThemeTokens(tokens: KuiThemeTokens): Record<string, string> {
    return {
        ...flattenTokenGroup('seed', tokens.seed),
        ...flattenTokenGroup('', tokens.foundation),
        ...flattenTokenGroup('', tokens.semantic),
        ...flattenTokenGroup('components', tokens.components),
    }
}

export function applyThemeTokens (
    patch: DeepPartial<KuiThemeTokens>,
    target: HTMLElement = document.documentElement,
): () => void {
    const tokens = mergeThemeTokens(defaultTokens, patch)
    const flattenedTokens = flattenThemeTokens(tokens)

    Object.entries(flattenedTokens).forEach(([name, value]) => {
        target.style.setProperty(name, value)
    })

    return () => {
        Object.keys(flattenedTokens).forEach((name) => target.style.removeProperty(name))
    }
}

function flattenTokenGroup(prefix: string, tokens: object): Record<string, string> {
    return Object.fromEntries(
        Object.entries(tokens as Record<string, TokenValue>).map(([name, value]) => [
            toCssVariableName(prefix, name),
            String(value),
        ]),
    )
}

function toCssVariableName(prefix: string, tokenName: string): string {
    const kebabName = tokenName.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`).replace(/([a-zA-Z])(\d)/g, '$1-$2')
    return prefix ? `--kui-${prefix}-${kebabName}` : `--kui-${kebabName}`
}
