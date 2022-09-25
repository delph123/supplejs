import {
  createEffect,
  createMemo,
  createRenderEffect,
  createSignal,
  getOwner,
  h,
  onCleanup,
  untrack,
  version,
  createChainedList,
} from "../rwr";

function Header() {
  return createRenderEffect(() => (
    <div>
      <h2>Hello!</h2>
      <h5>
        It is <Clock />
      </h5>
    </div>
  ));
}

function Footer({ version }: { version: string }) {
  return createRenderEffect(() => (
    <p class="read-the-docs">
      This page was created with React-Without-React v{version}
    </p>
  ));
}

function Clock() {
  const [subscribe, notify] = createSignal();

  const timer = setInterval(() => {
    notify();
  }, 1000);

  onCleanup(() => {
    clearInterval(timer);
  });

  return createRenderEffect(() => {
    subscribe();
    return new Date().toLocaleTimeString();
  });
}

function withPrevious<T>(variable: () => T, initialValue: T) {
  let current = initialValue;
  return createMemo(() => {
    const previous = current;
    current = variable();
    return {
      current,
      previous,
    };
  });
}

function Counter(props: { index: number; total: () => number }) {
  const [counter, setCounter] = createSignal(10);

  const label = () => {
    return `Counter ${props.index + 1} / ${props.total()} >> ${counter()}.`;
  };

  const counterMemo = withPrevious(counter, 0);

  createEffect(() => {
    setSum((s) => s! + counterMemo().current - counterMemo().previous);
  });

  onCleanup(() => {
    console.log("Disposing of Counter!", counter());
    setSum(sum() - counter());
  });

  return createRenderEffect(() => {
    onCleanup(() =>
      console.log("Cleanup before rerendering", counter(), getOwner())
    );
    return (
      <div class="card">
        {label()}
        <button onclick={() => setCounter(counter() + 1)}>+</button>
        <button onclick={() => setCounter(counter() - 1)}>-</button>
      </div>
    );
  });
}

const [sum, setSum] = createSignal(0);

function Total() {
  return createRenderEffect(() => <p>TOTAL = {sum()}</p>);
}

export function App() {
  const [ChainedList, push, pop, size] = createChainedList();

  const btns = (
    <div>
      <button
        onclick={() => {
          push(() => <Counter index={untrack(() => size())} total={size} />);
        }}
      >
        Add Counter
      </button>
      <button onclick={pop}>Remove Counter</button>
    </div>
  );

  return createRenderEffect(() => {
    return (
      <div>
        <Header />
        {btns}
        <ChainedList />
        <Total />
        <Footer version={version} />
      </div>
    );
  });
}

export function MultiApp() {
  const [ChainedList, push, pop] = createChainedList();

  return createRenderEffect(() => (
    <div>
      <ChainedList />
      <button
        onclick={() => {
          push(() => <App />);
        }}
      >
        +
      </button>
      <button onclick={pop}>-</button>
    </div>
  ));
}
