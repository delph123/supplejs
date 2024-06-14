import { describe, expect, it, vi } from "vitest";
import { render, screen } from "../utils";
import { SuppleComponent, h, Fragment, Dynamic, createSignal } from "../../core";
import { ContextValues, UseContextProps, contextMocks } from "../mocks/mock_component";

describe("use single context", () => {
    const {
        Context,
        ContextProvider,
        UseDirectContext,
        UseRenderContext,
        UseDeepContext,
        useInlineContext,
        ShowContext,
        SwitchContext,
    } = contextMocks();

    it("reads default value without Provider", () => {
        render(() => <UseDeepContext id="m" />);
        expect(screen.getByTestId("m")).toHaveTextContent(ContextValues.DEFAULT.value);
    });

    it.each([UseDirectContext, UseRenderContext, UseDeepContext])(
        "reads value from deepest ContextProvider with %o",
        (ContextReader: SuppleComponent<UseContextProps>) => {
            const [className, setClassName] = createSignal("c0");

            const CompC = () => () => (
                <Context.Provider value={ContextValues.C}>
                    <font size="2">
                        <label>
                            <ContextReader id="o" className={className} />
                        </label>
                    </font>
                </Context.Provider>
            );
            const CompB = () => () => (
                <div>
                    <ContextReader id="n" className={className} />
                    <CompC />
                    <ContextReader id="p" className={className} />
                </div>
            );

            render(() => (
                <>
                    <ContextProvider value="A">
                        <ContextReader id="m" className={className} />
                        <ContextProvider value="B">
                            <CompB />
                        </ContextProvider>
                        <ContextReader id="q" className={className} />
                    </ContextProvider>
                    <ContextReader id="r" className={className} />
                </>
            ));

            expect(screen.getByTestId("m")).toHaveTextContent("A");
            expect(screen.getByTestId("n")).toHaveTextContent("B");
            expect(screen.getByTestId("o")).toHaveTextContent("C");
            expect(screen.getByTestId("p")).toHaveTextContent("B");
            expect(screen.getByTestId("q")).toHaveTextContent("A");
            expect(screen.getByTestId("r")).toHaveTextContent(ContextValues.DEFAULT.value);
            expect(screen.getByTestId("r")).toHaveClass("c0");

            setClassName("c1");
            expect(screen.getByTestId("m")).toHaveTextContent("A");
            expect(screen.getByTestId("n")).toHaveTextContent("B");
            expect(screen.getByTestId("o")).toHaveTextContent("C");
            expect(screen.getByTestId("p")).toHaveTextContent("B");
            expect(screen.getByTestId("q")).toHaveTextContent("A");
            expect(screen.getByTestId("r")).toHaveTextContent(ContextValues.DEFAULT.value);
            expect(screen.getByTestId("r")).toHaveClass("c1");
        },
    );

    it("reads value from deepest ContextProvider with inline method", () => {
        const [className, setClassName] = createSignal("c0");

        const CompC = () => () => (
            <Context.Provider value={ContextValues.C}>
                <font size="2">
                    <label>{useInlineContext({ id: "o", className })}</label>
                </font>
            </Context.Provider>
        );
        const CompB = () => () => (
            <div>
                {useInlineContext({ id: "n", className })}
                <CompC />
                {useInlineContext({ id: "p", className })}
            </div>
        );

        render(() => (
            <>
                <ContextProvider value="A">
                    {useInlineContext({ id: "m", className })}
                    <ContextProvider value="B">
                        <CompB />
                    </ContextProvider>
                    {useInlineContext({ id: "q", className })}
                </ContextProvider>
                {useInlineContext({ id: "r", className })}
            </>
        ));

        expect(screen.getByTestId("m")).toHaveClass("c0");
        expect(screen.getByTestId("m")).toHaveTextContent("A");
        expect(screen.getByTestId("n")).toHaveTextContent("B");
        expect(screen.getByTestId("o")).toHaveTextContent("C");
        expect(screen.getByTestId("p")).toHaveTextContent("B");
        expect(screen.getByTestId("q")).toHaveTextContent("A");
        expect(screen.getByTestId("r")).toHaveTextContent(ContextValues.DEFAULT.value);

        setClassName("c1");
        expect(screen.getByTestId("m")).toHaveClass("c1");
        expect(screen.getByTestId("m")).toHaveTextContent("A");
        expect(screen.getByTestId("n")).toHaveTextContent("B");
        expect(screen.getByTestId("o")).toHaveTextContent("C");
        expect(screen.getByTestId("p")).toHaveTextContent("B");
        expect(screen.getByTestId("q")).toHaveTextContent("A");
        expect(screen.getByTestId("r")).toHaveTextContent(ContextValues.DEFAULT.value);
    });

    it("reads value from deepest ContextProvider in conditional rendering", () => {
        const [passthrough, setPassthrough] = createSignal(true);
        const [display, setDisplay] = createSignal(true);
        const [number, setNumber] = createSignal(1);
        const [className, setClassName] = createSignal("c0");

        const CompB = () => () => (
            <Dynamic component={() => (passthrough() ? "div" : ContextProvider)} value="C">
                {useInlineContext({ id: "m", className })}
                <UseDirectContext id="n" className={className} />
                <UseRenderContext id="o" className={className} />
                <UseDeepContext id="p" className={className} />
                <ShowContext id="q" when={display} className={className} />
                <SwitchContext
                    id="r"
                    cond1={() => number() % 3 === 1}
                    cond2={() => number() % 3 === 2}
                    className={className}
                />
            </Dynamic>
        );

        render(() => (
            <>
                <ContextProvider value="A">
                    <main>
                        <ContextProvider value="B">
                            <div>
                                <CompB />
                            </div>
                        </ContextProvider>
                    </main>
                </ContextProvider>
            </>
        ));

        check("B", true, 1);
        setPassthrough(false);
        check("C", true, 1);
        setPassthrough(true);
        check("B", true, 1);
        setDisplay(false);
        check("B", false, 1);
        setPassthrough(false);
        check("C", false, 1);
        setDisplay(true);
        check("C", true, 1);
        setPassthrough(true);
        setNumber(2);
        check("B", true, 2);
        setNumber(0);
        check("B", true, 0);
        setNumber(1);
        check("B", true, 1);
        setDisplay(false);
        setPassthrough(false);
        setNumber(0);
        check("C", false, 0);
        setNumber(2);
        check("C", false, 2);
        setNumber(1);
        check("C", false, 1);

        function check(value: string, displayed: boolean, branch: number) {
            expect(screen.getByTestId("m")).toHaveClass(className());
            expect(screen.getByTestId("m")).toHaveTextContent(value);
            expect(screen.getByTestId("n")).toHaveTextContent(value);
            expect(screen.getByTestId("o")).toHaveTextContent(value);
            expect(screen.getByTestId("p")).toHaveTextContent(value);
            if (displayed) {
                expect(screen.getByTestId("q")).toHaveClass(className());
                expect(screen.getByTestId("q")).toHaveTextContent(value);
            } else {
                expect(screen.queryByTestId("q")).not.toBeInTheDocument();
            }
            if (branch === 1) {
                expect(screen.getByTestId("r")).toHaveClass(className());
                expect(screen.getByTestId("r")).toHaveTextContent(value);
                expect(screen.getByTestId("r")).toHaveAttribute("title");
            } else if (branch === 2) {
                expect(screen.getByTestId("r")).toHaveClass(className());
                expect(screen.getByTestId("r")).toHaveTextContent(value);
                expect(screen.getByTestId("r")).not.toHaveAttribute("title");
            } else {
                expect(screen.queryByTestId("r")).not.toBeInTheDocument();
            }

            if (className() === "c0") {
                // Re-render and recheck (all same results are expected)
                setClassName("c1");
                check(value, displayed, branch);
            } else {
                // since check is called recursively this puts the state back
                // to its initial position
                setClassName("c0");
            }
        }
    });

    it("prints error in the log when no tracking context exists", () => {
        const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        Context.Provider({ value: ContextValues.A });
        expect(logSpy).toHaveBeenCalledOnce();
        logSpy.mockRestore();
    });
});

describe.todo("use multiple contexts");

describe.todo("use context with <Portal />");
