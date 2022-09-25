import { createRenderEffect } from "./reactivity";

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

export const version = "0.2";

export function h(
  type: string | RWRComponent,
  props?: Record<string, any>,
  ...children: (RWRNode | RWRNodeEffect)[]
): RWRNode {
  let altChildren: (RWRNode | RWRNodeEffect)[] =
    props?.children || children || [];
  if (!Array.isArray(altChildren) && altChildren != null) {
    altChildren = [altChildren];
  } else if (altChildren == null) {
    console.error("Children should be an array!");
  }

  const childNodes = altChildren.map((c) => {
    if (typeof c === "function") {
      return createRenderEffect(c);
    } else {
      return c;
    }
  });

  let attributes = props ? { ...props } : {};
  if ("children" in attributes) {
    delete attributes.children;
  }

  if (typeof type === "function") {
    return createComponent(type, attributes, childNodes);
  } else {
    return {
      type,
      props: attributes,
      children: childNodes,
    } as RWRElement;
  }
}

export function Fragment() {
  // TODO
}

function createComponent(
  Component: RWRComponent,
  props: Record<string, any>,
  children: RWRNode[]
) {
  return createRenderEffect(Component({ ...props, children }));
}

export function createRoot() {
  // TODO
}

export function render(renderEffect: RWRNodeEffect, container: HTMLElement) {
  const node = createRenderEffect(renderEffect);
  container.appendChild(node);
}
