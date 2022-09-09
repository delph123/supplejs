export interface RWRElement {
  name: string;
  attributes: Record<string, any>;
  childNodes: RWRNode[];
}

export type RWRNode = Node | RWRElement | string | number;

export type DOMComponent = Node;

export const version = "0.2";

export function h(
  tagName: string | ((props: any) => DOMComponent),
  props?: Record<string, any>,
  ...children: RWRNode[]
) {
  if (typeof tagName === "function") {
    return tagName(props);
  } else {
    let childNodes = props?.children || children || [];
    if (!Array.isArray(childNodes) && childNodes != null) {
      childNodes = [childNodes];
    } else if (childNodes == null) {
      console.error("not an array!");
    }
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
}

export function createEffect(effect: () => void) {
  contextStack.push(effect);
  effect();
  contextStack.pop();
}

export function createMemo<T>(memo: () => T) {
  let [memoizedValue, setMemoizedValue] = createSignal<T>();
  createEffect(() => {
    setMemoizedValue(memo());
  });
  return memoizedValue;
}

export function createSignal<T>(initialValue?: T) {
  let state = initialValue;
  let untrack = false;
  const observers = [] as (() => void)[];
  const set = (newState?: T | ((s?: T) => T)) => {
    if (typeof newState === "function") {
      state = (newState as (s?: T) => T)(state);
    } else {
      state = newState;
    }
    untrack = true;
    observers.forEach((o) => o());
    untrack = false;
  };
  const get = () => {
    const currentObserver = getReactContext();
    if (!untrack && currentObserver && !observers.includes(currentObserver)) {
      observers.push(currentObserver);
    }
    return state;
  };
  return [get, set] as [() => T, (v?: T | ((s?: T) => T)) => void];
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
  if (typeof component === "string" || typeof component === "number") {
    return document.createTextNode(component.toString());
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
