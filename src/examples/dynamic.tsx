import {
    h,
    Fragment,
    Dynamic,
    createSignal,
    lazy,
    Show,
    children,
    For,
    onCleanup,
} from "../rwr";
import { Clock } from "./components";
import { ForElse } from "./controls";

export function DynamicApp() {
    const [elems, setElems] = createSignal([10, 11]);
    const [load, setLoad] = createSignal(false);

    const LazyForElse = lazy(() => {
        return new Promise<{ default: typeof ForElse }>((resolve) => {
            console.log("Loading...");
            setTimeout(() => {
                console.log("Loaded");
                resolve({
                    default: ForElse,
                });
            }, 2000);
        });
    });

    return () => (
        <Dynamic component="div">
            <Dynamic component="h1" id="toto">
                Header{" "}
                <Dynamic
                    component="font"
                    style={{ fontSize: "0.7em" }}
                    prop:color="red"
                >
                    is red
                </Dynamic>
                !
            </Dynamic>
            <Dynamic component={"br"} />
            <Dynamic component={Clock} level={0} />
            <div style={{ marginTop: "20px" }}>
                <Dynamic
                    component={Show}
                    when={load()}
                    fallback={
                        <div>
                            <button
                                type="button"
                                onclick={() => LazyForElse.preload()}
                            >
                                Preload
                            </button>{" "}
                            <button
                                type="button"
                                onclick={() => {
                                    setLoad(true);
                                    setTimeout(() => setLoad(false), 5000);
                                }}
                            >
                                Load component
                            </button>
                        </div>
                    }
                >
                    <Dynamic component={"div"}>
                        <Dynamic
                            component="button"
                            type="button"
                            onclick={() =>
                                setElems((s) =>
                                    s.length === 0
                                        ? [0]
                                        : [...s, s[s.length - 1] + 1],
                                )
                            }
                        >
                            More
                        </Dynamic>{" "}
                        <Dynamic
                            component={"button"}
                            type="button"
                            onclick={() => setElems((s) => s.slice(1))}
                        >
                            Less
                        </Dynamic>
                    </Dynamic>
                    <ul>
                        <LazyForElse
                            each={elems}
                            fallback={<li>no more element</li>}
                        >
                            {(el) => <li>{el}</li>}
                        </LazyForElse>
                    </ul>
                </Dynamic>
            </div>
        </Dynamic>
    );
}

function PlayWithChildren(props: { children?: any[]; index: () => number }) {
    function rankString(idx) {
        switch (idx()) {
            case 0:
                return "1st";
            case 1:
                return "2nd";
            case 2:
                return "3rd";
            default:
                return `${idx() + 1}th`;
        }
    }

    const resolved = children(() => props?.children);
    // const resolved = () => props?.children ?? [];

    return () => (
        <>
            {/* Extracting {() => rankString(props.index)} child:
            <ol start={() => props.index() + 1}>
                <li>{() => resolved()[props.index()]}</li>
            </ol> */}
            Out of:
            <ol
                style={{
                    border: "1px solid grey",
                    paddingTop: "1em",
                    paddingBottom: "1em",
                }}
            >
                <For each={resolved}>
                    {(el, i) => (
                        <li id={() => "clock-" + i()}>
                            {el} | {Math.random().toString().substring(3, 8)}
                        </li>
                    )}
                </For>
            </ol>
        </>
    );
}

export function ChildrenPlayer() {
    const [idx, setIdx] = createSignal(0);
    // const timer = setInterval(() => setIdx((i) => (i + 1) % 5), 1000);
    // onCleanup(() => clearInterval(timer));
    return () => (
        <div>
            <h3>Playing with children</h3>
            <PlayWithChildren index={idx}>
                <Clock level={0} probability={0.1} />
                <Clock level={0} probability={0.3} />
                <span>
                    {Math.random().toString().substring(3, 8)} -{" "}
                    <Clock level={0} probability={0.5} />
                </span>
                <Clock level={0} probability={0.7} />
                <Clock level={0} probability={0.9} />
            </PlayWithChildren>
        </div>
    );
}
