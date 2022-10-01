import {
  h,
  createSignal,
  createEffect,
  onCleanup,
  RWRNodeEffect,
  For,
  RWRNode,
} from "../rwr";

interface TodoItem {
  key: string;
  done: () => boolean;
  label: string;
  setDone: (b: boolean) => void;
  edit: () => boolean;
  setEdit: (b: boolean) => void;
}

function createItem(label, completed = false) {
  const [done, setDone] = createSignal(completed);
  const [edit, setEdit] = createSignal(false);

  return {
    key: Math.random().toString(),
    label,
    done,
    setDone,
    edit,
    setEdit,
  };
}

const DEFAULT_TODO_LIST = [
  createItem("react-without-react", true),
  createItem("solidjs", false),
  createItem("vue + Mobx", false),
] as TodoItem[];

export function Todo(): RWRNodeEffect {
  const [value, setValue] = createSignal("");
  const [list, setList] = createSignal(DEFAULT_TODO_LIST);

  return () => (
    <section style="text-align: left">
      <Input value={value} oninput={(e) => setValue(e.target.value)} />
      <button
        onclick={() => {
          setList((l) => [...l!, createItem(value())]);
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
              {() => (
                <input
                  type="checkbox"
                  onchange={(e) => item.setDone(e.target.checked)}
                  {...(item.done() && { checked: "checked" })}
                />
              )}
              {() =>
                !item.edit() && (
                  <span
                    style={item.done() ? "text-decoration: line-through;" : ""}
                  >
                    {item.label}
                  </span>
                )
              }
              {() =>
                item.edit() && (
                  <Input
                    value={() => item.label}
                    oninput={(e) => {
                      item.label = e.target.value;
                    }}
                  />
                )
              }
              <button
                onclick={() => {
                  setList((l) => l!.filter((it) => it.key !== item.key));
                }}
              >
                Delete
              </button>
              <button
                onclick={() => {
                  item.setEdit(!item.edit());
                }}
              >
                {() => (item.edit() ? "Update" : "Edit")}
              </button>
            </li>
          );
        }}
      </For>
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
