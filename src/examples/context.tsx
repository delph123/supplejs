import { h, Fragment, createContext, useContext, createSignal, Dynamic } from "../core";

const [defaultCount, setDefaultCount] = createSignal(0);

const CounterContext = createContext<{ count: () => number; setCount: (x: number) => void }>({
    count: defaultCount,
    setCount: setDefaultCount,
});

function CounterProvider(props: { count?: number; children?: any }) {
    const [count, setCount] = createSignal(props.count ?? 0);
    return () => (
        <CounterContext.Provider value={{ count, setCount }}>{props.children}</CounterContext.Provider>
    );
}

function Example() {
    const counter = useContext(CounterContext);
    return () => <button onClick={() => counter().setCount(counter().count() + 1)}>{counter().count}</button>;
}

function Fun() {
    const counter = useContext(CounterContext);
    return () => (
        <Dynamic
            component={() => (counter().count() > 9 && counter().count() < 15 ? "div" : CounterProvider)}
            count={counter().count() + 1}
        >
            <button onClick={() => counter().setCount(counter().count() + 1)}>
                Fun = {() => counter().count()}
            </button>
            <Example />
            {() => {
                const counter2 = useContext(CounterContext);
                return (
                    <button onClick={() => counter2().setCount(counter2().count() + 1)}>
                        {() => counter2().count()}
                    </button>
                );
            }}
        </Dynamic>
    );
}

export function MultiContextApp() {
    const [count, setCount] = createSignal(3);
    const [count2, setCount2] = createSignal(4);
    return () => (
        <>
            <div>
                <CounterProvider count={12}>
                    <Example />
                </CounterProvider>
            </div>
            <div>
                <Example />
            </div>
            <div>
                <CounterContext.Provider value={{ count, setCount }}>
                    {() => {
                        const counter = useContext(CounterContext);
                        return (
                            <button onClick={() => counter().setCount(counter().count() + 1)}>
                                {() => counter().count()}
                            </button>
                        );
                    }}
                </CounterContext.Provider>
            </div>
            <div>
                <CounterProvider count={33}>
                    <CounterContext.Provider value={{ count: count2, setCount: setCount2 }}>
                        <Example />
                    </CounterContext.Provider>
                </CounterProvider>
            </div>
            <div>
                <CounterProvider count={7}>
                    <Fun />
                </CounterProvider>
            </div>
            <Fun />
        </>
    );
}

const NumberContext = createContext(0);

export function ContextPassingApp() {
    return () => (
        <div>
            <NumberContext.Provider value={11}>
                <div>
                    <ContextReceiver />
                    <NumberContext.Provider value={13}>
                        <ContextReceiver />
                        {() => {
                            const ctx = useContext(NumberContext);
                            return (
                                <>
                                    {" "}
                                    - <span>Also: {ctx}</span>
                                </>
                            );
                        }}
                    </NumberContext.Provider>
                </div>
            </NumberContext.Provider>
            <ContextReceiver />
        </div>
    );
}

function ContextReceiver() {
    const ctx = useContext(NumberContext);
    return () => <span> [{ctx}] </span>;
}
