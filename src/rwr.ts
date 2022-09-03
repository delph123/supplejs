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

let rerender = () => {
  console.error("This page hasn't been rendered yet.");
};

let numberOfStates = 0;
const stateSetters = [] as ((v: any) => void)[];
const stateGetters = [] as (() => any)[];

export function useState<T>(initialValue: T) {
  let stateNb = numberOfStates++;
  if (stateSetters.length < numberOfStates) {
    let state = initialValue;
    stateSetters[stateNb] = (newState: T) => {
      state = newState;
      rerender();
    };
    stateGetters[stateNb] = () => state;
  }
  return [stateGetters[stateNb](), stateSetters[stateNb]] as [
    T,
    (v: T) => void
  ];
}

export function render(
  component: RWRComponent,
  element: HTMLElement,
  top = true
): void {
  if (top) {
    numberOfStates = 0;
    rerender = () => render(component, element);
    while (element.firstChild) {
      element.firstChild.remove();
    }
  }
  if (component == null) {
    return;
  } else if (typeof component === "function") {
    render(component(), element, false);
  } else if (typeof component === "string") {
    const child = document.createTextNode(component);
    element.appendChild(child);
  } else if (typeof component === "object" && Array.isArray(component)) {
    component.forEach((rwrchild) => render(rwrchild, element, false));
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
    render(component.childNodes, child, false);
  }
}
