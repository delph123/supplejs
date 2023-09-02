import { createSignal, h, Fragment, createMemo } from "../core";
import { Clock } from "./components";

export function GameOn({ nb, onexit }) {
    const [nbRows, setNbRows] = createSignal(nb);

    return () => (
        <div>
            {Array(nbRows())
                .fill(0)
                .map(() => {
                    const [subscribe, notify] = createSignal(undefined, {
                        equals: false,
                    });
                    setInterval(notify, 1000);
                    return createMemo(() => {
                        subscribe();
                        return (
                            <div>
                                <p>
                                    <label>This is: </label>
                                    <font color="red">{new Date().toLocaleTimeString()}</font>
                                </p>
                            </div>
                        );
                    });
                })}
            <button
                onclick={() => {
                    if (nbRows() > 0) {
                        setNbRows(nbRows() - 1);
                    } else {
                        onexit();
                    }
                }}
            >
                Delete
            </button>
        </div>
    );
}

export function NestedChildren() {
    const nestedList = ["a", ["a", ["a", ["a", "b", "c"], "c"], "c"], "c"];

    function mapList(l) {
        return l.map((e) => (Array.isArray(e) ? mapList(e) : <p>{e}</p>));
    }

    function print(l) {
        const c = mapList(l);
        console.log(c);
        return c;
    }

    const [show, setShow] = createSignal(false);
    setTimeout(() => setShow(true), 2000);

    return () => {
        if (show()) {
            return (
                <>
                    <p>one</p>
                    <>
                        <div>before</div>
                        <>
                            <Child>{mapList(nestedList)}</Child>
                            <div>between</div>
                        </>
                        {() => print(nestedList)}
                        <Clock level={0} />
                        <div>after</div>
                    </>
                    <p>two</p>
                </>
            );
        } else {
            return <></>;
        }
    };
}

function Child({ children }: { children?: any }) {
    console.log(children);
    return () => (
        <>
            hello<span>f</span>f
            <>
                {" "}
                {children}
                <Clock level={0} />
                <p>2</p>
            </>
        </>
    );
}
