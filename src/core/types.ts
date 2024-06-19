export type JSXHTMLElement<Props> = {
    __kind: "html_element";
    type: string;
    props: Props;
    children: SuppleChildren;
};
export type JSXSuppleElement<Props> = {
    __kind: "supple_element";
    type: SuppleComponent<Props>;
    props: Props;
    children: SuppleChildren;
};

export type JSXElement<Props> = JSXHTMLElement<Props> | JSXSuppleElement<Props>;

export interface AbstractDOMComponent {
    parent: DOMContainer;
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

export type DOMHandler = (component: DOMComponent, previousNodes?: Node[]) => void;
export type DOMContainer = DOMComponent | DOMHandler | null;

export type SuppleNode =
    | DOMComponent
    | JSXElement<any>
    | SuppleChildren
    | string
    | number
    | bigint
    | boolean
    | null;

export type SuppleNodeEffect = () => SuppleNode;
export type SuppleChild = SuppleNode | SuppleNodeEffect;
export type SuppleChildren = SuppleChild[];

export type SuppleComponent<Props> = (props: Props) => SuppleNodeEffect;

export interface Context<T> {
    id: symbol;
    Provider: (props: { value: T; children?: SuppleChildren }) => SuppleNodeEffect;
    defaultValue: T;
}

export type Accessor<T> = () => T;
export type Setter<T> = (newState: T | ((prev: T) => T)) => T;

// Transforms a tuple to a tuple of accessors in a way that allows generics
// to be inferred (from solidjs implementation)
export type AccessorArray<T> = [...Extract<{ [K in keyof T]: Accessor<T[K]> }, readonly unknown[]>];

export type ValueOrAccessor<T> = T | Accessor<T>;

export type MutableRef<T> = { current: T };
export type RefCallback<T> = (ref: T) => void;

export type Ref<T> = MutableRef<T> | RefCallback<T>;
