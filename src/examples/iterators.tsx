import {
    h,
    For,
    createComputed,
    createSignal,
    indexArray,
    mapArray,
    onCleanup,
    untrack,
    onMount,
} from "../core";
import { Counter } from "./components";

export function Mapper() {
    const [list, setList] = createSignal(["a", "b", "c", "a"]);

    const f = mapArray(list, (v, i) => {
        console.log("mapping", v, i());
        createComputed(() => console.log("changing index", i(), "for", v));
        onCleanup(() => console.log("removing", v, i()));
        return v;
    });

    createComputed(() => console.log("f is", f()));

    console.log("same list");
    setList(["a", "b", "c", "a"]);

    console.log("add two elements");
    setList(["a", "b", "c", "a", "e", "b"]);

    console.log("remove three elements");
    setList(["a", "b", "c"]);

    console.log("add three elements");
    setList(["a", "e", "a", "b", "f", "c"]);

    console.log("remove two elements");
    setList(["a", "e", "b", "c"]);

    console.log("shuffle elements");
    setList(["b", "e", "c", "a"]);

    return () => "hello world!";
}

export function Indexer() {
    const [list, setList] = createSignal(["a", "b", "c", "a"]);

    const f = indexArray(list, (v, i) => {
        console.log("mapping", v(), i);
        createComputed(() => console.log("changing value", v(), "at", i));
        onCleanup(() => console.log("removing", v(), i));
        return v;
    });

    createComputed(() => console.log("f is", f().map(untrack)));

    console.log("same list");
    setList(["a", "b", "c", "a"]);

    console.log("add two elements");
    setList(["a", "b", "c", "a", "e", "b"]);

    console.log("remove three elements");
    setList(["a", "b", "c"]);

    console.log("add three elements");
    setList(["a", "e", "a", "b", "f", "c"]);

    console.log("remove two elements");
    setList(["a", "e", "b", "c"]);

    console.log("shuffle elements");
    setList(["b", "e", "c", "a"]);

    return () => "hello world!";
}

export function Looper() {
    const [list, setList] = createSignal<any[]>([]);
    let rowNumber = 0;

    const newRow = () => {
        rowNumber++;
        const [label, setLabel] = createSignal(rowNumber);
        return { row: rowNumber, label, setLabel };
    };
    const init = () => {
        const l = new Array(10).fill(0).map(newRow);
        setList(l);
    };
    const change = () => {
        list()[Math.floor(Math.random() * list().length)].setLabel(
            (l) => l + "*",
        );
    };
    const remove = () => {
        const l = list();
        setList(
            (l as any).toSpliced(Math.floor(Math.random() * list().length), 1),
        );
    };
    const add = () => {
        const l = list();
        setList(
            (l as any).toSpliced(
                Math.floor(Math.random() * list().length),
                0,
                newRow(),
            ),
        );
    };

    onMount(init);

    return () => (
        <div>
            <div>
                <button onClick={init}>Init</button>{" "}
                <button onClick={change}>Change label</button>{" "}
                <button onClick={remove}>Remove row</button>{" "}
                <button onClick={add}>Add row</button>
            </div>
            <ul>
                <For
                    each={list}
                    fallback={
                        <li style={{ color: "red" }}>No element to display!</li>
                    }
                >
                    {(elem) => {
                        console.log("rendering", elem.row);
                        return (
                            <li>
                                <Counter
                                    index={elem.label()}
                                    total={() => list().length}
                                />
                            </li>
                        );
                    }}
                </For>
            </ul>
        </div>
    );
}
