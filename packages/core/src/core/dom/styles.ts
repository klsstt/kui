export type CssLengthValue = string | number;

export interface TabActiveRadiusOptions {
    activeRadius?: CssLengthValue;
    activeRadiusOffset?: CssLengthValue;
}

export function applyTabActiveRadiusStyles(element: HTMLElement, options: TabActiveRadiusOptions): void {
    const activeRadius = toCssLength(options.activeRadius);
    const activeRadiusOffset = toCssLength(options.activeRadiusOffset);

    if(activeRadius!== null) {
        element.style.setProperty('--kui-tab-active-radius', activeRadius);
    }

    if(activeRadiusOffset !== null) {
        element.style.setProperty('--kui-tab-active-radius-offset', activeRadiusOffset);
    }
}

function toCssLength(value: CssLengthValue | undefined): string | null {
    if (value === undefined || value === null) {
        return null;
    }

    if(typeof value === 'number'){
        return `${value}px`;
    }
    return value;
}
