import { h, version } from "./rwr";

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

export function App() {
  return [Header, Footer];
}
