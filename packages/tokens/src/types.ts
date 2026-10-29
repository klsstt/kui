export type TokenValue = string | number

export interface KuiSeedTokens {
    colorBrand: string
    colorSuccess: string
    colorWarning: string
    colorDanger: string
    colorNeutral0: string
    colorNeutral50: string
    colorNeutral100: string
    colorNeutral300: string
    colorNeutral500: string
    colorNeutral700: string
    colorNeutral900: string
    radiusSm: string
    radiusMd: string
    radiusLg: string
    radiusXl: string
    shadowSm: string
    shadowMd: string
    shadowLg: string
    durationFast: string
    durationBase: string
}

export interface KuiFoundationTokens {
    fontFamilyPage: string
    fontFamilyComponent: string
    fontSizeComponentLabel: string
    fontSizeComponentControl: string
    fontSizeComponentValue: string
    fontWeightComponentLabel: number
    fontWeightComponentControl: number
    fontWeightComponentValue: number
    layerPage: number
    layerContainer: number
    layerPanel: number
    layerComponent: number
    layerDropdown: number
    layerModal: number
    layerDrawer: number
    layerToast: number
    shadowContainer: string
    shadowPanel: string
    shadowComponent: string
    shadowDropdown: string
    shadowSm: string
    shadowMd: string
    shadowLg: string
    space1: string
    space2: string
    space3: string
    space4: string
    space5: string
    space6: string
    space7: string
    space8: string
    containerMaxWidth: string
    focusRingWidth: string
    focusRingOffset: string
    motionDurationFast: string
    motionDurationBase: string
}

export interface KuiSemanticTokens {
    colorPrimary: string
    colorPrimaryHover: string
    colorSuccess: string
    colorWarning: string
    colorDanger: string
    colorInfo: string
    colorBackground: string
    colorSurface: string
    colorSurfaceMuted: string
    colorSurfaceHover: string
    colorOnPrimary: string
    colorOnSuccess: string
    colorOnWarning: string
    colorOnDanger: string
    colorOnInfo: string
    colorOnText: string
    colorText: string
    colorTextMuted: string
    colorTextSubtle: string
    colorBorder: string
    colorBorderSubtle: string
    colorFocusRing: string
    colorOverlay: string
    colorCodeSurface: string
    colorCodeText: string
}

export interface KuiComponentTokens {
    buttonHeight: string
    buttonPaddingX: string
    buttonRadius: string
    dropdownBackground: string
    dropdownBorderColor: string
    dropdownShadow: string
    collapseDuration: string
}

export interface KuiThemeTokens {
    seed: KuiSeedTokens
    foundation: KuiFoundationTokens
    semantic: KuiSemanticTokens
    components: KuiComponentTokens
}

export type DeepPartial<TValue> = {
    [TKey in keyof TValue]?: TValue[TKey] extends object ? DeepPartial<TValue[TKey]> : TValue[TKey]
}
