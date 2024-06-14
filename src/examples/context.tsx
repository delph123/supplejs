import {
    h,
    Fragment,
    createContext,
    useContext,
    createSignal,
    Dynamic,
    Show,
    Match,
    Switch,
    ValueOrAccessor,
    toValue,
} from "../core";

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
    const { count, setCount } = useContext(CounterContext);
    return () => <button onClick={() => setCount(count() + 1)}>{count}</button>;
}

function Fun() {
    const { count, setCount } = useContext(CounterContext);
    return () => (
        <Dynamic
            component={() => (count() > 9 && count() < 15 ? "div" : CounterProvider)}
            count={count() + 1}
        >
            <button onClick={() => setCount(count() + 1)}>Fun = {() => count()}</button>
            <Example />
            {() => {
                const { count: count2, setCount: setCount2 } = useContext(CounterContext);
                return <button onClick={() => setCount2(count2() + 1)}>{() => count2()}</button>;
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
                        const { count, setCount } = useContext(CounterContext);
                        return <button onClick={() => setCount(count() + 1)}>{() => count()}</button>;
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
    const [count, setCount] = createSignal(0);
    const [color, setColor] = createSignal("dodgerblue");
    return () => (
        <pre>
            <button onClick={() => setCount(count() + 1)}>{count}</button>
            <input style={{ marginLeft: "0.8em" }} value={color} onInput={(e) => setColor(e.target.value)} />
            <NumberContext.Provider value={7}>
                <div>
                    Context Value = 7 |
                    <ContextReceiver />
                    <Show when={() => count() % 2 == 0}>
                        {() => <span style={{ color: "green" }}> cond: {useContext(NumberContext)} |</span>}
                    </Show>
                    <br />
                    <NumberContext.Provider value={3}>
                        Context Value = 3 |
                        <ContextReceiver3 color={color} />
                        {() => (
                            <span style={{ color: "darkorange" }}> inl.: {useContext(NumberContext)} |</span>
                        )}
                        <Show when={() => count() % 2 == 0}>
                            {() => (
                                <span style={{ color: "green" }}> cond: {useContext(NumberContext)} |</span>
                            )}
                        </Show>
                    </NumberContext.Provider>
                    <br />
                    Context Value = 7 |
                    <ContextReceiver3 color={color} />
                    <Switch>
                        <Match when={() => count() % 3 == 0}>
                            {() => (
                                <span style={{ color: "magenta" }}> mtch: {useContext(NumberContext)} |</span>
                            )}
                        </Match>
                        <Match when={() => count() % 3 == 1}>
                            {() => <span style={{ color: "red" }}> mtc2: {useContext(NumberContext)} |</span>}
                        </Match>
                    </Switch>
                </div>
            </NumberContext.Provider>
            Outside provider{"  |"}
            <ContextReceiver />
            {() => {
                const val = useContext(NumberContext);
                return <span style={{ color: "green" }}>{() => count() % 2 == 0 && ` cond: ${val} |`}</span>;
            }}
            <Show when={() => count() % 2 == 0}>
                {() => <span style={{ color: "purple" }}> cnd2: {useContext(NumberContext)} |</span>}
            </Show>
        </pre>
    );
}

function ContextReceiver() {
    return () => (
        <font size="3">
            <label>
                <ContextReceiver2 />
            </label>
        </font>
    );
}

function ContextReceiver2() {
    return () => <ContextReceiver3 color="blue" />;
}

function ContextReceiver3({ color }: { color: ValueOrAccessor<string> }) {
    const val = useContext(NumberContext);
    return () => {
        const col = toValue(color);
        if (col === "dodgerblue") {
            return <span style={{ color: col }}> recv: {val} |</span>;
        } else {
            console.log("rerendering", col);
            return <span style={{ color: col }}> recv: {useContext(NumberContext)} |</span>;
        }
    };
}
