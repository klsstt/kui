import { defaultTokens } from "./default-tokens.js";
import { colorPalette } from "./palette.js";
import { flattenThemeTokens, mergeThemeTokens } from "./theme.js";
import type { KuiThemeTokens } from "./types.js";

export type AppearanceMode = 'light' | 'dark'

function mix(base: string, tint: string, amount: number): string {
    const channel = (hex: string, index: number): number => parseInt(hex.slice(index, index + 2), 16)
    return `#${[1, 3, 5].map((index) => Math.round(channel(base, index) * (1 - amount) + channel(tint, index) * amount).toString(16).padStart(2, '0')).join('')}`
}

export function getAppearanceTokens(theme: string, mode: AppearanceMode): KuiThemeTokens {
    const ramp = colorPalette.find((candidate) => candidate.id === theme) ?? colorPalette[0]
    const dark = mode === 'dark'
    const primary = dark ? ramp.shades['300'] : mix(ramp.shades['700'], '#000000', 0.1)
    const foreground = dark ? '#0b1220' : '#ffffff'
    const seed = defaultTokens.seed
    return mergeThemeTokens(defaultTokens, {
        seed: {
            colorBrand: primary,
            colorSuccess: dark ? '#86efac' : seed.colorSuccess,
            colorWarning: dark ? '#fcd34d' : seed.colorWarning,
            colorDanger: dark ? '#fca5a5' : seed.colorDanger,
            colorNeutral0: mix(dark ? '#111b2c' : '#ffffff', primary, 0.015),
            colorNeutral50: mix(dark ? '#080e19' : '#f7f9fc', primary, 0.025),
            colorNeutral100: mix(dark ? '#172233' : '#eef2f7', primary, 0.035),
            colorNeutral300: mix(dark ? '#64748b' : '#cfd8e3', primary, 0.004),
            colorNeutral500: dark ? '#a4b4ca' : seed.colorNeutral500,
            colorNeutral700: dark ? '#c9d5e4' : seed.colorNeutral700,
            colorNeutral900: dark ? '#f4f8ff' : seed.colorNeutral900,
            shadowSm: dark ? '0 2px 8px rgba(0, 0, 0, 0.28)' : seed.shadowSm,
            shadowMd: dark ? '0 8px 24px rgba(0, 0, 0, 0.32)' : seed.shadowMd,
            shadowLg: dark ? '0 16px 40px rgba(0, 0, 0, 0.4)' : seed.shadowLg,
        },
        foundation: {
            shadowContainer: dark ? '0 1px 2px rgba(0, 0, 0, 0.2)' : defaultTokens.foundation.shadowContainer,
            shadowComponent: dark ? '0 1px 2px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)' : defaultTokens.foundation.shadowComponent,
        },
        semantic: {
            colorPrimaryHover: dark ? ramp.shades['200'] : mix(primary, '#000000', 0.12),
            colorInfo: dark ? '#67e8f9' : '#0e7490',
            colorSurfaceHover: mix(dark ? '#243247' : '#f1f5f9', primary, 0.04),
            colorOnPrimary: foreground,
            colorOnSuccess: foreground,
            colorOnWarning: foreground,
            colorOnDanger: foreground,
            colorOnInfo: foreground,
            colorOnText: foreground,
            colorBorderSubtle: mix(dark ? '#344155' : '#e6ecf3', primary, 0.04),
            colorFocusRing: `color-mix(in srgb, ${primary} 55%, transparent)`,
            colorOverlay: dark ? 'rgba(3, 7, 14, 0.72)' : defaultTokens.semantic.colorOverlay,
            colorCodeSurface: dark ? '#020617' : defaultTokens.semantic.colorCodeSurface,
        },
    })
}

export function createAppearanceCss(): string {
    const declarations = (tokens: KuiThemeTokens, all = false): string => Object.entries(flattenThemeTokens(tokens))
        .filter(([name]) => all || /--kui-(?:color-|seed-color-|seed-shadow-|shadow-|component-)/.test(name))
        .map(([name, value]) => `${name}:${value};`).join('')
    const rule = (selector: string, theme: string, mode: AppearanceMode): string => `${selector}{color-scheme:${mode};${declarations(getAppearanceTokens(theme, mode))}}`
    return `@layer kui.tokens{\n:root{color-scheme:light;${declarations(defaultTokens, true)}}\n${[
        rule('[data-kui--mode="light"]', 'blue', 'light'),
        rule('[data-kui-mode="dark"]', 'blue', 'dark'),
        ...colorPalette.flatMap(({ id }) => [
            rule(`[data-kui-theme="${id}"]`, id, 'light'),
            rule(`[data-kui-theme="${id}"][data-kui-mode="dark"]`, id, 'dark'),
        ]),
        rule('[data-kui-theme="dark"]:not([data-kui-mode="light"])', 'blue', 'dark'),
    ].join('\n')}\n}\n`
}
