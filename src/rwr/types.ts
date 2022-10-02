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

export interface ProxyDOMComponent {
    __kind: "render_effect";
    getNode: () => Node;
    mount: (parent: HTMLElement) => void;
}

export type DOMComponent = RealDOMComponent | ProxyDOMComponent;

export type RWRNode =
    | DOMComponent
    | RWRElement
    | string
    | number
    | bigint
    | null;

export type RWRNodeEffect = () => RWRNode;
export type RWRComponent = (props?: any) => RWRNodeEffect;
