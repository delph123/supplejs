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

export const version = "0.2";

export function h(
  type: string | ((props: any) => DOMComponent),
  props?: Record<string, any>,
  ...children: RWRNode[]
) {
  let childNodes = props?.children || children || [];
  if (!Array.isArray(childNodes) && childNodes != null) {
    childNodes = [childNodes];
  } else if (childNodes == null) {
    console.error("Children should be an array!");
  }
  let attributes = props ? { ...props } : {};
  if ("children" in attributes) {
    delete attributes.children;
  }

  if (typeof type === "function") {
    return createComponent(type, attributes, children);
  } else {
    return {
      type,
      props: attributes,
      children: childNodes,
    } as RWRElement;
  }
}

function createComponent(
  Component: (props: any) => DOMComponent,
  props: Record<string, any>,
  children: RWRNode[]
) {
  return Component({ ...props, children });
}

export function render(component: DOMComponent, container: HTMLElement) {
  container.appendChild(component);
}
