import {
    createEffect,
    createMemo,
    createSignal,
    h,
    onCleanup,
    untrack,
    version,
    createChainedList,
    SuppleNodeEffect,
    onMount,
} from "../core";
import { createLogger } from "../core/helper";

function Header(): SuppleNodeEffect {
    return () => (
        <div>
            <h2>Hello!</h2>
            <h5>
                It is <Clock level={0} />
            </h5>
        </div>
    );
}

function Footer({ version }: { version: string }): SuppleNodeEffect {
    return () => <p class="read-the-docs">This page was created with SuppleJS v{version}</p>;
}

const clockLogger = createLogger("clock");

export function Clock({
    level,
    probability = 0.5,
    clock,
}: {
    level: number;
    probability?: number;
    clock?: () => number;
}): SuppleNodeEffect {
    let notif: () => boolean;

    if (clock) {
        notif = () => {
            clock();
            return Math.random() > probability;
        };
    } else {
        const [c, setC] = createSignal(Math.random() > probability, {
            equals: false,
        });

        clockLogger.log("Initializing clock with probability", probability);

        const timer = setInterval(() => setC(Math.random() > probability), 1000);

        onMount(() => {
            clockLogger.log("Mounting clock with probability", probability);
        });

        onCleanup(() => {
            clockLogger.log("Cleaning clock with probability", probability);
            clearInterval(timer);
        });

        notif = c;
    }

    return () => {
        return notif() ? (
            <Clock level={level + 1} probability={probability} clock={clock} />
        ) : (
            `${new Date().toLocaleTimeString()} (${level})`
        );
    };
}

function withPrevious<T>(variable: () => T, initialValue: T) {
    return createMemo(
        (prev) => ({
            current: variable(),
            previous: prev.current,
        }),
        {
            current: initialValue,
            previous: undefined as T,
        },
    );
}

export function Counter(props: { index: number; total: () => string | number }): SuppleNodeEffect {
    const [counter, setCounter] = createSignal(10);

    const label = () => {
        return `Counter ${props.index} / ${props.total()} >> ${counter()}.`;
    };

    const counterMemo = withPrevious(counter, 0);

    createEffect(() => {
        setSum((s) => s + counterMemo().current - counterMemo().previous);
    });

    onCleanup(() => {
        console.log("Disposing of Counter", props.index, "!");
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

export function Total() {
    return () => <p>TOTAL = {sum}</p>;
}

export function App(): SuppleNodeEffect {
    const [ChainedList, push, pop, size] = createChainedList({
        tag: "div",
        attributes: {
            style: () => ({
                color: "red",
                border: `8px solid #${Math.ceil(Math.random() * 3) * 2 + 3}${
                    Math.ceil(Math.random() * 3) * 2 + 3
                }${Math.ceil(Math.random() * 3) * 2 + 3}`,
            }),
        },
    });

    const btns = (
        <div>
            <button onclick={() => push(<Counter index={untrack(() => size() + 1)} total={size} />)}>
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
            <Total />
            <Footer version={version} />
        </div>
    );
}

export function MultiApp(): SuppleNodeEffect {
    const [ChainedList, push, pop] = createChainedList();

    return () => (
        <div>
            <ChainedList />
            <button onclick={() => push(<App />)}>+</button>
            <button onclick={pop}>-</button>
        </div>
    );
}

export function GoodBye({ onexit }): SuppleNodeEffect {
    let n = 0;
    const [c, setC] = createSignal(false);
    setInterval(() => setC((c) => !c), 2000);
    return () => {
        n = n + 1;
        return c() ? (
            <div>
                Hello {n}!<button onclick={onexit}>GoodBye!</button>
            </div>
        ) : (
            <Clock level={0} />
        );
    };
}
