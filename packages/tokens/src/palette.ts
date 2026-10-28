/**
 * 色彩系统：12 个色系 × 8 级明度。
 * 用于文档站色卡展示与业务选色参考；组件内部仍只引用语义令牌。
 */

export interface ColorRamp {
    /** 色系 id */
    id: string
    /** 中文名 */
    label: string
    /** 50 → 700 的色阶 */
    shades: Record<string, string>
}

export const colorShades = ['50', '100', '200', '300', '400', '500', '600', '700'] as const

export const colorPalette: ColorRamp[] = [
    {
        id: 'blue',
        label: '蓝色',
        shades: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
    },
    {
        id: 'indigo',
        label: '靛蓝',
        shades: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' },
    },
    {
        id: 'violet',
        label: '紫罗兰',
        shades: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9' },
    },
    {
        id: 'purple',
        label: '紫色',
        shades: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce' },
    },
    {
        id: 'pink',
        label: '粉色',
        shades: { 50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d' },
    },
    {
        id: 'red',
        label: '红色',
        shades: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
    },
    {
        id: 'orange',
        label: '橙色',
        shades: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c' },
    },
    {
        id: 'amber',
        label: '琥珀',
        shades: { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
    },
    {
        id: 'green',
        label: '绿色',
        shades: { 50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d' },
    },
    {
        id: 'teal',
        label: '青绿',
        shades: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e' },
    },
    {
        id: 'cyan',
        label: '青色',
        shades: { 50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490' },
    },
    {
        id: 'slate',
        label: '石板灰',
        shades: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155' },
    },
]
