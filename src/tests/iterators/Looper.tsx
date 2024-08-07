import {
    h,
    Fragment,
    createSignal,
    onMount,
    For,
    onCleanup,
    SuppleComponentReturn,
    untrack,
    Accessor,
    Setter,
} from "../../core";

export function randomInt(n: number): number {
    return Math.floor(Math.random() * n);
}

interface ListElement {
    row: number;
    label: Accessor<number | string>;
    setLabel: Setter<number | string>;
}
type LooperProps = {
    list: Accessor<ListElement[]>;
    setList: Setter<ListElement[]>;
    pickIndex?: (n: number) => number;
    counterSpy?: () => void;
};
export function Looper({
    list,
    setList,
    pickIndex = (n) => randomInt(n),
    counterSpy = () => 0,
}: LooperProps) {
    let rowNumber = 0;

    const newRow = () => {
        rowNumber++;
        const [label, setLabel] = createSignal<number | string>(rowNumber);
        return { row: rowNumber, label, setLabel };
    };
    const init = () => {
        setList(new Array(4).fill(0).map(newRow));
    };
    const change = () => {
        list()[pickIndex(list().length)].setLabel((l) => l + "*");
    };
    const remove = () => {
        setList(list().toSpliced(pickIndex(list().length), 1));
    };
    const add = () => {
        setList(list().toSpliced(pickIndex(list().length), 0, newRow()));
    };

    onMount(init);

    return (
        <>
            <div>
                <button onClick={init}>Init</button> <button onClick={change}>Change label</button>{" "}
                <button onClick={remove}>Remove row</button> <button onClick={add}>Add row</button>
            </div>
            <ol>
                <For each={list} fallback={<li style={{ color: "red" }}>No element to display!</li>}>
                    {(elem) => (
                        <li>
                            <Counter label={elem.label} counterSpy={counterSpy} />
                        </li>
                    )}
                </For>
            </ol>
        </>
    );
}

export function Counter({
    label,
    counterSpy,
}: {
    label: Accessor<number | string>;
    counterSpy: (v: string, n: string | number) => void;
}): SuppleComponentReturn {
    const [counter, setCounter] = createSignal(5);

    counterSpy("mounting", untrack(label));
    onCleanup(() => counterSpy("cleaning-up", untrack(label)));

    return (
        <>
            Counter{" "}
            <span role="caption" data-testid={() => `label-${trim(label())}`}>
                {label}
            </span>{" "}
            &gt;&gt;{" "}
            <span role="emphasis" data-testid={() => `counter-${trim(label())}`}>
                {counter}
            </span>{" "}
            <button
                data-testid={() => `add-button-${trim(label())}`}
                onClick={() => setCounter(counter() + 1)}
            >
                +
            </button>
            <button
                data-testid={() => `del-button-${trim(label())}`}
                onClick={() => setCounter(counter() - 1)}
            >
                -
            </button>
        </>
    );
}

export function trim(label: number | string) {
    return label.toString().replace(/\*+$/, "");
}
