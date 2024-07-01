import { describe, expect, it, vi } from "vitest";
import { render, screen } from "../utils";
import { h, Show, createSignal, Fragment } from "../../core";
import { createMockComponent } from "../mocks/mock_component";

describe("Non-keyed <Show /> component", () => {
    it("takes an only child", () => {
        const [count, setCount] = createSignal(0);

        const { container } = render(() => (
            <Show when={() => count() >= 5}>
                <span>{count}</span>
            </Show>
        ));

        expect(container).toBeEmptyDOMElement();

        setCount(7);
        expect((container.firstChild as HTMLSpanElement).innerHTML).toBe("7");
        setCount(5);
        expect((container.firstChild as HTMLSpanElement).innerHTML).toBe("5");

        setCount(2);
        expect(container).toBeEmptyDOMElement();
    });

    it("takes multiple children", () => {
        const [count, setCount] = createSignal(0);

        const { container } = render(() => (
            <Show when={() => count() >= 5}>
                Before - <span data-testid="count">{count}</span>
                <span> - After</span>
            </Show>
        ));

        expect(container).toBeEmptyDOMElement();

        setCount(7);
        expect(screen.getByTestId("count").innerHTML).toBe("7");
        setCount(5);
        expect(screen.getByTestId("count").innerHTML).toBe("5");

        setCount(2);
        expect(container).toBeEmptyDOMElement();
    });

    it("accepts a function of the condition", () => {
        const [count, setCount] = createSignal(0);

        const { container } = render(() => (
            <Show when={count}>
                {(c) => (
                    <>
                        <h1>{c}</h1>
                        <article>{count}</article>
                    </>
                )}
            </Show>
        ));

        expect(container).toBeEmptyDOMElement();
        setCount(7);
        expect(screen.getByRole("heading").innerHTML).toBe("7");
        expect(screen.getByRole("article").innerHTML).toBe("7");
        setCount(3);
        expect(screen.getByRole("heading").innerHTML).toBe("7");
        expect(screen.getByRole("article").innerHTML).toBe("3");
        setCount(0);
        expect(container).toBeEmptyDOMElement();
    });

    it("doesn't rerender children when condition doesn't change", () => {
        const spy = vi.fn(() => "hello");
        const [count, setCount] = createSignal(0);

        render(() => (
            <Show when={count}>
                <span>{count}</span>
                <span>{spy}</span>
            </Show>
        ));

        expect(spy).not.toHaveBeenCalled();

        setCount(7);
        expect(spy).toHaveBeenCalledOnce();
        setCount(5);
        expect(spy).toHaveBeenCalledOnce();

        setCount(0);
        expect(spy).toHaveBeenCalledOnce();
        setCount(NaN);
        expect(spy).toHaveBeenCalledOnce();

        setCount(7);
        expect(spy).toHaveBeenCalledTimes(2);
        setCount(13);
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it("doesn't call rendering function again when condition doesn't change", () => {
        const spy = vi.fn((c) => <span>{c}</span>);
        const [count, setCount] = createSignal(0);

        render(() => <Show when={count}>{spy}</Show>);

        expect(spy).not.toHaveBeenCalled();

        setCount(7);
        expect(spy).toHaveBeenCalledOnce();
        setCount(5);
        expect(spy).toHaveBeenCalledOnce();

        setCount(0);
        expect(spy).toHaveBeenCalledOnce();
        setCount(NaN);
        expect(spy).toHaveBeenCalledOnce();

        setCount(11);
        expect(spy).toHaveBeenCalledTimes(2);
        setCount(13);
        expect(spy).toHaveBeenCalledTimes(2);

        expect(screen.getByText("11")).toBeInTheDocument();
    });

    it("recreates children from scratch when toggling show/hide state", () => {
        const [count, setCount] = createSignal(5);
        const [Cmp, mountSpy, cleanupSpy] = createMockComponent(count);

        render(() => (
            <Show when={count}>
                <Cmp />
            </Show>
        ));

        expect(screen.getByRole("heading")).toBeInTheDocument();
        expect(mountSpy).toHaveBeenCalledOnce();
        expect(cleanupSpy).not.toHaveBeenCalled();

        setCount(7);
        expect(screen.getByRole("heading").innerHTML).toBe("7");
        expect(mountSpy).toHaveBeenCalledOnce();
        expect(cleanupSpy).not.toHaveBeenCalled();

        setCount(0);
        expect(screen.queryByRole("heading")).not.toBeInTheDocument();
        expect(mountSpy).toHaveBeenCalledOnce();
        expect(cleanupSpy).toHaveBeenCalledOnce();

        setCount(7);
        expect(screen.getByRole("heading")).toBeInTheDocument();
        expect(mountSpy).toHaveBeenCalledTimes(2);
        expect(cleanupSpy).toHaveBeenCalledOnce();

        setCount(0);
        setCount(5);
        setCount(0);
        expect(mountSpy).toHaveBeenCalledTimes(3);
        expect(cleanupSpy).toHaveBeenCalledTimes(3);
    });

    it("accepts a signal as direct child", () => {
        const [count, setCount] = createSignal(0);

        const { container } = render(() => <Show when={() => count() >= 5}>{count}</Show>);

        expect(container).toBeEmptyDOMElement();

        setCount(7);
        expect(container.innerHTML).toBe("7");
        setCount(5);
        expect(container.innerHTML).toBe("5");

        setCount(2);
        expect(container).toBeEmptyDOMElement();
    });
});

describe("<Show /> component fallback", () => {
    it("displays fallback when condition is falsy", () => {
        const [data, setData] = createSignal<any>();

        function whenDataIs(value: any) {
            setData(value);
            return {
                expect(branch: "fallback" | "heading") {
                    return {
                        toBeDisplayed() {
                            if (branch === "fallback") {
                                expect(screen.getByText("fallback")).toBeInTheDocument();
                                expect(screen.queryByRole("heading")).not.toBeInTheDocument();
                            } else {
                                expect(screen.queryByText("fallback")).not.toBeInTheDocument();
                                expect(screen.getByRole("heading")).toBeInTheDocument();
                            }
                        },
                    };
                },
            };
        }

        render(() => (
            <Show when={data} fallback={<p>fallback</p>}>
                <h1>{data.toString()}</h1>
            </Show>
        ));

        expect(screen.getByText("fallback")).toBeInTheDocument();
        expect(screen.queryByRole("heading")).not.toBeInTheDocument();

        whenDataIs(true).expect("heading").toBeDisplayed();
        whenDataIs(false).expect("fallback").toBeDisplayed();
        whenDataIs(0).expect("fallback").toBeDisplayed();
        whenDataIs(NaN).expect("fallback").toBeDisplayed();
        whenDataIs(-0).expect("fallback").toBeDisplayed();
        whenDataIs(17).expect("heading").toBeDisplayed();
        whenDataIs("").expect("fallback").toBeDisplayed();
        whenDataIs("17").expect("heading").toBeDisplayed();
        whenDataIs(`${23}!`).expect("heading").toBeDisplayed();
        whenDataIs(null).expect("fallback").toBeDisplayed();
        whenDataIs(undefined).expect("fallback").toBeDisplayed();
        whenDataIs(0n).expect("fallback").toBeDisplayed();
        whenDataIs({}).expect("heading").toBeDisplayed();
        whenDataIs([]).expect("heading").toBeDisplayed();

        // a function must be passed as a function setter
        whenDataIs(() => createSignal)
            .expect("heading")
            .toBeDisplayed();
    });

    it("accepts a signal as a fallback", () => {
        const [data, setData] = createSignal<any>(false);

        render(() => (
            <Show when={data} fallback={() => `${data()} is falsy`}>
                <h1>hello</h1>
            </Show>
        ));

        expect(screen.getByText("false is falsy")).toBeInTheDocument();
        expect(screen.queryByRole("heading")).not.toBeInTheDocument();

        setData(0);
        expect(screen.getByText("0 is falsy")).toBeInTheDocument();
        expect(screen.queryByRole("heading")).not.toBeInTheDocument();

        setData([1, 2]);
        expect(screen.queryByText("falsy", { exact: false })).not.toBeInTheDocument();
        expect(screen.getByRole("heading")).toBeInTheDocument();
    });

    it("recreates fallback from scratch when toggling show/hide state", () => {
        const [count, setCount] = createSignal<any>(5);
        const [Cmp, mountSpy, cleanupSpy] = createMockComponent(count);

        render(() => (
            <Show when={() => count() < 0} fallback={<Cmp />}>
                <article>Lorem ipsum</article>
            </Show>
        ));

        expect(screen.getByRole("heading")).toBeInTheDocument();
        expect(screen.getByRole("heading").innerHTML).toBe("5");
        expect(mountSpy).toHaveBeenCalledOnce();
        expect(cleanupSpy).not.toHaveBeenCalled();

        setCount(7);
        expect(screen.getByRole("heading").innerHTML).toBe("7");
        expect(mountSpy).toHaveBeenCalledOnce();
        expect(cleanupSpy).not.toHaveBeenCalled();

        setCount(-5);
        expect(screen.queryByRole("heading")).not.toBeInTheDocument();
        expect(mountSpy).toHaveBeenCalledOnce();
        expect(cleanupSpy).toHaveBeenCalledOnce();

        setCount(7);
        expect(screen.getByRole("heading")).toBeInTheDocument();
        expect(mountSpy).toHaveBeenCalledTimes(2);
        expect(cleanupSpy).toHaveBeenCalledOnce();

        setCount(-3);
        setCount(5);
        setCount(-2);
        expect(mountSpy).toHaveBeenCalledTimes(3);
        expect(cleanupSpy).toHaveBeenCalledTimes(3);
    });

    it("falls back for keyed as well", () => {
        const [data, setData] = createSignal<any>(false);

        render(() => (
            <Show when={data} fallback={() => `${data()} is falsy`} keyed>
                {(d) => `value is ${d}`}
            </Show>
        ));

        expect(screen.getByText("false is falsy")).toBeInTheDocument();
        expect(screen.queryByText("value is", { exact: false })).not.toBeInTheDocument();

        setData(0);
        expect(screen.getByText("0 is falsy")).toBeInTheDocument();
        expect(screen.queryByText("value is", { exact: false })).not.toBeInTheDocument();

        setData(4);
        expect(screen.queryByText("falsy", { exact: false })).not.toBeInTheDocument();
        expect(screen.getByText("value is 4")).toBeInTheDocument();

        setData([1, 2]);
        expect(screen.queryByText("falsy", { exact: false })).not.toBeInTheDocument();
        expect(screen.getByText("value is 1,2")).toBeInTheDocument();
    });
});

describe("Keyed <Show /> component", () => {
    it("takes children same as non-keyed", () => {
        const [count, setCount] = createSignal(0);

        const { container } = render(() => (
            <Show when={() => count() >= 5} keyed>
                Before - <span data-testid="count">{count}</span>
                <span> - After</span>
            </Show>
        ));

        expect(container).toBeEmptyDOMElement();

        setCount(7);
        expect(screen.getByTestId("count").innerHTML).toBe("7");
        setCount(5);
        expect(screen.getByTestId("count").innerHTML).toBe("5");

        setCount(2);
        expect(container).toBeEmptyDOMElement();
    });

    it("accepts a function of the condition, which re-renders when condition changes", () => {
        const [count, setCount] = createSignal(0);

        const { container } = render(() => (
            <Show when={count} keyed>
                {(c) => <span>{c}</span>}
            </Show>
        ));

        expect(container).toBeEmptyDOMElement();

        setCount(7);
        expect((container.firstChild as HTMLSpanElement).innerHTML).toBe("7");
        // changed
        setCount(5);
        expect((container.firstChild as HTMLSpanElement).innerHTML).toBe("5");

        setCount(0);
        expect(container).toBeEmptyDOMElement();
    });

    it("doesn't call rendering function again when condition doesn't change", () => {
        const spy = vi.fn((c) => <span>{c}</span>);
        const [count, setCount] = createSignal(0);

        render(() => (
            <Show when={count} keyed>
                {spy}
            </Show>
        ));

        expect(spy).not.toHaveBeenCalled();

        setCount(7);
        expect(spy).toHaveBeenCalledOnce();
        setCount(7);
        expect(spy).toHaveBeenCalledOnce();

        setCount(0);
        expect(spy).toHaveBeenCalledOnce();
        setCount(NaN);
        expect(spy).toHaveBeenCalledOnce();

        setCount(11);
        expect(spy).toHaveBeenCalledTimes(2);
        setCount(13);
        expect(spy).toHaveBeenCalledTimes(3);

        expect(screen.getByText("13")).toBeInTheDocument();
    });

    it("recreates children from scratch at each state changes", () => {
        const [count, setCount] = createSignal(5);
        const [Cmp, mountSpy, cleanupSpy] = createMockComponent(count);

        render(() => (
            <Show when={count} keyed>
                {() => <Cmp />}
            </Show>
        ));

        expect(screen.getByRole("heading")).toBeInTheDocument();
        expect(mountSpy).toHaveBeenCalledOnce();
        expect(cleanupSpy).not.toHaveBeenCalled();

        setCount(11);
        setCount(7);
        expect(screen.getByRole("heading").innerHTML).toBe("7");
        expect(mountSpy).toHaveBeenCalledTimes(3);
        expect(cleanupSpy).toHaveBeenCalledTimes(2);

        setCount(0);
        expect(screen.queryByRole("heading")).not.toBeInTheDocument();
        expect(mountSpy).toHaveBeenCalledTimes(3);
        expect(cleanupSpy).toHaveBeenCalledTimes(3);
    });

    it("only rerenders when condition actually changes", () => {
        const spy = vi.fn((c) => <span>{c}</span>);
        const [count, setCount] = createSignal(0);

        render(() => (
            <Show when={() => count() >= 5} keyed>
                {spy}
            </Show>
        ));

        expect(spy).not.toHaveBeenCalled();

        setCount(7);
        expect(spy).toHaveBeenCalledOnce();
        setCount(5);
        expect(spy).toHaveBeenCalledOnce();

        setCount(2);
        expect(spy).toHaveBeenCalledOnce();

        setCount(11);
        expect(spy).toHaveBeenCalledTimes(2);
    });

    function whenKeyedValueIs(val: any) {
        const spy = vi.fn((c) => <span>{c}</span>);
        const [count, setCount] = createSignal(0);

        render(() => (
            <Show when={count} keyed={val}>
                {spy}
            </Show>
        ));

        setCount(2);
        setCount(5);

        return {
            expectSpyToHaveBeenCalledTwice() {
                expect(spy).toHaveBeenCalledTimes(2);
            },
            expectSpyToHaveBeenCalledOnce() {
                expect(spy).toHaveBeenCalledOnce();
            },
        };
    }

    it("accepts boolean or truthy value for keyed", () => {
        whenKeyedValueIs(true).expectSpyToHaveBeenCalledTwice();
        whenKeyedValueIs(1).expectSpyToHaveBeenCalledTwice();
        whenKeyedValueIs("keyed").expectSpyToHaveBeenCalledTwice();
    });

    it("ignores false or falsy value for keyed", () => {
        whenKeyedValueIs(false).expectSpyToHaveBeenCalledOnce();
        whenKeyedValueIs(null).expectSpyToHaveBeenCalledOnce();
        whenKeyedValueIs(undefined).expectSpyToHaveBeenCalledOnce();
        whenKeyedValueIs(0).expectSpyToHaveBeenCalledOnce();
    });
});
