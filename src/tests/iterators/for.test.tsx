import { Mock, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "supplejs-testing-library";
import {
    h,
    Fragment,
    createSignal,
    For,
    Show,
    ForProps,
    Accessor,
    Setter,
    toArray,
    onCleanup,
} from "../../core";
import { createSideEffectSpy } from "../utils";
import { Looper, randomInt } from "./Looper";

describe("<For /> component", () => {
    const linePicker = vi.fn((n) => randomInt(n));
    function labels() {
        return screen.queryAllByRole("caption").map((c) => c.textContent);
    }
    function counters() {
        return screen.queryAllByRole("emphasis").map((c) => c.textContent);
    }
    function addButton(id: number) {
        return screen.getByTestId("add-button-" + id);
    }
    function subtractButton(id: number) {
        return screen.getByTestId("del-button-" + id);
    }
    function button(name: string, line?: number) {
        if (line != null) {
            linePicker.mockReturnValueOnce(line);
        }
        return screen.getByRole("button", { name });
    }
    function lastPickedRow() {
        return linePicker.mock.results[linePicker.mock.results.length - 1].value;
    }
    function insert<T>(value: T, array: T[], index: number) {
        return array.toSpliced(index, 0, value);
    }
    function check(spy: Mock, event: string, number: any) {
        const calls = spy.mock.calls.filter(([e]) => e === event);
        if (Array.isArray(number)) {
            expect(calls).toEqual(number.map((n) => [event, n]));
        } else {
            expect(calls).toEqual(new Array(number).fill(0).map((_v, i) => [event, i + 1]));
        }
    }
    async function renderLooper() {
        const counterSpy = vi.fn();
        const [list, setList] = createSignal<any[]>([]);
        render(() => <Looper list={list} setList={setList} pickIndex={linePicker} counterSpy={counterSpy} />);

        await screen.findByTestId("counter-1");

        return { list, setList, counterSpy };
    }

    it("has no element initially", () => {
        const [list, setList] = createSignal<any[]>([]);
        render(() => <Looper list={list} setList={setList} />);
        expect(screen.getByText("No element to display!")).toBeInTheDocument();
    });

    it("renders 4 rows", async () => {
        const { counterSpy } = await renderLooper();
        expect(labels()).toEqual(["1", "2", "3", "4"]);
        expect(counters()).toEqual(["5", "5", "5", "5"]);
        check(counterSpy, "mounting", 4);
    });

    it("changes counter", async () => {
        const { counterSpy } = await renderLooper();
        fireEvent.click(addButton(1));
        expect(labels()).toEqual(["1", "2", "3", "4"]);
        expect(counters()).toEqual(["6", "5", "5", "5"]);
        fireEvent.click(addButton(3));
        expect(labels()).toEqual(["1", "2", "3", "4"]);
        expect(counters()).toEqual(["6", "5", "6", "5"]);
        fireEvent.click(addButton(3));
        expect(labels()).toEqual(["1", "2", "3", "4"]);
        expect(counters()).toEqual(["6", "5", "7", "5"]);
        check(counterSpy, "mounting", 4);
    });

    it("adds new rows", async () => {
        const { counterSpy } = await renderLooper();
        fireEvent.click(button("Add row", 4));
        expect(labels()).toEqual(["1", "2", "3", "4", "5"]);
        fireEvent.click(button("Add row", 0));
        expect(labels()).toEqual(["6", "1", "2", "3", "4", "5"]);
        fireEvent.click(button("Add row", 3));
        expect(labels()).toEqual(["6", "1", "2", "7", "3", "4", "5"]);
        fireEvent.click(button("Add row"));
        expect(labels()).toEqual(insert("8", ["6", "1", "2", "7", "3", "4", "5"], lastPickedRow()));
        check(counterSpy, "mounting", 8);
    });

    it("keep counters while adding rows", async () => {
        const { counterSpy } = await renderLooper();
        fireEvent.click(addButton(1));
        fireEvent.click(subtractButton(4));
        fireEvent.click(addButton(3));
        fireEvent.click(addButton(3));
        expect(counters()).toEqual(["6", "5", "7", "4"]);

        fireEvent.click(button("Add row", 4));
        expect(counters()).toEqual(["6", "5", "7", "4", "5"]);
        fireEvent.click(button("Add row", 0));
        expect(counters()).toEqual(["5", "6", "5", "7", "4", "5"]);

        fireEvent.click(subtractButton(4));
        fireEvent.click(addButton(3));
        fireEvent.click(subtractButton(6));
        fireEvent.click(addButton(5));
        expect(counters()).toEqual(["4", "6", "5", "8", "3", "6"]);

        fireEvent.click(button("Add row", 3));
        expect(counters()).toEqual(["4", "6", "5", "5", "8", "3", "6"]);
        fireEvent.click(subtractButton(2));
        fireEvent.click(addButton(7));
        fireEvent.click(addButton(7));
        expect(counters()).toEqual(["4", "6", "4", "7", "8", "3", "6"]);
        check(counterSpy, "mounting", 7);
    });

    it("removes rows", async () => {
        const { counterSpy } = await renderLooper();
        fireEvent.click(button("Remove row", 3));
        expect(labels()).toEqual(["1", "2", "3"]);
        fireEvent.click(button("Remove row", 0));
        expect(labels()).toEqual(["2", "3"]);
        fireEvent.click(button("Add row", 0));
        fireEvent.click(button("Add row", 3));
        fireEvent.click(button("Remove row", 1));
        expect(labels()).toEqual(["5", "3", "6"]);
        fireEvent.click(button("Add row"));
        fireEvent.click(button("Remove row"));
        fireEvent.click(button("Remove row"));
        expect(labels()).toHaveLength(2);
        check(counterSpy, "mounting", 7);
        check(counterSpy, "cleaning-up", [4, 1, 2, expect.any(Number), expect.any(Number)]);
    });

    it("keep counters while removing rows", async () => {
        const { counterSpy } = await renderLooper();
        fireEvent.click(addButton(1));
        fireEvent.click(subtractButton(4));
        fireEvent.click(addButton(3));
        fireEvent.click(addButton(3));
        expect(counters()).toEqual(["6", "5", "7", "4"]);

        fireEvent.click(button("Remove row", 3));
        expect(counters()).toEqual(["6", "5", "7"]);
        fireEvent.click(button("Remove row", 0));
        expect(counters()).toEqual(["5", "7"]);

        fireEvent.click(button("Add row", 0));
        fireEvent.click(button("Add row", 3));
        fireEvent.click(subtractButton(5));
        fireEvent.click(addButton(6));
        fireEvent.click(addButton(3));
        expect(counters()).toEqual(["4", "5", "8", "6"]);

        fireEvent.click(button("Remove row", 2));
        expect(counters()).toEqual(["4", "5", "6"]);
        fireEvent.click(button("Remove row", 1));
        expect(counters()).toEqual(["4", "6"]);

        fireEvent.click(subtractButton(5));
        fireEvent.click(addButton(6));
        expect(counters()).toEqual(["3", "7"]);
        check(counterSpy, "mounting", 6);
        check(counterSpy, "cleaning-up", [4, 1, 3, 2]);
    });

    it("changes label", async () => {
        const { counterSpy } = await renderLooper();
        fireEvent.click(button("Change label", 3));
        expect(labels()).toEqual(["1", "2", "3", "4*"]);
        fireEvent.click(button("Change label", 0));
        expect(labels()).toEqual(["1*", "2", "3", "4*"]);
        fireEvent.click(button("Add row", 2));
        fireEvent.click(button("Change label", 2));
        expect(labels()).toEqual(["1*", "2", "5*", "3", "4*"]);
        check(counterSpy, "mounting", 5);
    });

    it("keeps counters and labels throughout", async () => {
        const { counterSpy } = await renderLooper();
        fireEvent.click(button("Change label", 0));
        fireEvent.click(button("Change label", 1));
        fireEvent.click(addButton(1));
        fireEvent.click(subtractButton(3));
        expect(labels()).toEqual(["1*", "2*", "3", "4"]);
        expect(counters()).toEqual(["6", "5", "4", "5"]);

        fireEvent.click(button("Add row", 0));
        fireEvent.click(button("Change label", 0));
        fireEvent.click(subtractButton(5));
        expect(labels()).toEqual(["5*", "1*", "2*", "3", "4"]);
        expect(counters()).toEqual(["4", "6", "5", "4", "5"]);

        fireEvent.click(button("Remove row", 2));
        expect(labels()).toEqual(["5*", "1*", "3", "4"]);
        expect(counters()).toEqual(["4", "6", "4", "5"]);

        fireEvent.click(button("Add row", 4));
        fireEvent.click(button("Add row", 2));
        expect(labels()).toEqual(["5*", "1*", "7", "3", "4", "6"]);
        expect(counters()).toEqual(["4", "6", "5", "4", "5", "5"]);

        fireEvent.click(button("Remove row", 0));
        fireEvent.click(button("Remove row", 4));
        expect(labels()).toEqual(["1*", "7", "3", "4"]);
        expect(counters()).toEqual(["6", "5", "4", "5"]);

        fireEvent.click(button("Init"));
        expect(labels()).toEqual(["8", "9", "10", "11"]);
        expect(counters()).toEqual(["5", "5", "5", "5"]);

        check(counterSpy, "mounting", 11);
        check(counterSpy, "cleaning-up", ["2*", "5*", 6, "1*", 7, 3, 4]);
    });

    it("removes all rows", async () => {
        await renderLooper();

        fireEvent.click(button("Remove row"));
        fireEvent.click(button("Remove row"));
        fireEvent.click(button("Remove row"));
        fireEvent.click(button("Remove row"));
        expect(screen.getByText("No element to display!")).toBeInTheDocument();

        fireEvent.click(button("Add row"));
        expect(labels()).toEqual(["5"]);
    });

    it("accepts direct changes to signal", async () => {
        const { list, setList } = await renderLooper();

        expect(list().map((l) => l.row)).toEqual([1, 2, 3, 4]);

        const [a, b] = list();
        a.setLabel("1*");
        b.setLabel("2**");
        expect(labels()).toEqual(["1*", "2**", "3", "4"]);

        setList([]);
        expect(screen.getByText("No element to display!")).toBeInTheDocument();

        fireEvent.click(button("Init"));
        expect(screen.queryByText("No element to display!")).not.toBeInTheDocument();
        expect(list().map((l) => l.row)).toEqual([5, 6, 7, 8]);

        const [, f, g, h] = list();
        setList([h, b, a, f, g]);
        expect(labels()).toEqual(["8", "2**", "1*", "6", "7"]);
    });

    it("cleans-up all elements when disposing", () => {
        const spy = vi.fn();

        const { unmount } = render(() => (
            <For each={() => [1, 2]}>
                {(el) => {
                    onCleanup(spy);
                    return <div>{el}</div>;
                }}
            </For>
        ));

        expect(spy).not.toHaveBeenCalled();
        unmount();
        expect(spy).toHaveBeenCalledTimes(2);
    });
});

describe("<ForElse /> component", () => {
    function ForElse<T>({ each, fallback, children }: { each: Accessor<T[]> } & ForProps<T>) {
        return () => (
            <Show when={() => each() && each().length > 0} fallback={fallback}>
                <For each={each}>{toArray(children)[0]}</For>
            </Show>
        );
    }
    function ForElseApp() {
        const [elements, setElements] = createSignal([1, 2, 3]);

        return () => (
            <>
                <div>
                    <button
                        type="button"
                        onClick={() =>
                            setElements((s) => (s.length === 0 ? [1] : [...s, s[s.length - 1] + 1]))
                        }
                    >
                        More
                    </button>{" "}
                    <button type="button" onClick={() => setElements((s) => s.slice(1))}>
                        Less
                    </button>
                </div>
                <ul>
                    <ForElse each={elements} fallback={<li style={{ color: "red" }}>No element!</li>}>
                        {(el) => <li>{el}</li>}
                    </ForElse>
                </ul>
            </>
        );
    }

    it("Displays the list if not empty & fallback if empty", async () => {
        render(() => <ForElseApp />);

        const moreButton = screen.getByRole("button", { name: "More" });
        const lessButton = screen.getByRole("button", { name: "Less" });
        const listItems = () => screen.getAllByRole("listitem").map((el) => el.textContent);

        expect(listItems()).toEqual(["1", "2", "3"]);

        fireEvent.click(moreButton);
        expect(listItems()).toEqual(["1", "2", "3", "4"]);

        fireEvent.click(lessButton);
        expect(listItems()).toEqual(["2", "3", "4"]);
        fireEvent.click(lessButton);
        expect(listItems()).toEqual(["3", "4"]);
        fireEvent.click(lessButton);
        expect(listItems()).toEqual(["4"]);

        fireEvent.click(lessButton);
        expect(screen.getByRole("list").innerHTML).toBe('<li style="color: red;">No element!</li>');

        fireEvent.click(moreButton);
        expect(listItems()).toEqual(["1"]);

        fireEvent.click(lessButton);
        expect(screen.getByRole("list").innerHTML).toBe('<li style="color: red;">No element!</li>');

        fireEvent.click(moreButton);
        fireEvent.click(moreButton);
        expect(listItems()).toEqual(["1", "2"]);
    });

    it("cleans-up all elements when falling-back", () => {
        const [visible, setVisible] = createSignal(true);
        const [elements, setElements] = createSignal([1, 2, 3]);
        const spy = vi.fn();

        render(() => (
            <Show when={visible} fallback={<p>no content</p>}>
                <For each={elements}>
                    {(el) => {
                        onCleanup(spy);
                        return <li>{el}</li>;
                    }}
                </For>
            </Show>
        ));

        setElements([4, 5]);
        expect(spy).toHaveBeenCalledTimes(3);
        setVisible(false);
        expect(spy).toHaveBeenCalledTimes(5);
        setVisible(true);
        expect(spy).toHaveBeenCalledTimes(5);
        setVisible(false);
        expect(spy).toHaveBeenCalledTimes(7);
    });
});

describe("<For /> component accepts tracking mapping function", () => {
    function createArraySignal() {
        const [list, setList] = createSignal<{ value: Accessor<string>; setValue: Setter<string> }[]>([]);
        const remove = (index: number) => {
            setList((list() as any).toSpliced(index, 1));
        };
        const add = (index: number, initialValue: string) => {
            const [value, setValue] = createSignal(initialValue);
            setList((list() as any).toSpliced(index, 0, { value, setValue }));
        };
        return [list, setList, add, remove] as const;
    }

    it("only re-renders mapping branch associated to tracking signal, no other branch", () => {
        const [spy, act] = createSideEffectSpy();
        const [list, setList, add, remove] = createArraySignal();

        render(() => (
            <div>
                <For each={list}>{(el) => spy(el.value())}</For>
            </div>
        ));

        act.beforeEach(spy.mockClear);

        add(0, "a");
        add(0, "b");
        expect(spy.mock.calls.flat().join()).toBe("a,b");

        act(() => remove(1));
        expect(spy).not.toHaveBeenCalled();

        add(1, "c");
        act(() => add(2, "d"));
        expect(spy.mock.calls.flat().join()).toBe("d");

        act(() => list()[1].setValue("e"));
        expect(spy.mock.calls.flat().join()).toBe("e");

        const [b, e, d] = list();
        act(() => setList([e, d, b]));
        expect(spy).not.toHaveBeenCalled();

        act(() => list().forEach((e) => e.setValue((r) => "_" + r + "_")));
        expect(spy.mock.calls.flat().join()).toBe("_e_,_d_,_b_");
    });
});
