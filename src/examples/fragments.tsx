import { createSignal, h } from "../rwr";
import { Clock } from "./components";

export function GameOn({ nb, onexit }) {
    const [nbRows, setNbRows] = createSignal(nb);

    return () => (
        <div>
            {Array(nbRows())
                .fill(0)
                .map(() => {
                    const [subscribe, notify] = createSignal();
                    setInterval(notify, 1000);
                    return () => {
                        subscribe();
                        return (
                            <div>
                                <p>
                                    <label>This is: </label>
                                    <font color="red">
                                        {new Date().toLocaleTimeString()}
                                    </font>
                                </p>
                            </div>
                        );
                    };
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

    function maplist(l) {
        return l.map((e) => (Array.isArray(e) ? maplist(e) : <p>{e}</p>));
    }

    function print(l) {
        const c = maplist(l);
        console.log(c);
        return c;
    }

    return () => (
        <div className="App">
            <div>before</div>
            <Child>{maplist(nestedList)}</Child>
            <div>between</div>
            {print(nestedList)}
            <div>after</div>
        </div>
    );
}

function Child({ children }: { children?: any }) {
    console.log(children);
    return () => (
        <div>
            <p>1</p>
            {children}
            <p>2</p>
        </div>
    );
}
