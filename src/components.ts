import { createChainedList } from "./chain";
import {
  createEffect,
  createMemo,
  createRenderEffect,
  createSignal,
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

  const label = createMemo(() => {
    return `Counter ${props.index + 1} / ${props.total()} >> ${counter()}.`;
  });

  createEffect(() => {
    console.log(label());
  });

  return createRenderEffect(() => {
    return h("div", { class: "card" }, [
      label(),
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

export function App() {
  const [ChainedList, push, pop, size] = createChainedList();

  return createRenderEffect(() => {
    const btns = h("div", undefined, [
      h(
        "button",
        {
          onclick: () => {
            push(() => Counter({ index: size(), total: size }));
          },
        },
        ["Add Counter"]
      ),
      h("button", { onclick: pop }, ["Remove Counter"]),
    ]);
    return h("div", undefined, [Header(), btns, ChainedList(), Footer()]);
  });
}

export function MultiApp() {
  return createRenderEffect(() => {
    return h("div", undefined, [App(), App()]);
  });
}
