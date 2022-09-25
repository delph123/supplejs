import {
  h,
  createRenderEffect,
  createSignal,
  createEffect,
  onCleanup,
  RWRNodeEffect,
} from "../rwr";

export function Todo(): RWRNodeEffect {
  const [value, setValue] = createSignal("");

  const list = createRenderEffect(() => <ul></ul>);

  return () => (
    <section>
      <Input value={value} oninput={(e) => setValue(e.target.value)} />
      <button
        onclick={() => {
          const val = value();
          list.appendChild(createRenderEffect(() => <li>{val}</li>));
          setValue("");
        }}
      >
        Add
      </button>
      {list}
    </section>
  );
}

function Input({ value, oninput }): RWRNodeEffect {
  return () => (
    <input
      id="name-input"
      value={value()}
      oninput={(e) => {
        let node: HTMLElement = e.currentTarget.parentElement;
        oninput(e);
        let input = node.querySelector("#name-input")! as HTMLInputElement;
        input.focus();
        input.value = "";
        input.value = value();
      }}
    ></input>
  );
}

export function Counter(): RWRNodeEffect {
  const [count, setCount] = createSignal(0);
  const [delay, setDelay] = createSignal(1000);
  createEffect(() => {
    const interval = setInterval(() => setCount(count() + 1), delay());
    onCleanup(() => clearInterval(interval));
  });
  return () => (
    <div>
      <h1>{createRenderEffect(() => count())}</h1>
      <Input value={delay} oninput={(e) => setDelay(e.target.value)} />
    </div>
  );
}
