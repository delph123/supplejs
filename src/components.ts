import {
  createEffect,
  createRenderEffect,
  createSignal,
  DOMComponent,
  h,
  version,
} from "./rwr";

function Header() {
  return createRenderEffect(() => {
    return h("div", undefined, [
      h("h2", undefined, ["Hello!"]),
      h("h5", undefined, ["It is ", Clock()]),
    ]);
  });
}

function Footer() {
  return createRenderEffect(() => {
    return h("p", { class: "read-the-docs" }, [
      `This page was created with React-Without-React v${version}`,
    ]);
  });
}

function Clock() {
  const [subscribe, notify] = createSignal();

  setInterval(() => {
    notify();
  }, 1000);

  return createRenderEffect(() => {
    subscribe();
    return new Date().toLocaleTimeString();
  });
}

function Counter(props: { index: number; total: () => number }) {
  const [counter, setCounter] = createSignal(10);

  createEffect(() => {
    console.log(
      `Counter ${props.index + 1} / ${props.total()} changed to ${counter()}.`
    );
  });

  return createRenderEffect(() => {
    return h("div", { class: "card" }, [
      `Counter ${
        props.index + 1
      } / ${props.total()} - with value ${counter()}.`,
      h(
        "button",
        {
          onclick: () => setCounter(counter() + 1),
        },
        ["+"]
      ),
      h(
        "button",
        {
          onclick: () => setCounter(counter() - 1),
        },
        ["-"]
      ),
    ]);
  });
}

function ChainedList(props: {
  tag: string;
  attributes?: Record<string, any>;
  component: () => DOMComponent;
  children: () => Chain;
}): Node {
  return createRenderEffect(() => {
    if (props.children().next) {
      return h(props.tag, props.attributes, [
        props.component(),
        ChainedList({
          tag: props.tag,
          attributes: props.attributes,
          component: props.component,
          children: props.children().next!,
        }),
      ]);
    } else {
      return h(props.tag, props.attributes, []);
    }
  });
}

interface Chain {
  next?: () => Chain;
  setNext?: (c: Chain) => void;
}

function getLast(chain: Chain): Chain {
  if (chain.next) {
    return getLast(chain.next());
  } else {
    return chain;
  }
}

function getPreviousLast(chain: Chain): Chain {
  if (chain.next && chain.next().next) {
    return getPreviousLast(chain.next());
  } else {
    return chain;
  }
}

function counter(chain: () => Chain): () => number {
  function count(chain: () => Chain): number {
    if (chain().next) {
      return count(chain().next!) + 1;
    } else {
      return 0;
    }
  }
  return count.bind(null, chain);
}

export function App() {
  const [total, setTotal] = createSignal(0);
  const [root, setRoot] = createSignal<Chain>({});
  root().setNext = setRoot;

  const addCounter = () => {
    let [next, setNext] = createSignal<Chain>({});
    next().setNext = setNext;
    let last = getLast(root());
    last.setNext?.({
      next,
      setNext: last.setNext,
    });
    setTotal(total() + 1);
  };

  const removeCounter = () => {
    let previousLast = getPreviousLast(root());
    previousLast.setNext?.({
      setNext: previousLast.setNext,
    });
    setTotal(total() - 1);
  };

  return createRenderEffect(() => {
    const counters = ChainedList({
      tag: "div",
      component: () => Counter({ index: total(), total }),
      children: root,
    });
    const btns = h("div", undefined, [
      h("button", { onclick: addCounter }, ["Add Counter"]),
      h("button", { onclick: removeCounter }, ["Remove Counter"]),
    ]);
    return h("div", undefined, [Header(), btns, counters, Footer()]);
  });
}
