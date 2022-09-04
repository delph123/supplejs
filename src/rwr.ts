export interface RWRElement {
  name: string;
  attributes: Record<string, any>;
  childNodes: RWRNode;
}

type RWRNode = RWRNode[] | RWRElement | string | null;

export const version = "0.1";

export function h(
  tagName: string,
  props?: Record<string, any>,
  children?: RWRNode
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

export function useState<T>(initialValue: T, noRerender = false) {
  let stateNb = numberOfStates++;
  if (stateSetters.length < numberOfStates) {
    let state = initialValue;
    stateSetters[stateNb] = (newState: T) => {
      state = newState;
      noRerender || rerender();
    };
    stateGetters[stateNb] = () => state;
  }
  return [stateGetters[stateNb](), stateSetters[stateNb]] as [
    T,
    (v: T) => void
  ];
}

export function useEffect(
  effect: () => (() => void) | undefined,
  deps?: any[]
) {
  let [oldEffect, setEffect] = useState(
    {} as {
      deps?: any[];
      onUnmount?: () => void;
    },
    true
  );
  if (
    !deps ||
    !oldEffect.deps ||
    oldEffect.deps.length !== deps.length ||
    oldEffect.deps.some((d, i) => d !== deps[i])
  ) {
    if (typeof oldEffect.onUnmount === "function") {
      oldEffect.onUnmount();
    }
    const onUnmount = effect();
    setEffect({
      deps,
      onUnmount,
    });
  }
}

export function createRenderEffect(renderEffect: () => RWRNode) {
  return renderEffect();
}

function addToDom(container: HTMLElement, domComponent: DOMComponent) {
  if (domComponent == null) {
    return;
  } else if (Array.isArray(domComponent)) {
    domComponent.forEach(addToDom.bind(null, container));
  } else {
    container.appendChild(domComponent);
  }
}

export function render(component: () => RWRNode, container: HTMLElement) {
  numberOfStates = 0;
  rerender = () => render(component, container);
  while (container.firstChild) {
    container.firstChild.remove();
  }

  addToDom(container, createDOMComponent(component()));
}

type DOMComponent = Node | null | DOMComponent[];

function createDOMComponent(component: RWRNode): DOMComponent {
  if (component == null) {
    return null;
    // } else if (typeof component === "function") {
    //   renderInDom(component(), element, false);
  } else if (typeof component === "string") {
    return document.createTextNode(component);
  } else if (typeof component === "object" && Array.isArray(component)) {
    return component.map(createDOMComponent);
  } else {
    const child = document.createElement(component.name);
    Object.entries(component.attributes).forEach(([name, value]) => {
      if (!name.startsWith("on")) {
        child.setAttribute(name, value);
      } else {
        child.addEventListener(name.substring(2), value);
      }
    });
    addToDom(child, createDOMComponent(component.childNodes));
    return child;
  }
}
