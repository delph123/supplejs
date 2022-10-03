export interface RWRElement {
    __kind: "element";
    type: string;
    props: Record<string, any>;
    children: RWRNode[];
}

export interface RealDOMComponent {
    __kind: "dom_component";
    node: Node;
}

export interface MultiDOMComponent {
    __kind: "multi_components";
    components: DOMComponent[];
    getNodes: () => Node[];
}

export interface ProxyDOMComponent {
    __kind: "render_effect";
    getNodes: () => Node[];
    mount: (parent: HTMLElement) => void;
}

export type DOMComponent =
    | RealDOMComponent
    | ProxyDOMComponent
    | MultiDOMComponent;

export type RWRNode =
    | DOMComponent
    | RWRElement
    | RWRNode[]
    | string
    | number
    | bigint
    | null;

export type RWRNodeEffect = () => RWRNode;
export type RWRComponent = (props?: any) => RWRNodeEffect;

/**
 * Nested type
 */
export type Nested<T> = T[] | Nested<T>[];

/**
 * Flatten childrens (developers may return an array containing nested arrays
 * and expect them to be flatten out in the rendering phase).
 */
export function flatten<T>(nestedChildren: Nested<T>) {
    const children: T[] = [];
    for (const c of nestedChildren) {
        if (Array.isArray(c)) {
            children.push(...flatten(c));
        } else {
            children.push(c);
        }
    }
    return children;
}
