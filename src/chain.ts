import { createRenderEffect, createSignal, DOMComponent, h } from "./rwr";

interface Chain {
  current?: () => DOMComponent;
  next?: () => Chain;
  setItem?: (c: Chain) => void;
}

function getLast(chain: Chain, condition: (chain: Chain) => boolean): Chain {
  if (condition(chain)) {
    return getLast(chain.next!(), condition);
  } else {
    return chain;
  }
}

function createChainItem() {
  const itemValue: Chain = {};
  const [item, setItem] = createSignal(itemValue);
  itemValue.setItem = setItem;
  return item;
}

export function createChainedList({
  tag,
  attributes,
}: { tag?: string; attributes?: Record<string, any> } = {}) {
  const [size, setSize] = createSignal(0);

  const root = createChainItem();

  const push = (component: () => DOMComponent) => {
    const next = createChainItem();

    const last = getLast(root(), (c) => !!c.next)!;
    last.setItem?.({
      next,
      current: component,
      setItem: last.setItem,
    });

    setSize(size() + 1);
  };

  const pop = () => {
    if (size() === 0) {
      return;
    }

    const previousLast = getLast(root(), (c) => !!(c.next && c.next().next));
    previousLast.setItem?.({
      setItem: previousLast.setItem,
    });

    setSize(size() - 1);
  };

  const BoundedChainedList = () =>
    ChainedList({
      tag: tag || "div",
      attributes,
      children: root,
    });

  return [BoundedChainedList, push, pop, size] as const;
}

export function ChainedList(props: {
  tag: string;
  attributes?: Record<string, any>;
  children: () => Chain;
}): Node {
  return createRenderEffect(() => {
    if (props.children().next) {
      return h(
        props.tag,
        props.attributes,
        props.children().current!(),
        ChainedList({
          tag: props.tag,
          attributes: props.attributes,
          children: props.children().next!,
        })
      );
    } else {
      return h(props.tag, props.attributes);
    }
  });
}
