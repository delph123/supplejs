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
    __kind: "proxy_component";
    type?: RWRComponent;
    getNodes: () => Node[];
    mount: (
        parent:
            | HTMLElement
            | ((component: DOMComponent, previousNodes?: Node[]) => void)
    ) => void;
    target: DOMComponent;
}

export type DOMComponent =
    | RealDOMComponent
    | ProxyDOMComponent
    | MultiDOMComponent;

export type RWRNode =
    | DOMComponent
    | RWRElement
    | RWRChild[]
    | string
    | number
    | bigint
    | boolean
    | null;

export type RWRNodeEffect = () => RWRNode;
export type RWRChild = RWRNode | RWRNodeEffect;

export type RWRComponent = (props?: any) => RWRNodeEffect;
