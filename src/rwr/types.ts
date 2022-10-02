export interface RWRElement {
    type: string;
    props: Record<string, any>;
    children: RWRNode[];
}

export type RWRNode =
    | DOMComponent
    | RWRElement
    | string
    | number
    | bigint
    | null;

export type DOMComponent = Node;

export type RWRNodeEffect = () => RWRNode;
export type RWRComponent = (props?: any) => RWRNodeEffect;
