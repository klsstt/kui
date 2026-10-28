const focusableSelector = [
'a[href]',
'button:not([disabled])',
'input:not([disabled]):not([type="hidden"])',
'select:not([disabled])',
'textarea:not([disabled])',
'[contenteditable="true"]',
'[tabindex]:not([tabindex="-1"])'
].join(',');

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true',
    );
}

export function trapFocus(event: KeyboardEvent, container: HTMLElement): void {
    if (event.key !== 'Tab') {
        return;
    }

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
    }

    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) {
        return;
    }

    if (event.shiftKey&&(document.activeElement === first||document.activeElement === container)) {
        event.preventDefault();
        last.focus();
    } else if(!event.shiftKey && document.activeElement === last){
        event.preventDefault();
        first.focus();
    }
}

export type RovingFocusOrientation = 'horizontal' | 'vertical' | 'both';

export interface RovingFocusOptions {
    orientation?: RovingFocusOrientation;
   loop?: boolean;
}

    export function syncRovingTabIndex(items: readonly HTMLElement[], active: HTMLElement | null): void {
        const fallback = active ?? items.find(isRovingFocusCandidate) ?? null;
        items.forEach((item) => {
            item.tabIndex = item === fallback ? 0 : -1;
        })
    }

    export function getRovingFocusTarget(
        event: KeyboardEvent,
        items: readonly HTMLElement[],
        current: HTMLElement,
        options: RovingFocusOptions={}
    ): HTMLElement | null {
        const candidates = items.filter(isRovingFocusCandidate);
        if(candidates.length === 0) {
            return null;
        }

        const orientation = options.orientation ?? 'horizontal';
        const isPrevious = event.key === 'ArrowLeft' && orientation !== 'vertical' || event.key === 'ArrowUp' && orientation !== 'horizontal';
        const isNext = event.key === 'ArrowRight' && orientation !== 'vertical' || event.key === 'ArrowDown' && orientation !== 'horizontal';
        if(!isPrevious && !isNext && event.key !== 'Home' && event.key !== 'End') {
            return null;
        }

        if(event.key === 'Home') {
            return candidates[0] ?? null;
        }

        if(event.key === 'End') {
            return candidates.at(-1) ?? null;
        }

        const currentIndex = Math.max(0, candidates.indexOf(current));
        const delta = isPrevious ? -1 : 1;
        const nextIndex = currentIndex + delta;
        if(options.loop !== false) {
            return candidates[(nextIndex + candidates.length) % candidates.length] ?? null;
        }
        return candidates[Math.min(Math.max(nextIndex, 0), candidates.length - 1)] ?? null;
    }

    function isRovingFocusCandidate(item: HTMLElement): boolean {
        return !item.hidden
        && item.getAttribute('aria-disabled') !== 'true'
        && !('disabled' in item && item.disabled === true);
    }
