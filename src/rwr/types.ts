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
