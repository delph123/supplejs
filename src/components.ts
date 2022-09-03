import { h, useEffect, useState, version } from "./rwr";

function Header() {
  return h("div", undefined, [
    h("h2", undefined, ["Hello!"]),
    h("h5", undefined, ["It is ", Clock]),
  ]);
}

function Footer() {
  return h("p", { class: "read-the-docs" }, [
    `This page was created with React-Without-React v${version}`,
  ]);
}

function Clock() {
  const [counter, setCounter] = useState(10);
  useEffect(() => {
    let a = setTimeout(() => setCounter(counter + 1), 1000);
    return () => {
      clearTimeout(a);
    };
  }, [counter]);
  return new Date().toLocaleTimeString();
}

function Counter() {
  const [counter, setCounter] = useState(10);

  return h("div", { class: "card" }, [
    `Counter has value ${counter}.`,
    h(
      "button",
      {
        onclick: () => setCounter(counter + 1),
      },
      ["+"]
    ),
    h(
      "button",
      {
        onclick: () => setCounter(counter - 1),
      },
      ["-"]
    ),
  ]);
}

export function App() {
  return [Header, Counter, Footer];
}
