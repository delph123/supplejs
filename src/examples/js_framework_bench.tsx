import { h, For, createSignal, createMemo, Accessor, Setter } from "../core";
import useCSS from "./useCss";

const BATCH_SIZE = 1000;

let idCounter = 1;
const adjectives = [
        "pretty",
        "large",
        "big",
        "small",
        "tall",
        "short",
        "long",
        "handsome",
        "plain",
        "quaint",
        "clean",
        "elegant",
        "easy",
        "angry",
        "crazy",
        "helpful",
        "mushy",
        "odd",
        "unsightly",
        "adorable",
        "important",
        "inexpensive",
        "cheap",
        "expensive",
        "fancy",
    ],
    colors = [
        "red",
        "yellow",
        "blue",
        "green",
        "pink",
        "brown",
        "purple",
        "brown",
        "white",
        "black",
        "orange",
    ],
    nouns = [
        "table",
        "chair",
        "house",
        "bbq",
        "desk",
        "car",
        "pony",
        "cookie",
        "sandwich",
        "burger",
        "pizza",
        "mouse",
        "keyboard",
    ];

function _random(max: number) {
    return Math.round(Math.random() * 1000) % max;
}

interface DataRecord {
    id: number;
    label: Accessor<string>;
    setLabel: Setter<string>;
}

function buildData(count: number): DataRecord[] {
    const data = new Array<DataRecord>(count);
    for (let i = 0; i < count; i++) {
        const [label, setLabel] = createSignal(
            `${adjectives[_random(adjectives.length)]} ${
                colors[_random(colors.length)]
            } ${nouns[_random(nouns.length)]}`,
        );
        data[i] = {
            id: idCounter++,
            label,
            setLabel,
        };
    }
    return data;
}

function Button({ id, text, fn }: { id: string; text: string; fn: () => void }) {
    return (
        <div class="col-sm-6 smallpad">
            <button id={id} class="btn btn-primary btn-block" type="button" onclick={fn}>
                {text}
            </button>
        </div>
    );
}

export function App() {
    useCSS("bootstrap.css");
    useCSS("js_bench.css");

    const [data, setData] = createSignal<DataRecord[]>([]),
        [selected, setSelected] = createSignal<number | null>(null),
        run = () => setData(buildData(BATCH_SIZE)),
        runLots = () => setData(buildData(10 * BATCH_SIZE)),
        add = () => setData((d) => [...d, ...buildData(BATCH_SIZE)]),
        update = () => {
            for (let i = 0, d = data(), len = d.length; i < len; i += 10) d[i].setLabel((l) => l + " !!!");
        },
        swapRows = () => {
            const d = data().slice();
            if (d.length >= 5) {
                const tmp = d[1];
                d[1] = d[d.length - 2];
                d[d.length - 2] = tmp;
                setData(d);
            }
        },
        clear = () => setData([]),
        remove = (id: number) =>
            setData((d) => {
                const idx = d.findIndex((d) => d.id === id);
                return [...d.slice(0, idx), ...d.slice(idx + 1)];
            });

    return (
        <div class="container">
            <div class="jumbotron">
                <div class="row">
                    <div class="col-md-6">
                        <h1>SuppleJS</h1>
                    </div>
                    <div class="col-md-6">
                        <div class="row">
                            <Button id="run" text={`Create ${BATCH_SIZE.toLocaleString()} rows`} fn={run} />
                            <Button
                                id="runlots"
                                text={`Create ${(10 * BATCH_SIZE).toLocaleString()} rows`}
                                fn={runLots}
                            />
                            <Button id="add" text={`Append ${BATCH_SIZE.toLocaleString()} rows`} fn={add} />
                            <Button id="update" text="Update every 10th row" fn={update} />
                            <Button id="clear" text="Clear" fn={clear} />
                            <Button id="swaprows" text="Swap Rows" fn={swapRows} />
                        </div>
                    </div>
                </div>
            </div>
            <table class="table table-hover table-striped test-data">
                <tbody>
                    <For each={data}>
                        {(row) => {
                            const rowId = row.id;
                            const selectedRowClass = createMemo(() => (selected() === rowId ? "danger" : ""));

                            return (
                                <tr class={selectedRowClass}>
                                    <td class="col-md-1">{rowId}</td>
                                    <td class="col-md-4">
                                        <a onclick={() => setSelected(rowId)}>{row.label}</a>
                                    </td>
                                    <td class="col-md-1">
                                        <a onclick={() => remove(rowId)}>
                                            <span class="glyphicon glyphicon-remove" aria-hidden="true" />
                                        </a>
                                    </td>
                                    <td class="col-md-6" />
                                </tr>
                            );
                        }}
                    </For>
                </tbody>
            </table>
            <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
        </div>
    );
}
