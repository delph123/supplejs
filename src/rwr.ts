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

type Resource<R, P> = [
  {
    (): R | undefined;
    loading: boolean;
    error: any;
    state: "unresolved" | "pending" | "ready" | "refreshing" | "errored";
  },
  {
    mutate: (r?: R) => void;
    refetch: (p?: P) => void;
  }
];

export function createResource<R, P>(
  fetcher: (p: P) => R | Promise<R>
): Resource<R, P>;
export function createResource<R, P>(
  source: P | false | null | (() => P | false | null),
  fetcher: (p: P) => R | Promise<R>
): Resource<R, P>;
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
  let paramValue: P | null | false = null;

  const [refresh, setRefresh] = createSignal({
    refresh: false,
    value: undefined as P | null | false,
  });

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
    const refreshing = refresh();
    paramValue = refreshing.refresh
      ? refreshing.value
      : (params as () => P | false | null)();
    refreshing.refresh = false;
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

  const resource = createMemo(() => result().data);

  Object.defineProperties(resource, {
    loading: {
      get: createMemo(() => result().loading),
    },
    error: {
      get: createMemo(() => result().error),
    },
    state: {
      get: createMemo(() => result().state),
    },
  });

  return [
    resource,
    {
      mutate(r?: R) {
        setResult({
          data: r,
          loading: false,
          error: undefined,
          state: "ready",
        });
      },
      refetch(p?: P) {
        setRefresh({
          refresh: true,
          value: p ?? paramValue,
        });
      },
    },
  ];
}

export function createEffect(effect: () => void) {
  trackingContext.push(effect);
  effect();
  trackingContext.pop();
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
  let observers = new Set<TrackingContext>();
  const set = (newState?: T | ((s?: T) => T)) => {
    if (typeof newState === "function") {
      state = (newState as (s?: T) => T)(state);
    } else {
      state = newState;
    }
    const currentObservers = observers;
    observers = new Set<TrackingContext>();
    currentObservers.forEach((o) => o.active && o.execute());
  };
  const get = () => {
    const currentObserver = trackingContext.get();
    if (currentObserver) {
      currentObserver.dependencies.push({
        cleanup() {
          observers.delete(currentObserver);
        },
      });
      observers.add(currentObserver);
    }
    return state;
  };
  return [get, set] as [() => T, (v?: T | ((s?: T) => T)) => void];
}

const trackingContext = createTrackingContext();

interface Disposable {
  cleanup: () => void;
}

interface TrackingContext {
  execute: () => void;
  active: boolean;
  children: TrackingContext[];
  dependencies: Disposable[];
}

export const untrack = trackingContext.untrack;
export const getOwner = trackingContext.get;

function createTrackingContext() {
  const contextStack = [] as (TrackingContext | null)[];

  function get() {
    if (contextStack.length > 0) {
      return contextStack[contextStack.length - 1];
    } else {
      return null;
    }
  }

  function push(effect: () => void) {
    const execute = () => {
      // console.log("TrackingContext:", get());
      // console.log("Children:", context.children);
      // console.log("Deps:", context.dependencies);
      dispose(context);
      contextStack.push(context);
      effect();
      pop();
    };

    const context: TrackingContext = {
      execute,
      active: true,
      children: [],
      dependencies: [],
    };

    const parentTrackingContext = get();
    if (parentTrackingContext) {
      parentTrackingContext.children.push(context);
    }

    contextStack.push(context);
  }

  function pop() {
    contextStack.pop();
  }

  function dispose(context: TrackingContext) {
    context.children.forEach((child) => {
      // console.log("disposing of child", child);
      dispose(child);
      child.active = false;
    });
    context.dependencies.forEach((dep) => {
      dep.cleanup();
    });
    // Clear list of children & dependencies
    context.children.length = 0;
    context.dependencies.length = 0;
  }

  function untrack<T>(effect: () => T) {
    contextStack.push(null);
    const result = effect();
    pop();
    return result;
  }

  return {
    get,
    push,
    pop,
    untrack,
  };
}

export function onCleanup(cleanup: () => void) {
  const context = trackingContext.get();
  if (context) {
    context.dependencies.push({
      cleanup,
    });
  } else {
    console.error("No current tracking context!");
  }
}

export function createRenderEffect(renderEffect: () => RWRNode) {
  let node: Node;
  const replaceNode = (newNode: Node) => {
    node.parentNode?.replaceChild(newNode, node);
    node = newNode;
  };
  trackingContext.push(() => {
    replaceNode(createDOMComponent(renderEffect()));
  });
  node = createDOMComponent(renderEffect());
  trackingContext.pop();
  return node;
}

export function render(component: DOMComponent, container: HTMLElement) {
  container.appendChild(component);
}

function createDOMComponent(component: RWRNode): DOMComponent {
  if (
    typeof component === "string" ||
    typeof component === "number" ||
    typeof component === "bigint"
  ) {
    return document.createTextNode(component.toString());
  } else if (component == null) {
    return document.createComment("void");
  } else if (component instanceof Node) {
    return component;
  } else {
    const element = document.createElement(component.type);
    Object.entries(component.props).forEach(([name, value]) => {
      if (!name.startsWith("on")) {
        element.setAttribute(name, value);
      } else {
        element.addEventListener(name.substring(2), value);
      }
    });
    component.children.forEach((child) => {
      element.appendChild(createDOMComponent(child));
    });
    return element;
  }
}
