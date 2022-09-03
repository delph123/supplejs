import { h, useState, version } from "./rwr";

function Header() {
  return h("div", undefined, [
    h("h2", undefined, ["Hello!"]),
    h("h5", undefined, ["This is", " ", "a cool subtitle."]),
  ]);
}

function Footer() {
  return h("p", { class: "read-the-docs" }, [
    `This page was created with React-Without-React v${version}`,
  ]);
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
  return [Header, Counter, Counter, Footer];
}
