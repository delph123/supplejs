import { DOMComponent, RWRNode, RWRNodeEffect } from "./rwr";

interface Disposable {
  cleanup: () => void;
}

interface TrackingContext {
  execute: () => void;
  active: boolean;
  children: TrackingContext[];
  dependencies: Disposable[];
}

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

const trackingContext = createTrackingContext();

export const untrack = trackingContext.untrack;
export const getOwner = trackingContext.get;

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

export function createRenderEffect(renderEffect: RWRNodeEffect) {
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