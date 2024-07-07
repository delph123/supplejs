import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitForElementToBeRemoved } from "supplejs-testing-library";
import {
    h,
    Fragment,
    ErrorBoundary,
    createSignal,
    toValue,
    For,
    ValueOrAccessor,
    onCleanup,
    lazy,
    Show,
    Portal,
} from "../../core";
import { createMockComponent } from "../mocks/mock_component";
import { createWaitableMock } from "../utils";

describe("<ErrorBoundary /> component", () => {
    it("displays children content without error", () => {
        function ListItem({ text }: { text: string }) {
            return () => <li>{() => text}</li>;
        }

        const { asFragment } = render(() => (
            <div>
                <ErrorBoundary fallback={<span>Error</span>}>
                    <ul>
                        <ListItem text="hello" />
                        <ListItem text="world!" />
                    </ul>
                </ErrorBoundary>
            </div>
        ));

        expect(asFragment()).toEqual("<div><ul><li>hello</li><li>world!</li></ul></div>");
    });

    it("displays fallback with error", async () => {
        function ListItem(_props: { text: string }) {
            return () => (
                <li>
                    {() => {
                        throw new Error("1");
                    }}
                </li>
            );
        }

        const { asFragment } = render(() => (
            <div>
                <ErrorBoundary fallback={<span>Error</span>}>
                    <ul>
                        <ListItem text="hello" />
                        <ListItem text="world!" />
                    </ul>
                </ErrorBoundary>
            </div>
        ));

        await screen.findByText("Error");
        expect(asFragment()).toEqual("<div><span>Error</span></div>");
    });

    it("reactively updates children without error and switch to fallback after error", async () => {
        const [labels, setLabels] = createSignal<ValueOrAccessor<string>[]>(["hello", "world!"]);

        function ListItem({ text }: { text: ValueOrAccessor<string> }) {
            return () => <li>{() => toValue(text)}</li>;
        }

        const { asFragment } = render(() => (
            <ul>
                <ErrorBoundary fallback={<li>Error</li>}>
                    <For each={labels}>{(label) => <ListItem text={label} />}</For>
                </ErrorBoundary>
            </ul>
        ));

        expect(asFragment()).toEqual("<ul><li>hello</li><li>world!</li></ul>");

        setLabels(["hello", "you!"]);
        expect(asFragment()).toEqual("<ul><li>hello</li><li>you!</li></ul>");

        setLabels([
            "hello",
            () => {
                throw new Error(":(");
            },
        ]);
        await screen.findByText("Error");
        expect(asFragment()).toEqual("<ul><li>Error</li></ul>");
    });

    it("doesn't rerender after an error", async () => {
        const [label, setLabel] = createSignal<ValueOrAccessor<string>>("world!");
        const spy = vi.fn((x) => x);

        function ListItem({ text }: { text: ValueOrAccessor<ValueOrAccessor<string>> }) {
            return () => <li>{() => spy(toValue(toValue(text)))}</li>;
        }

        const { asFragment } = render(() => (
            <ul>
                <ErrorBoundary fallback={<li>Error</li>}>
                    <ListItem text="hello" />
                    <ListItem text={label} />
                </ErrorBoundary>
            </ul>
        ));

        expect(asFragment()).toEqual("<ul><li>hello</li><li>world!</li></ul>");

        spy.mockClear();
        setLabel(() => () => {
            throw new Error(":(");
        });
        await screen.findByText("Error");
        expect(asFragment()).toEqual("<ul><li>Error</li></ul>");
        expect(spy).not.toHaveBeenCalled();

        setLabel("you!");
        expect(asFragment()).toEqual("<ul><li>Error</li></ul>");
        expect(spy).not.toHaveBeenCalled();
    });

    it("accepts a function with error & retry parameters as fallback", async () => {
        const spy = vi.fn((error, _) => {
            return (
                <>
                    <h1>Error</h1>
                    <p>{error.message}</p>
                </>
            );
        });

        const { asFragment } = render(() => (
            <div>
                <ErrorBoundary fallback={spy}>
                    {() => {
                        throw new Error("Wrong data");
                    }}
                </ErrorBoundary>
            </div>
        ));

        await screen.findByText("Error");
        expect(asFragment()).toEqual("<div><h1>Error</h1><p>Wrong data</p></div>");
        expect(spy).toHaveBeenCalledOnce();
        expect(spy.mock.calls[0].length).toBe(2);
        expect(spy.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(spy.mock.calls[0][1]).toBeTypeOf("function");
    });

    it("rerenders children when retry function is called", async () => {
        const [count, setCount] = createSignal(0);
        const fallbackSpy = createWaitableMock();
        const spy = vi.fn((x) => x);

        render(() => (
            <ErrorBoundary
                fallback={(error, retry) => {
                    fallbackSpy();
                    return <button onClick={retry}>{error.message}</button>;
                }}
            >
                {() => {
                    if (spy(count()) === 1) {
                        throw new Error("Error");
                    } else {
                        return count();
                    }
                }}
            </ErrorBoundary>
        ));

        [spy, fallbackSpy].forEach((s) => s.mockClear());

        setCount(1);
        await screen.findByText("Error");
        expect(spy).toHaveBeenCalledWith(1);
        expect(fallbackSpy).toHaveBeenCalledOnce();

        // Same error
        [spy, fallbackSpy].forEach((s) => s.mockClear());
        fireEvent.click(screen.getByRole("button"));
        await fallbackSpy.waitToHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(1);
        expect(fallbackSpy).toHaveBeenCalledOnce();

        // No error
        setCount(2);
        [spy, fallbackSpy].forEach((s) => s.mockClear());
        fireEvent.click(screen.getByRole("button"));
        expect(spy).toHaveBeenCalledWith(2);
        expect(fallbackSpy).not.toHaveBeenCalled();
    });

    it("cleans-up and recreates components from scratch when toggling between error/non-error states", async () => {
        const [count, setCount] = createSignal(5);
        const [Cmp, mountSpy, cleanupSpy] = createMockComponent(count);
        const cleanupFallbackSpy = vi.fn();

        render(() => (
            <ErrorBoundary
                fallback={(error, retry) => {
                    onCleanup(cleanupFallbackSpy);
                    return <button onClick={retry}>{error.message}</button>;
                }}
            >
                <Cmp />
                {() => {
                    if (count() === 1) {
                        throw new Error("Error");
                    } else {
                        return "ok";
                    }
                }}
            </ErrorBoundary>
        ));

        expect(screen.getByRole("heading")).toHaveTextContent("5");
        expect(mountSpy).toHaveBeenCalledOnce();
        expect(cleanupSpy).not.toHaveBeenCalled();
        expect(cleanupFallbackSpy).not.toHaveBeenCalled();

        setCount(1);
        await screen.findByText("Error");
        expect(screen.queryByRole("heading")).not.toBeInTheDocument();
        expect(mountSpy).toHaveBeenCalledOnce();
        expect(cleanupSpy).toHaveBeenCalledOnce();
        expect(cleanupFallbackSpy).not.toHaveBeenCalled();

        setCount(7);
        fireEvent.click(screen.getByRole("button"));
        expect(screen.getByRole("heading")).toHaveTextContent("7");
        expect(mountSpy).toHaveBeenCalledTimes(2);
        expect(cleanupSpy).toHaveBeenCalledOnce();
        expect(cleanupFallbackSpy).toHaveBeenCalledOnce();

        setCount(1);
        await screen.findByText("Error");
        setCount(7);
        fireEvent.click(screen.getByRole("button"));
        setCount(1);
        await screen.findByText("Error");
        expect(mountSpy).toHaveBeenCalledTimes(3);
        expect(cleanupSpy).toHaveBeenCalledTimes(3);
        expect(cleanupFallbackSpy).toHaveBeenCalledTimes(2);
    });

    it("catch only errors of nested children", () => {
        const [count, setCount] = createSignal(5);

        expect(() =>
            render(() => (
                <>
                    <ErrorBoundary fallback="error">
                        <p>{() => "nice"}</p>
                    </ErrorBoundary>
                    {() => {
                        throw new Error(":(");
                    }}
                </>
            )),
        ).toThrow();

        render(() => (
            <div>
                <ErrorBoundary fallback="error">
                    <p>{() => "nice"}</p>
                </ErrorBoundary>
                {() => {
                    if (count() === 1) {
                        throw new Error("Error");
                    } else {
                        return "ok";
                    }
                }}
            </div>
        ));

        expect(() => setCount(1)).toThrow();
    });

    it("can be nested", async () => {
        function Label({ value }: { value: ValueOrAccessor<string> }) {
            return () => <>{() => toValue(value)}!</>;
        }

        function Cmp({ label, error }: { label: string; error?: boolean }) {
            return () => (
                <span>
                    <ErrorBoundary fallback={label}>
                        <Label
                            value={() => {
                                if (error) {
                                    throw new Error(":(");
                                } else {
                                    return label;
                                }
                            }}
                        />
                    </ErrorBoundary>
                </span>
            );
        }

        const { asFragment } = render(() => (
            <ul>
                <ErrorBoundary fallback="error">
                    <li>
                        <Cmp label="hello" error />
                    </li>
                    <li>
                        <Cmp label="wonderful" error />
                    </li>
                    <li>
                        <Cmp label="world" />
                    </li>
                </ErrorBoundary>
            </ul>
        ));

        await screen.findByText("wonderful");
        expect(asFragment()).toEqual(
            "<ul><li><span>hello</span></li><li><span>wonderful</span></li><li><span>world!</span></li></ul>",
        );
    });

    it("rethrow up the line", async () => {
        function Label({ value }: { value: ValueOrAccessor<string> }) {
            return () => <>{() => toValue(value)}!</>;
        }

        function Cmp({ label, error }: { label: string; error?: boolean }) {
            return () => (
                <span>
                    <ErrorBoundary
                        fallback={(error) => {
                            throw error;
                        }}
                    >
                        <Label
                            value={() => {
                                if (error) {
                                    throw new Error(":(");
                                } else {
                                    return label;
                                }
                            }}
                        />
                    </ErrorBoundary>
                </span>
            );
        }

        const { asFragment } = render(() => (
            <ul>
                <ErrorBoundary fallback="error">
                    <li>
                        <Cmp label="hello" />
                    </li>
                    <li>
                        <Cmp label="wonderful" error />
                    </li>
                    <li>
                        <Cmp label="world" />
                    </li>
                </ErrorBoundary>
            </ul>
        ));

        await screen.findByText("error");
        expect(asFragment()).toEqual("<ul>error</ul>");
    });
});

describe("use <ErrorBoundary /> component in combination with createRoot", () => {
    it("works with lazy loaded component", async () => {
        const [visible, setVisible] = createSignal(false);

        let resolver;
        const Cmp = () => () => (
            <h1>
                <Show when={visible}>
                    {() => {
                        throw new Error(":(");
                    }}
                </Show>
                Title
            </h1>
        );
        const loader = () => {
            return new Promise<{ default: typeof Cmp }>((resolve) => {
                resolver = resolve;
            });
        };
        const LazyCmp = lazy(loader);

        render(() => (
            <main>
                <ErrorBoundary fallback="error">
                    <LazyCmp />
                    <p>Content</p>
                </ErrorBoundary>
            </main>
        ));

        expect(screen.getByRole("paragraph")).toHaveTextContent("Content");
        expect(screen.queryByRole("heading")).not.toBeInTheDocument();

        resolver!({ default: Cmp });
        await waitForElementToBeRemoved(() => screen.queryByText("Loading component..."));

        expect(screen.getByRole("paragraph")).toHaveTextContent("Content");
        expect(screen.getByRole("heading")).toHaveTextContent("Title");

        setVisible(true);
        await waitForElementToBeRemoved(() => screen.queryByRole("heading"));
        expect(screen.getByRole("main").innerHTML).toEqual("error");
    });

    it("works with <For /> component", async () => {
        const [err, setErr] = createSignal("");
        const [A, B, C] = [
            { label: "m", error: "" },
            { label: "n", error: err },
            { label: "o", error: "inner" },
        ];
        const [elements, setElements] = createSignal<{ label: string; error: ValueOrAccessor<string> }[]>([
            A,
            C,
        ]);

        function Label({ value }: { value: ValueOrAccessor<string> }) {
            return () => <>{() => toValue(value)}!</>;
        }

        function Cmp({ label, error }: { label: string; error: ValueOrAccessor<string> }) {
            return () => (
                <span>
                    <ErrorBoundary
                        fallback={() => {
                            if (toValue(error) === "outer") {
                                throw new Error("outer error");
                            } else {
                                return label;
                            }
                        }}
                    >
                        <Label
                            value={() => {
                                if (toValue(error) != "") {
                                    throw new Error("inner error");
                                } else {
                                    return label;
                                }
                            }}
                        />
                    </ErrorBoundary>
                </span>
            );
        }

        const { asFragment } = render(() => (
            <ErrorBoundary fallback="error">
                <ul>
                    <For each={elements}>
                        {({ label, error }) => (
                            <li>
                                <Cmp label={label} error={error} />
                            </li>
                        )}
                    </For>
                </ul>
            </ErrorBoundary>
        ));

        await screen.findByText("o");
        expect(screen.getAllByRole("listitem").map((e) => e.textContent)).toEqual(["m!", "o"]);

        setElements([A, B, C]);
        expect(screen.getAllByRole("listitem").map((e) => e.textContent)).toEqual(["m!", "n!", "o"]);

        setErr("inner");
        await screen.findByText("n");
        expect(screen.getAllByRole("listitem").map((e) => e.textContent)).toEqual(["m!", "n", "o"]);

        setErr("outer");
        await waitForElementToBeRemoved(() => screen.queryByRole("list"));
        expect(asFragment()).toEqual("error");
    });

    it("works with <Portal /> component", async () => {
        function Label({ value }: { value: ValueOrAccessor<string> }) {
            return () => <>{() => toValue(value)}!</>;
        }
        function Cmp() {
            return () => (
                <div>
                    <Label
                        value={() => {
                            throw new Error(":(");
                        }}
                    />
                </div>
            );
        }

        const { asFragment } = render(() => (
            <ErrorBoundary fallback="error">
                <main>
                    <Portal>
                        <div>
                            <ErrorBoundary
                                fallback={(err) => {
                                    throw err;
                                }}
                            >
                                <Portal>
                                    <aside>
                                        <Cmp />
                                    </aside>
                                </Portal>
                            </ErrorBoundary>
                        </div>
                    </Portal>
                </main>
            </ErrorBoundary>
        ));

        await screen.findByText("error");
        expect(asFragment()).toEqual("error");
    });
});
