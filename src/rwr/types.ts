export type RWRElement<Props> =
    | {
          __kind: "html_element";
          type: string;
          props: Props;
          children: RWRChild[];
      }
    | {
          __kind: "rwr_element";
          type: RWRComponent<Props>;
          props: Props;
          children: RWRChild[];
      };

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
    type?: RWRComponent<never>;
    target: DOMComponent;
    id: number;
}

export type DOMComponent =
    | RealDOMComponent
    | ProxyDOMComponent
    | MultiDOMComponent;

export type DOMContainer =
    | Node
    | DOMComponent
    | ((component: DOMComponent, previousNodes?: Node[]) => void)
    | null;

export type RWRNode =
    | DOMComponent
    | RWRElement<any>
    | RWRChild[]
    | string
    | number
    | bigint
    | boolean
    | null;

export type RWRNodeEffect = () => RWRNode;
export type RWRChild = RWRNode | RWRNodeEffect;

export type RWRComponent<Props> = (props: Props) => RWRNodeEffect;
