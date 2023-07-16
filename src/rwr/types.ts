export interface RWRElement {
    __kind: "element";
    type: string;
    props: Record<string, any>;
    children: RWRNode[];
}

export interface AbstractDOMComponent {
    parent: DOMContainer;
    mount: (parent: DOMContainer, oldParent: DOMContainer) => void;
    nodes: () => Node[];
}

export interface RealDOMComponent extends AbstractDOMComponent {
    __kind: "dom_component";
    node: Node;
}

export interface MultiDOMComponent extends AbstractDOMComponent {
    __kind: "multi_components";
    components: DOMComponent[];
}

export interface ProxyDOMComponent extends AbstractDOMComponent {
    __kind: "proxy_component";
    type?: RWRComponent;
    target: DOMComponent;
    id: number;
}

export type DOMComponent =
    | RealDOMComponent
    | ProxyDOMComponent
    | MultiDOMComponent;

export type DOMContainer =
    | HTMLElement
    | DOMComponent
    | ((component: DOMComponent, previousNodes?: Node[]) => void)
    | null;

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
