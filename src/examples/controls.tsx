import { h, Fragment, Show, createSignal, Switch, Match, For } from "../rwr";
import { Clock } from "./components";
import { CounterButton } from "./effects";

export function TestWhen() {
    const [content, setContent] = createSignal<any>();
    setTimeout(() => setContent("Now you can show"), 2000);
    setTimeout(() => setContent("Too late to show"), 4000);
    return () => (
        <p>
            <Show
                when={content}
                fallback={<font color="blue">Will soon show</font>}
            >
                {(v) => (
                    <span>
                        <font color="blue">{v}</font>
                    </span>
                )}
            </Show>{" "}
            me the money!
            <br />
            <Show
                when={false}
                fallback={<font color="magenta">Direct to fallback.</font>}
            >
                <p style="color: magenta;">
                    Error - This shouldn't be displayed
                </p>
            </Show>
            <br />
            <Show
                when={() => content() == null}
                fallback={<font color="green">HIDDEN NOW</font>}
            >
                Will disappear in{" "}
                <span style="font-weight: bold; color: green;">2 seconds</span>!
            </Show>
            <Show
                when={true}
                fallback={<div>Error - This should not be displayed</div>}
            >
                <div>Before</div>
                {content}
                {" me the money"}
                <div>After</div>
            </Show>
        </p>
    );
}

export function WhenAppWithSignal() {
    const [first, setFirst] = createSignal<any>(true);
    const [second, setSecond] = createSignal<any>(false);
    return () => (
        <>
            <Show when={first}>
                <CounterButton nb={5} onexit={() => 0} />
            </Show>
            <Show when={second}>
                <Clock level={0} />
            </Show>
            <div>
                <button type="button" onclick={() => setFirst((s) => !s)}>
                    Display First
                </button>
                <button type="button" onclick={() => setSecond((s) => !s)}>
                    Display Second
                </button>
            </div>
        </>
    );
}

export function TestSwitch() {
    const [content, setContent] = createSignal<any>();
    setTimeout(() => setContent("Now you can show"), 2000);
    return () => (
        <Switch fallback={<div>fb</div>}>
            <Match when={() => !content()}>
                <div>hello</div>
            </Match>
            <Match when={() => content()}>
                <div>you!</div>
            </Match>
        </Switch>
    );
}

function Proxy({ x, children }: { x; children? }) {
    return () => (
        <>
            <Match when={() => x() == 7}>
                <p>{x} is 7</p>
            </Match>
            {children}
            <div>
                <Match when={() => x() == 6}>
                    <p>{x} is 6</p>
                </Match>
            </div>
        </>
    );
}

export function SwitchApp() {
    const [forNums, setForNums] = createSignal([11, 12, 13]);
    const [x, setX] = createSignal(14);

    setTimeout(() => setForNums([11, 12, 13, 14]), 2000);
    setTimeout(() => setX(13), 3000);
    setTimeout(() => setForNums([11, 14]), 4000);

    return () => (
        <div style="border: 1px solid grey;">
            <Switch fallback={<font>{x} is between 5 and 15</font>}>
                dsgfjl
                <Proxy x={x}>
                    <Match when={() => x() > 15}>
                        <p>{x} is greater than 15</p>
                    </Match>
                </Proxy>
                {12}
                <Match when={() => x() < 5}>
                    <p>{x} is less than 5</p>
                </Match>
                <For each={forNums}>
                    {(el) => (
                        <Match when={() => x() == el}>
                            <span>
                                {x} is {el}
                            </span>
                        </Match>
                    )}
                </For>
                {[
                    // <Match when={() => x() == 9}>
                    //     <p>{x} is 9</p>
                    // </Match>,
                    "ABC",
                ]}
                <>
                    <Match when={() => x() == 10}>
                        <p>{x} is 10</p>
                    </Match>
                </>
                {true}
                {() => {
                    console.warn("rerendering");
                    if (forNums().length != 2) {
                        return (
                            <Match when={() => x() == 13}>
                                <p>{x} is 8</p>
                            </Match>
                        );
                    } else {
                        return (
                            <>
                                <Match when={() => x() == 8}>
                                    <p>{x} is 8</p>
                                </Match>
                                <Match when={() => x() == 9}>
                                    <p>{x} is 9.5</p>
                                </Match>
                            </>
                        );
                    }
                }}
            </Switch>
        </div>
    );
}
