import {
  h,
  createSignal,
  createEffect,
  onCleanup,
  RWRNodeEffect,
  For,
  RWRNode,
  untrack,
} from "../rwr";
import { Counter as CounterItem, Total } from "./components";

interface TodoItem {
  key: string;
  done: boolean;
  label: string;
}

export function Todo(): RWRNodeEffect {
  const [value, setValue] = createSignal("");
  const [list, setList] = createSignal<TodoItem[]>([]);

  return () => (
    <section>
      <Input value={value} oninput={(e) => setValue(e.target.value)} />
      <button
        onclick={() => {
          setList((l) => [
            ...l!,
            {
              key: Date.now().toString(),
              label: value(),
              done: false,
            },
          ]);
          setValue("");
        }}
      >
        Add
      </button>
      <For anchor="ul" each={list}>
        {(item: TodoItem): RWRNode => {
          console.log("item", item);
          return (
            <li>
              <CounterItem
                index={untrack(() => list().length - 1)}
                total={value}
              />
              <button
                onclick={() => {
                  console.log("delete", item);
                  setList((l) => l!.filter((it) => it.key !== item.key));
                }}
              >
                Delete
              </button>
            </li>
          );
        }}
      </For>
      <Total />
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
      <h1>{count}</h1>
      <Input value={delay} oninput={(e) => setDelay(e.target.value)} />
    </div>
  );
}
