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
            <ContextProvider value="A">
                <main>
                    <ContextProvider value="B">
                        <div>
                            <CompB />
                        </div>
                    </ContextProvider>
                </main>
            </ContextProvider>
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

describe("use multiple contexts", () => {
    const First = contextMocks();
    const Second = contextMocks();
    const Third = contextMocks();

    it("reads default value when inside another provider", () => {
        render(() => (
            <Third.ContextProvider value="A">
                <First.ContextProvider value="B">
                    <Second.UseDeepContext id="m" />
                </First.ContextProvider>
                <Second.ContextProvider value="C">
                    <First.UseDeepContext id="n" />
                </Second.ContextProvider>
            </Third.ContextProvider>
        ));

        expect(screen.getByTestId("m")).toHaveTextContent(ContextValues.DEFAULT.value);
        expect(screen.getByTestId("n")).toHaveTextContent(ContextValues.DEFAULT.value);
    });

    it("reads value from its respective provider (side by side)", () => {
        const [className, setClassName] = createSignal("c0");

        render(() => (
            <div>
                <First.ContextProvider value="A">
                    <First.UseDeepContext id="m" className={className} />
                </First.ContextProvider>
                <br />
                <Second.ContextProvider value="B">
                    <Second.UseDeepContext id="n" className={className} />
                </Second.ContextProvider>
            </div>
        ));

        expect(screen.getByTestId("m")).toHaveClass("c0");
        expect(screen.getByTestId("m")).toHaveTextContent("A");
        expect(screen.getByTestId("n")).toHaveTextContent("B");

        setClassName("c1");
        expect(screen.getByTestId("m")).toHaveClass("c1");
        expect(screen.getByTestId("m")).toHaveTextContent("A");
        expect(screen.getByTestId("n")).toHaveTextContent("B");
    });

    it("reads value from its respective provider (nested)", () => {
        const [className, setClassName] = createSignal("c0");

        render(() => (
            <First.ContextProvider value="A">
                <div>
                    <Second.ContextProvider value="B">
                        <First.UseDeepContext id="m" className={className} />
                        <Second.UseDeepContext id="n" className={className} />
                    </Second.ContextProvider>
                </div>
            </First.ContextProvider>
        ));

        expect(screen.getByTestId("m")).toHaveTextContent("A");
        expect(screen.getByTestId("n")).toHaveTextContent("B");
        expect(screen.getByTestId("n")).toHaveClass("c0");

        setClassName("c1");
        expect(screen.getByTestId("m")).toHaveTextContent("A");
        expect(screen.getByTestId("n")).toHaveTextContent("B");
        expect(screen.getByTestId("n")).toHaveClass("c1");
    });

    it("reads value from deepest context provider (nested)", () => {
        const [className, setClassName] = createSignal("c0");

        const CompC = () => () => (
            <>
                <First.Context.Provider value={ContextValues.C}>
                    <Second.Context.Provider value={ContextValues.D}>
                        <font size="2">
                            <label>
                                <First.UseDeepContext id="o1" className={className} />
                                <Second.UseDeepContext id="o2" className={className} />
                            </label>
                        </font>
                    </Second.Context.Provider>
                </First.Context.Provider>
                <First.UseDeepContext id="p1" className={className} />
            </>
        );
        const CompB = () => () => (
            <div>
                <First.UseDeepContext id="n1" className={className} />
                <CompC />
                <Second.UseDeepContext id="n2" className={className} />
            </div>
        );

        render(() => (
            <Third.ContextProvider value="E">
                <First.ContextProvider value="A">
                    <First.UseDeepContext id="m1" className={className} />
                    <main>
                        <First.ContextProvider value="B">
                            <CompB />
                        </First.ContextProvider>
                    </main>
                    <Second.UseDeepContext id="m2" className={className} />
                </First.ContextProvider>
            </Third.ContextProvider>
        ));

        expect(screen.getByTestId("m1")).toHaveClass("c0");
        expect(screen.getByTestId("m1")).toHaveTextContent("A");
        expect(screen.getByTestId("n1")).toHaveTextContent("B");
        expect(screen.getByTestId("o1")).toHaveTextContent("C");
        expect(screen.getByTestId("p1")).toHaveTextContent("B");
        expect(screen.getByTestId("m2")).toHaveTextContent(ContextValues.DEFAULT.value);
        expect(screen.getByTestId("n2")).toHaveTextContent(ContextValues.DEFAULT.value);
        expect(screen.getByTestId("o2")).toHaveTextContent("D");
        expect(screen.getByTestId("o2")).toHaveClass("c0");

        setClassName("c1");
        expect(screen.getByTestId("m1")).toHaveClass("c1");
        expect(screen.getByTestId("m1")).toHaveTextContent("A");
        expect(screen.getByTestId("n1")).toHaveTextContent("B");
        expect(screen.getByTestId("o1")).toHaveTextContent("C");
        expect(screen.getByTestId("p1")).toHaveTextContent("B");
        expect(screen.getByTestId("m2")).toHaveTextContent(ContextValues.DEFAULT.value);
        expect(screen.getByTestId("n2")).toHaveTextContent(ContextValues.DEFAULT.value);
        expect(screen.getByTestId("o2")).toHaveTextContent("D");
        expect(screen.getByTestId("o2")).toHaveClass("c1");
    });

    it("reads value from deepest context provider (conditional)", () => {
        const [passthrough1, setPassthrough1] = createSignal(true);
        const [passthrough2, setPassthrough2] = createSignal(true);
        const [display, setDisplay] = createSignal(true);
        const [number, setNumber] = createSignal(1);
        const [className, setClassName] = createSignal("c0");

        const CompB = () => () => (
            <Dynamic component={() => (passthrough1() ? "div" : First.ContextProvider)} value="D">
                <Dynamic component={() => (passthrough2() ? "div" : Second.ContextProvider)} value="E">
                    <First.UseDeepContext id="m" className={className} />
                    <Second.UseDeepContext id="n" className={className} />
                    <First.ShowContext id="o" when={display} className={className} />
                    <Second.SwitchContext
                        id="p"
                        cond1={() => number() % 3 === 1}
                        cond2={() => number() % 3 === 2}
                        className={className}
                    />
                </Dynamic>
            </Dynamic>
        );

        render(() => (
            <First.ContextProvider value="A">
                <Second.ContextProvider value="B">
                    <Third.ContextProvider value="C">
                        <main>
                            <CompB />
                        </main>
                    </Third.ContextProvider>
                </Second.ContextProvider>
            </First.ContextProvider>
        ));

        check("A", "B", true, 1);
        setPassthrough1(false);
        setPassthrough2(false);
        check("D", "E", true, 1);
        setPassthrough1(true);
        setPassthrough2(true);
        check("A", "B", true, 1);
        setDisplay(false);
        check("A", "B", false, 1);
        setPassthrough1(false);
        setPassthrough2(false);
        check("D", "E", false, 1);
        setDisplay(true);
        check("D", "E", true, 1);
        setPassthrough1(true);
        setPassthrough2(true);
        setNumber(2);
        check("A", "B", true, 2);
        setNumber(0);
        check("A", "B", true, 0);
        setNumber(1);
        check("A", "B", true, 1);
        setDisplay(false);
        setPassthrough1(false);
        setPassthrough2(false);
        setNumber(0);
        check("D", "E", false, 0);
        setNumber(2);
        check("D", "E", false, 2);
        setNumber(1);
        check("D", "E", false, 1);

        function check(value1: string, value2: string, displayed: boolean, branch: number) {
            expect(screen.getByTestId("m")).toHaveClass(className());
            expect(screen.getByTestId("m")).toHaveTextContent(value1);
            expect(screen.getByTestId("n")).toHaveTextContent(value2);
            if (displayed) {
                expect(screen.getByTestId("o")).toHaveClass(className());
                expect(screen.getByTestId("o")).toHaveTextContent(value1);
            } else {
                expect(screen.queryByTestId("q")).not.toBeInTheDocument();
            }
            if (branch === 1) {
                expect(screen.getByTestId("p")).toHaveClass(className());
                expect(screen.getByTestId("p")).toHaveTextContent(value2);
                expect(screen.getByTestId("p")).toHaveAttribute("title");
            } else if (branch === 2) {
                expect(screen.getByTestId("p")).toHaveClass(className());
                expect(screen.getByTestId("p")).toHaveTextContent(value2);
                expect(screen.getByTestId("p")).not.toHaveAttribute("title");
            } else {
                expect(screen.queryByTestId("p")).not.toBeInTheDocument();
            }

            if (className() === "c0") {
                // Re-render and recheck (all same results are expected)
                setClassName("c1");
                check(value1, value2, displayed, branch);
            } else {
                // since check is called recursively this puts the state back
                // to its initial position
                setClassName("c0");
            }
        }
    });
});

describe.todo("use context with lazy(), <For /> & <Portal />");
