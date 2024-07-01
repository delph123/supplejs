import {
    h,
    Fragment,
    Show,
    createSignal,
    Switch,
    Match,
    For,
    onCleanup,
    onMount,
    Portal,
    toArray,
    ForProps,
    Accessor,
    SuppleNode,
} from "../core";
import { Clock } from "./components";
import { CounterButton } from "./effects";

export function TestWhen() {
    const [content, setContent] = createSignal<any>();
    setTimeout(() => setContent("Now you can show"), 2000);
    setTimeout(() => setContent("Too late to show"), 4000);

    return () => (
        <p>
            Keyed:{" "}
            <Show when={content} keyed fallback={<font color="blue">Will soon show</font>}>
                {(v) => (
                    <span>
                        <font color="blue">{v}</font>
                    </span>
                )}
            </Show>{" "}
            me the money!
            <br />
            Non keyed:{" "}
            <Show when={content} fallback={<font color="blue">Will soon show</font>}>
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
                fallback={
                    <Show when={content} fallback={<div style={{ color: "magenta" }}>fall-fall-back</div>}>
                        {() => <div style={{ color: "magenta" }}>{"Fallback: " + content()}</div>}
                    </Show>
                }
            >
                <p style={{ color: "magenta" }}>Error - This shouldn't be displayed</p>
            </Show>
            <Show when={() => content() == null} fallback={<font color="green">HIDDEN NOW</font>}>
                Will disappear in <span style="font-weight: bold; color: green;">2 seconds</span>!
            </Show>
            <br />
            <Show
                when={() => content()?.length || 1}
                fallback={<div>Error - This should not be displayed</div>}
            >
                <span>Before -- </span>
                {content}
                {" me the money "}
                <span> -- After</span>
            </Show>
        </p>
    );
}

export function ForElseApp() {
    const [elems, setElems] = createSignal([10, 11]);

    return () => (
        <>
            <div>
                <button
                    type="button"
                    onClick={() => setElems((s) => (s.length === 0 ? [0] : [...s, s[s.length - 1] + 1]))}
                >
                    More
                </button>{" "}
                <button type="button" onClick={() => setElems((s) => s.slice(1))}>
                    Less
                </button>
            </div>
            <ul>
                <ForElse each={elems} fallback={<li style={{ color: "red" }}>No element!</li>}>
                    {(el) => <li>{el}</li>}
                </ForElse>
            </ul>
        </>
    );
}

export function ForElse<T>({ each, fallback, equals, children }: ForProps<T>) {
    onMount(() => console.log("Mounting ForElse"));
    onCleanup(() => console.log("Cleaning-up ForElse"));
    return () => (
        <Show when={() => each?.() && !each()[Symbol.iterator]().next().done} fallback={fallback}>
            <For each={each} equals={equals}>
                {toArray(children)[0]}
            </For>
        </Show>
    );
}

export function WhenAppWithSignal() {
    const [first, setFirst] = createSignal(true);
    const [second, setSecond] = createSignal(false);
    return () => (
        <>
            <Show when={first}>
                <CounterButton nb={5} onexit={() => 0} />
            </Show>
            <Show when={second}>{() => <Clock level={0} probability={1} />}</Show>
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
    const [content, setContent] = createSignal<any>(1);
    setTimeout(() => setContent(2), 1000);
    setTimeout(() => setContent(3), 2000);
    return () => (
        <Switch fallback={<div>By now!</div>}>
            <Match when={() => content() === 1}>
                <div>Hello...</div>
            </Match>
            <Match when={() => content() === 2}>
                <div>...you</div>
            </Match>
        </Switch>
    );
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface CustomCaptureEvents {
            click: Event;
        }
        interface CustomEvents {
            click: Event;
        }
    }
}

export function LoginApp() {
    const [loggedIn, setLoggedIn] = createSignal(false);
    const toggle = () => setLoggedIn(!loggedIn());

    return () => (
        <Show when={loggedIn} fallback={<button oncapture:click={toggle}>Log in</button>}>
            <button on:click={toggle}>Log out</button>
            <Portal mount={document.getElementById("portal")!} useShadow>
                <h1>Hello world!</h1>
                <p>
                    It is <Clock level={0} />
                </p>
                <ForElseApp />
            </Portal>
        </Show>
    );
}

function MatchWrapper({ x, children }: { x: Accessor<number>; children?: SuppleNode }) {
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
    const [single, setSingle] = createSignal(true);
    const [x, setX] = createSignal(14);

    setTimeout(() => setForNums([11, 12, 13, 14]), 1000);
    setTimeout(() => setX(13), 2000);
    setTimeout(() => setForNums([11, 14]), 3000);
    setTimeout(() => setSingle(false), 4000);

    return () => (
        <div style="border: 1px solid grey;">
            <Switch fallback={<font>{x} is between 5 and 15</font>}>
                dsgfjl
                <MatchWrapper x={x}>
                    <Match when={() => x() > 15}>
                        <p>{x} is greater than 15</p>
                    </Match>
                </MatchWrapper>
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
                    <Match when={() => x() == 9}>
                        <p>{x} is 9</p>
                    </Match>,
                    "ABC",
                ]}
                <>
                    <Match when={() => x() == 10}>
                        <p>{x} is 10</p>
                    </Match>
                </>
                {true}
                {() => {
                    if (single()) {
                        return (
                            <Match when={() => x() == 13}>
                                <p>{x} is 13.0</p>
                            </Match>
                        );
                    } else {
                        return (
                            <>
                                <Match when={() => x() == 8}>
                                    <p>{x} is 8</p>
                                </Match>
                                <Match when={() => x() == 9.5}>
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
