export type JSXHTMLElement<Props> = {
    __kind: "html_element";
    type: string;
    props: Props;
    children: SuppleChild[];
};
export type JSXSuppleElement<Props> = {
    __kind: "supple_element";
    type: SuppleComponent<Props>;
    props: Props;
    children: SuppleChild[];
};

export type JSXElement<Props> = JSXHTMLElement<Props> | JSXSuppleElement<Props>;

export interface AbstractDOMComponent {
    parent: DOMContainer;
    mount: (parent: DOMContainer, oldParent: DOMContainer) => void;
    nodes: () => Node[];
    notifyContextMounted?: () => void;
    contextValue?: unknown;
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

export interface Context<T> {
    id: symbol;
    Provider: (props: { value: T; children?: SuppleChild[] }) => SuppleNodeEffect;
    defaultValue: T;
    // internal methods
    _onMount: (listener: () => void) => void;
    _onCleanup: (listener: () => void) => void;
}

export type Accessor<T> = () => T;

// Transforms a tuple to a tuple of accessors in a way that allows generics
// to be inferred (from solidjs implementation)
export type AccessorArray<T> = [...Extract<{ [K in keyof T]: Accessor<T[K]> }, readonly unknown[]>];

export type ValueOrAccessor<T> = T | Accessor<T>;

export type MutableRef<T> = { current: T };
export type RefCallback<T> = (ref: T) => void;

export type Ref<T> = MutableRef<T> | RefCallback<T>;
