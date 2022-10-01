import {
  createEffect,
  createMemo,
  createSignal,
  getOwner,
  h,
  onCleanup,
  untrack,
  version,
  createChainedList,
  RWRNodeEffect,
} from "../rwr";

function Header(): RWRNodeEffect {
  return () => (
    <div>
      <h2>Hello!</h2>
      <h5>
        It is <Clock />
      </h5>
    </div>
  );
}

function Footer({ version }: { version: string }): RWRNodeEffect {
  return () => (
    <p class="read-the-docs">
      This page was created with React-Without-React v{version}
    </p>
  );
}

function Clock(): RWRNodeEffect {
  const [subscribe, notify] = createSignal();

  const timer = setInterval(() => {
    notify();
  }, 1000);

  onCleanup(() => {
    clearInterval(timer);
  });

  return () => {
    subscribe();
    return new Date().toLocaleTimeString();
  };
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

export function Counter(props: {
  index: number;
  total: () => string | number;
}): RWRNodeEffect {
  const [counter, setCounter] = createSignal(10);

  const label = () => {
    onCleanup(() =>
      console.log("Cleanup before rerendering", counter(), getOwner())
    );
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

  return () => {
    return (
      <div class="card">
        {label}
        <button onclick={() => setCounter(counter() + 1)}>+</button>
        <button onclick={() => setCounter(counter() - 1)}>-</button>
      </div>
    );
  };
}

const [sum, setSum] = createSignal(0);

export function App(): RWRNodeEffect {
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

  return () => (
    <div>
      <Header />
      {btns}
      <ChainedList />
      <p>TOTAL = {sum}</p>
      <Footer version={version} />
    </div>
  );
}

export function MultiApp(): RWRNodeEffect {
  const [ChainedList, push, pop] = createChainedList();

  return () => (
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
  );
}
