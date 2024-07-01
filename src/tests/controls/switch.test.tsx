import { describe, expect, it, vi } from "vitest";
import { render, screen } from "../utils";
import {
    h,
    Fragment,
    createSignal,
    Switch,
    Match,
    For,
    toValue,
    Accessor,
    ValueOrAccessor,
    SuppleNode,
} from "../../core";
import { createMockComponent } from "../mocks/mock_component";

describe("Static <Switch /> with <Match /> cases", () => {
    it("reacts to change of match condition", () => {
        const [content, setContent] = createSignal(1);
        const [Hello, mountHello, cleanupHello] = createMockComponent("Hello");
        const [World, mountWorld, cleanupWorld] = createMockComponent("world!");
        const [Fallback, mountFallback, cleanupFallback] = createMockComponent("Fallback");

        render(() => (
            <Switch fallback={<Fallback />}>
                <Match when={() => content() === 1}>
                    <Hello />
                </Match>
                <Match when={() => content() === 2}>
                    <World />
                </Match>
            </Switch>
        ));

        expect(screen.getByText("Hello")).toBeInTheDocument();
        expect(screen.queryByText("world!")).not.toBeInTheDocument();
        expect(screen.queryByText("Fallback")).not.toBeInTheDocument();
        expect(mountHello).toHaveBeenCalledOnce();
        expect(cleanupHello).not.toHaveBeenCalled();
        expect(mountWorld).not.toHaveBeenCalled();
        expect(mountFallback).not.toHaveBeenCalled();

        setContent(2);
        expect(screen.getByText("world!")).toBeInTheDocument();
        expect(screen.queryByText("Hello")).not.toBeInTheDocument();
        expect(screen.queryByText("Fallback")).not.toBeInTheDocument();
        expect(mountHello).toHaveBeenCalledOnce();
        expect(cleanupHello).toHaveBeenCalledOnce();
        expect(mountWorld).toHaveBeenCalledOnce();
        expect(cleanupWorld).not.toHaveBeenCalled();
        expect(mountFallback).not.toHaveBeenCalled();

        setContent(0);
        expect(screen.getByText("Fallback")).toBeInTheDocument();
        expect(screen.queryByText("Hello")).not.toBeInTheDocument();
        expect(screen.queryByText("world!")).not.toBeInTheDocument();
        expect(mountHello).toHaveBeenCalledOnce();
        expect(cleanupHello).toHaveBeenCalledOnce();
        expect(mountWorld).toHaveBeenCalledOnce();
        expect(cleanupWorld).toHaveBeenCalledOnce();
        expect(mountFallback).toHaveBeenCalledOnce();
        expect(cleanupFallback).not.toHaveBeenCalled();

        setContent(1);
        expect(screen.getByText("Hello")).toBeInTheDocument();
        expect(screen.queryByText("world!")).not.toBeInTheDocument();
        expect(screen.queryByText("Fallback")).not.toBeInTheDocument();
        expect(mountHello).toHaveBeenCalledTimes(2);
        expect(cleanupHello).toHaveBeenCalledOnce();
        expect(mountWorld).toHaveBeenCalledOnce();
        expect(cleanupWorld).toHaveBeenCalledOnce();
        expect(mountFallback).toHaveBeenCalledOnce();
        expect(cleanupFallback).toHaveBeenCalledOnce();
    });

    it("takes single or multiple children", () => {
        const [content, setContent] = createSignal("");

        const { container } = render(() => (
            <Switch>
                <Match when={() => content().startsWith("-")}>
                    <h1>{content}</h1>
                </Match>
                <Match when={content}>
                    <h1>Hello</h1>
                    <p>{content}</p>
                </Match>
            </Switch>
        ));

        expect(container).toBeEmptyDOMElement();

        setContent("-5");
        expect(container.children.length).toBe(1);
        expect((container.firstChild as HTMLHeadingElement).innerHTML).toBe("-5");
        setContent("-13");
        expect((container.firstChild as HTMLHeadingElement).innerHTML).toBe("-13");

        setContent("2");
        expect(container.children.length).toBe(2);
        expect((container.lastChild as HTMLHeadingElement).innerHTML).toBe("2");
        setContent("13");
        expect((container.lastChild as HTMLHeadingElement).innerHTML).toBe("13");
    });

    it("recreates children from scratch", () => {
        // also accepts a signal as direct child
        const [content, setContent] = createSignal("abcdefg");
        const [Cmp, mountSpy, cleanupSpy] = createMockComponent(content);

        render(() => (
            <Switch>
                <Match when={() => content().length >= 6}>
                    <Cmp />
                </Match>
                <Match when={() => content().length >= 3}>{content}</Match>
            </Switch>
        ));

        expect(screen.getByRole("heading")).toBeInTheDocument();
        expect(mountSpy).toHaveBeenCalledOnce();
        expect(cleanupSpy).not.toHaveBeenCalled();

        setContent("supplejs");
        expect(screen.getByRole("heading").innerHTML).toBe("supplejs");
        expect(mountSpy).toHaveBeenCalledOnce();
        expect(cleanupSpy).not.toHaveBeenCalled();

        setContent("123");
        expect(screen.queryByRole("heading")).not.toBeInTheDocument();
        expect(mountSpy).toHaveBeenCalledOnce();
        expect(cleanupSpy).toHaveBeenCalledOnce();
        expect(screen.getByText("123")).toBeInTheDocument();

        setContent("abc");
        expect(screen.queryByText("123")).not.toBeInTheDocument();
        expect(mountSpy).toHaveBeenCalledOnce();
        expect(cleanupSpy).toHaveBeenCalledOnce();
        expect(screen.getByText("abc")).toBeInTheDocument();

        mountSpy.mockClear();
        cleanupSpy.mockClear();
        setContent("supplejs");
        expect(mountSpy).toHaveBeenCalled();
        expect(cleanupSpy.mock.calls.length).toBe(mountSpy.mock.calls.length - 1);

        setContent("x");
        expect(cleanupSpy.mock.calls.length).toBe(mountSpy.mock.calls.length);

        mountSpy.mockClear();
        cleanupSpy.mockClear();
        setContent("abcdefg");
        setContent("xyz");
        expect(mountSpy).toHaveBeenCalled();
        expect(cleanupSpy.mock.calls.length).toBe(mountSpy.mock.calls.length);
    });

    it("displays first match condition when multiple ones match", () => {
        const [visible, setVisible] = createSignal(true);

        const { container } = render(() => (
            <Switch>
                <Match when={visible}>Hello</Match>
                <Match when={true}>world!</Match>
                <Match when={true}>hidden</Match>
            </Switch>
        ));

        expect(container.innerHTML).toBe("Hello");
        setVisible(false);
        expect(container.innerHTML).toBe("world!");
    });

    it("ignores direct children of <Switch /> that are not <Match /> components", () => {
        const [visible, setVisible] = createSignal(true);

        const { container } = render(() => (
            <Switch>
                abc
                <p>Lorem ipsum</p>
                <Match when={false}>world!</Match>
                {123}
                <Match when={visible}>Hello</Match>
            </Switch>
        ));

        expect(container.innerHTML).toBe("Hello");
        setVisible(false);
        expect(container).toBeEmptyDOMElement();
    });
});

