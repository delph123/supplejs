import { createRenderEffect, createSignal, h, version } from "./rwr";

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
  // const [counter, setCounter] = useState(10);

  // useEffect(() => {
  //   let a = setTimeout(() => setCounter(counter + 1), 1000);
  //   return () => {
  //     clearTimeout(a);
  //   };
  // }, [counter]);

  return createRenderEffect(() => {
    return new Date().toLocaleTimeString();
  });
}

function Counter(props: { index: number; total: number }) {
  const [counter, setCounter] = createSignal(10);

  return createRenderEffect(() => {
    return h("div", { class: "card" }, [
      `Counter ${props.index + 1} / ${props.total} - with value ${counter()}.`,
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
  const [nbCounter, setNbCounter] = createSignal(0);

  return createRenderEffect(() => {
    const counters = new Array(nbCounter())
      .fill(0)
      .map((_, i) => Counter({ index: i, total: nbCounter() }));
    let btns = h("div", undefined, [
      h("button", { onclick: () => setNbCounter(nbCounter() + 1) }, [
        "Add Counter",
      ]),
      h("button", { onclick: () => setNbCounter(nbCounter() - 1) }, [
        "Remove Counter",
      ]),
    ]);
    return h("div", undefined, [Header(), btns, ...counters, Footer()]);
  });
}
