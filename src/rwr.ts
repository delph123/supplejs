export interface RWRElement {
  name: string;
  attributes: Record<string, any>;
  childNodes: RWRNode[];
}

type RWRNode = RWRElement | string | null;

export type RWRComponent = RWRNode | RWRComponent[] | (() => RWRComponent);

export const version = "0.1";

export function h(
  tagName: string,
  props?: Record<string, any>,
  children?: any[]
) {
  const childNodes = props?.children || children || [];
  let attributes = props || {};
  if ("children" in attributes) {
    delete attributes.children;
  }
  return {
    name: tagName,
    attributes,
    childNodes,
  } as RWRElement;
}

export function render(component: RWRComponent, element: HTMLElement): void {
  if (component == null) {
    return;
  } else if (typeof component === "function") {
    render(component(), element);
  } else if (typeof component === "string") {
    const child = document.createTextNode(component);
    element.appendChild(child);
  } else if (typeof component === "object" && Array.isArray(component)) {
    component.forEach((rwrchild) => render(rwrchild, element));
  } else {
    const child = document.createElement(component.name);
    Object.entries(component.attributes).forEach(([name, value]) => {
      if (!name.startsWith("on")) {
        child.setAttribute(name, value);
      } else {
        child.addEventListener(name.substring(2), value);
      }
    });
    element.appendChild(child);
    render(component.childNodes, child);
  }
}
