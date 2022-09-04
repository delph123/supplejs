export interface RWRElement {
  name: string;
  attributes: Record<string, any>;
  childNodes: RWRNode[];
}

type RWRNode = Node | RWRElement | string;

type DOMComponent = Node;

export const version = "0.2";

export function h(
  tagName: string,
  props?: Record<string, any>,
  children?: RWRNode[]
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

export function createEffect(effect: () => void) {
  contextStack.push(effect);
  effect();
  contextStack.pop();
}

export function createSignal<T>(initialValue?: T) {
  let state = initialValue;
  const observers = [] as (() => void)[];
  const set = (newState?: T) => {
    state = newState;
    observers.forEach((o) => o());
  };
  const get = () => {
    const currentObserver = getReactContext();
    if (currentObserver && !observers.includes(currentObserver)) {
      observers.push(currentObserver);
    }
    return state;
  };
  return [get, set] as [() => T, (v?: T) => void];
}

const contextStack = [] as (() => void)[];

function getReactContext() {
  if (contextStack.length > 0) {
    return contextStack[contextStack.length - 1];
  } else {
    return null;
  }
}

export function createRenderEffect(renderEffect: () => RWRNode) {
  let node: Node;
  const replaceNode = (newNode: Node) => {
    node.parentNode?.replaceChild(newNode, node);
    node = newNode;
  };
  contextStack.push(() => {
    replaceNode(createDOMComponent(renderEffect()));
  });
  node = createDOMComponent(renderEffect());
  contextStack.pop();
  return node;
}

export function render(component: DOMComponent, container: HTMLElement) {
  container.appendChild(component);
}

function createDOMComponent(component: RWRNode): DOMComponent {
  if (typeof component === "string") {
    return document.createTextNode(component);
  } else if (component instanceof Node) {
    return component;
  } else {
    const element = document.createElement(component.name);
    Object.entries(component.attributes).forEach(([name, value]) => {
      if (!name.startsWith("on")) {
        element.setAttribute(name, value);
      } else {
        element.addEventListener(name.substring(2), value);
      }
    });
    component.childNodes.forEach((child) => {
      element.appendChild(createDOMComponent(child));
    });
    return element;
  }
}
