export type JSXElement<Props> =
    | {
          __kind: "html_element";
          type: string;
          props: Props;
          children: SuppleChild[];
      }
    | {
          __kind: "supple_element";
          type: SuppleComponent<Props>;
          props: Props;
          children: SuppleChild[];
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
    type?: SuppleComponent<never>;
    target: DOMComponent;
    id: number;
}

export type DOMComponent = RealDOMComponent | ProxyDOMComponent | MultiDOMComponent;

export type DOMContainer =
    | Node
    | DOMComponent
    | ((component: DOMComponent, previousNodes?: Node[]) => void)
    | null;

export type SuppleNode =
    | DOMComponent
    | JSXElement<any>
    | SuppleChild[]
    | string
    | number
    | bigint
    | boolean
    | null;

export type SuppleNodeEffect = () => SuppleNode;
export type SuppleChild = SuppleNode | SuppleNodeEffect;

export type SuppleComponent<Props> = (props: Props) => SuppleNodeEffect;

export type Accessor<T> = () => T;

// Transforms a tuple to a tuple of accessors in a way that allows generics
// to be inferred (from solidjs implementation)
export type AccessorArray<T> = [...Extract<{ [K in keyof T]: Accessor<T[K]> }, readonly unknown[]>];

export type ValueOrAccessor<T> = T | Accessor<T>;

export type MutableRef<T> = { current: T };
export type RefCallback<T> = (ref: T) => void;

export type Ref<T> = MutableRef<T> | RefCallback<T>;
