import { h, createComputed, createSignal, indexArray, mapArray, onCleanup, untrack } from "../core";
import { Looper } from "../tests/iterators/Looper";

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

export function LooperApp() {
    const [list, setList] = createSignal<any[]>([]);
    return <Looper list={list} setList={setList} />;
}
