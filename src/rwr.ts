export interface RWRElement {
  name: string;
  attributes: Record<string, any>;
  childNodes: RWRNode[];
}

export type RWRNode = Node | RWRElement | string | number | null;

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

type Resource<R> = {
  data: () => R | undefined;
  loading: () => boolean;
  error: () => any;
  state: () => "unresolved" | "pending" | "ready" | "refreshing" | "errored";
};

export function createResource<R, P>(
  fetcher: (p: P) => R | Promise<R>
): Resource<R>;
export function createResource<R, P>(
  source: P | false | null | (() => P | false | null),
  fetcher: (p: P) => R | Promise<R>
): Resource<R>;
export function createResource<R, P>(
  source:
    | P
    | false
    | null
    | (() => P | false | null)
    | ((p: P) => R | Promise<R>),
  fetcher?: (p: P) => R | Promise<R>
) {
  let params = typeof source === "function" ? source : () => source;
  let fetch = fetcher;
  if (fetcher == null) {
    params = (() => undefined) as () => P;
    fetch = source as (p: P) => R | Promise<R>;
  }

  let loaded = false;
  let previousData: R | undefined = undefined;

  const [result, setResult] = createSignal({
    data: undefined as R | undefined,
    loading: false,
    error: undefined as any,
    state: "unresolved" as
      | "unresolved"
      | "pending"
      | "ready"
      | "refreshing"
      | "errored",
  });

  createEffect(() => {
    let paramValue = (params as () => P | false | null)();
    if (paramValue !== null && paramValue !== false) {
      const r = fetch!(paramValue);
      if (r instanceof Promise) {
        setResult({
          loading: !loaded,
          data: previousData,
          error: undefined,
          state: loaded ? "refreshing" : "pending",
        });
        r.then((value) => {
          loaded = true;
          previousData = value;
          setResult({
            data: value,
            loading: false,
            error: undefined,
            state: "ready",
          });
        }).catch((error) => {
          previousData = undefined;
          setResult({
            data: undefined,
            loading: false,
            error: error,
            state: "errored",
          });
        });
      } else {
        loaded = true;
        previousData = r;
        setResult({
          data: r,
          loading: false,
          error: undefined,
          state: "ready",
        });
      }
    } else {
      setResult({
        data: undefined,
        loading: false,
        error: undefined,
        state: "unresolved",
      });
    }
  });

  return {
    data: createMemo(() => result().data),
    loading: createMemo(() => result().loading),
    error: createMemo(() => result().error),
    state: createMemo(() => result().state),
  };
}

export function createEffect(effect: () => void) {
  contextStack.push(effect);
  effect();
  contextStack.pop();
}

export function createMemo<T>(memo: () => T) {
  let [memoizedValue, setMemoizedValue] = createSignal<T>();
  let memory = Symbol() as T;
  createEffect(() => {
    const val = memo();
    if (val !== memory) {
      memory = val;
      setMemoizedValue(memory);
    }
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
  } else if (component == null) {
    return document.createComment("void");
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
