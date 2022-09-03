import { version } from "./rwr";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<h1>Hello!</h1>
<p>This is a cool subtitle.</p>
<div class="card">
  Counter value is 1.
  <button>+</button>
  <button>-</button>
</div>
<p class="read-the-docs">
  This page was created with React-Without-React v${version}
</p>
`;

export function setupCounter(element: HTMLButtonElement) {
  let counter = 0;
  const setCounter = (count: number) => {
    counter = count;
    element.innerHTML = `count is ${counter}`;
  };
  element.addEventListener("click", () => setCounter(++counter));
  setCounter(0);
}