describe("Keyed & non-keyed <Switch />", () => {
    it("accepts a function of the condition", () => {
        const [count, setCount] = createSignal(0);

        const { container } = render(() => (
            <Switch>
                <Match when={() => count() < 0}>
                    <h1>negative</h1>
                </Match>
                <Match when={count}>{(c) => <h1>{c}</h1>}</Match>
            </Switch>
        ));

        expect(container).toBeEmptyDOMElement();
        setCount(-7);
        expect(screen.getByRole("heading").innerHTML).toBe("negative");
        setCount(5);
        expect(screen.getByRole("heading").innerHTML).toBe("5");
        setCount(0);
        expect(container).toBeEmptyDOMElement();
    });

    it("doesn't rerender children when condition doesn't change", () => {
        const spy = vi.fn(() => "hello");
        const [count, setCount] = createSignal(0);

        render(() => (
            <Switch>
                <Match when={() => count() < 0}>
                    <h1>negative</h1>
                    <span>{spy}</span>
                </Match>
                <Match when={count}>{spy}</Match>
            </Switch>
        ));

        expect(spy).not.toHaveBeenCalled();

        setCount(-7);
        expect(spy).toHaveBeenCalledOnce();
        setCount(-5);
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

    it("accepts a function of the condition, which re-renders when condition changes", () => {
        const spy = vi.fn((c) => c);
        const [content, setContent] = createSignal("f");

        const { container } = render(() => (
            <Switch fallback={content} keyed>
                <Match when={() => content().length > 6}>
                    {(c) => (
                        <>
                            <h1>long</h1>
                            <span>{spy(c)}</span>
                        </>
                    )}
                </Match>
                <Match when={() => content().substring(3)}>{(c) => `...${spy(c)}`}</Match>
            </Switch>
        ));

        expect(container.innerHTML).toBe("f");
        expect(spy).not.toHaveBeenCalled();

        setContent("abcdefgh");
        expect((container.firstChild as HTMLSpanElement).innerHTML).toBe("long");
        expect(spy).toHaveBeenCalledWith(true);

        spy.mockClear();
        setContent("supplejs");
        expect((container.firstChild as HTMLSpanElement).innerHTML).toBe("long");
        expect(spy).not.toHaveBeenCalled();

        setContent("abc");
        expect(container.innerHTML).toBe("abc");
        expect(spy).not.toHaveBeenCalled();

        setContent("abc123");
        expect(container.innerHTML).toBe("...123");
        expect(spy).toHaveBeenCalledWith("123");
        // changed
        spy.mockClear();
        setContent("abcdef");
        expect(container.innerHTML).toBe("...def");
        expect(spy).toHaveBeenCalledWith("def");

        // not changed
        spy.mockClear();
        setContent("abcdef");
        expect(spy).not.toHaveBeenCalled();
    });
});

describe("<Switch /> with dynamic <Match /> cases", () => {
    function Matcher({ value, match }: { value: Accessor<number>; match: string | number }) {
        return () => <Match when={() => value() == match}>Matched {match}</Match>;
    }

    function ComplexMatcher({
        value,
        match,
        children,
    }: {
        value: Accessor<number>;
        match: string | number;
        children?: SuppleNode;
    }) {
        return () => (
            <>
                <Match when={() => value() == match}>Matched {match}</Match>
                {children}
                <div>
                    <Match when={() => value() == 1}>Error</Match>
                </div>
            </>
        );
    }
    type SwitchAppProps = {
        forValues: Accessor<number[]>;
        displayTwenty: Accessor<boolean>;
        sixteen: ValueOrAccessor<number | string>;
        value: Accessor<number>;
    };
    function SwitchApp({ forValues, displayTwenty, sixteen, value }: SwitchAppProps) {
        return () => (
            <Switch fallback="No match!">
                <For each={forValues}>{(v) => <Matcher value={value} match={v} />}</For>
                --
                <ComplexMatcher value={value} match="14">
                    <Match when={() => value() == 15}>Matched 15</Match>
                    <p>
                        <Match when={() => value() == 2}>Error</Match>
                    </p>
                </ComplexMatcher>
                --
                <Match when={() => value() == toValue(sixteen)}>
                    <p>Matched 16</p>
                </Match>
                --
                {[
                    <Match when={() => value() == 17}>Matched 17</Match>,
                    <span>
                        <Match when={() => value() == 3}>Error</Match>
                    </span>,
                    <Match when={() => value() == 18}>Matched 18</Match>,
                ]}
                --
                <>
                    <Match when={() => value() == 19}>Matched 19</Match>
                    <p>
                        <Match when={() => value() == 4}>Error</Match>
                    </p>
                </>
                --
                {() => {
                    if (!displayTwenty()) {
                        return <Match when={() => value() == 21}>Matched 21</Match>;
                    } else {
                        return (
                            <>
                                <Match when={() => value() == 20}>
                                    <span>Matched 20</span>
                                </Match>
                                ;<Match when={() => value() == 21}>Matched 21</Match>;
                            </>
                        );
                    }
                }}
                --
                <p>
                    <Match when={() => value() == 5}>Error</Match>
                </p>
            </Switch>
        );
    }

    it("accepts <Match /> cases nested in fragments, arrays or other components", () => {
        const [value, setValue] = createSignal(8);

        const { container } = render(() => (
            <SwitchApp
                forValues={() => [10, 11, 12, 13]}
                displayTwenty={() => true}
                sixteen="16"
                value={value}
            />
        ));

        expect(container).toHaveTextContent("No match!");

        for (let i = 10; i <= 21; i++) {
            setValue(i);
            expect(container).toHaveTextContent("Matched " + i);
        }
    });

    it("ignores <Match /> cases that are not direct children", () => {
        const [value, setValue] = createSignal(10);

        const { container } = render(() => (
            <SwitchApp forValues={() => [10]} displayTwenty={() => false} sixteen={16} value={value} />
        ));

        expect(container).toHaveTextContent("Matched 10");

        for (let i = 1; i <= 9; i++) {
            setValue(i);
            expect(container).toHaveTextContent("No match!");
        }
    });

    it("re-evaluates match conditions when cases are added or removed", () => {
        const [value, setValue] = createSignal(13);
        const [forValues, setForValues] = createSignal([10, 11, 12]);
        const [displayTwenty, setDisplayTwenty] = createSignal(false);
        const [sixteen, setSixteen] = createSignal(16);

        const { container } = render(() => (
            <SwitchApp forValues={forValues} displayTwenty={displayTwenty} sixteen={sixteen} value={value} />
        ));

        expect(container.innerHTML).toBe("No match!");

        setForValues([10, 11, 12, 13]);
        expect(container.innerHTML).toBe("Matched 13");

        setValue(20);
        expect(container.innerHTML).toBe("No match!");

        setForValues([10, 20]);
        expect(container.innerHTML).toBe("Matched 20");

        setDisplayTwenty(true);
        expect(container.innerHTML).toBe("Matched 20"); // from <For />

        setForValues([10, 12]);
        expect(container.innerHTML).toBe("<span>Matched 20</span>");

        setDisplayTwenty(false);
        expect(container.innerHTML).toBe("No match!");

        setDisplayTwenty(true);
        expect(container.innerHTML).toBe("<span>Matched 20</span>");

        setSixteen(20);
        expect(container.innerHTML).toBe("<p>Matched 16</p>");

        setForValues([10, 20]);
        expect(container.innerHTML).toBe("Matched 20"); // from <For />

        setForValues([20, 12, 11, 1]);
        expect(container.innerHTML).toBe("Matched 20"); // from <For />

        setValue(16);
        expect(container.innerHTML).toBe("No match!");

        setForValues([16, 2]);
        expect(container.innerHTML).toBe("Matched 16"); // from <For />

        setSixteen(16);
        expect(container.innerHTML).toBe("Matched 16"); // from <For />

        setForValues([]);
        expect(container.innerHTML).toBe("<p>Matched 16</p>");

        setSixteen(0);
        expect(container.innerHTML).toBe("No match!");
    });
});
