export interface DataApiDefinition {
    name: string;
    selector: string;
    init(element: HTMLElement): void;
}

const definitions = new Map<string, DataApiDefinition>();

export function registerDataApi(definition: DataApiDefinition): void {
    definitions.set(definition.name, definition);
}

export function initDataApi(root: ParentNode = document): void {
    definitions.forEach((definition) => {
        root.querySelectorAll<HTMLElement>(definition.selector).forEach((element) => {
            definition.init(element);
        });
    });
}

export function getRegisteredDataApis(): DataApiDefinition[] {
    return [...definitions.values()];
}
