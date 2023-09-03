import { describe, expect, it } from "vitest";
import { render } from "../utils";
import { h, Fragment, createSignal } from "../../core";

describe("DOM renderer", () => {
    it("renders string/number/bigint", () => {
        const { container } = render(() => [
            new Date(Date.UTC(2017, 4, 7, 19, 33, 47, 261)).toISOString(),
            ": ",
            2,
            " + ",
            3n,
            " = 5.",
        ]);
        expect(container.innerHTML).toBe("2017-05-07T19:33:47.261Z: 2 + 3 = 5.");
    });

    it("ignores boolean and nullish values", () => {
        const a = false;
        const { container } = render(() => (
            <p>
                Hello {a && <span>ignored</span>}
                {!a && <span>wor{undefined}ld!</span>} I run {a || "thanks"} {!a || "ignored as well"}to
                {false} Supp
                {null}leJS.
            </p>
        ));
        expect(container).toHaveTextContent("Hello world! I run thanks to SuppleJS.");
    });

    it("renders fragments and arrays", () => {
        const { container } = render(() => (
            <>
                {new Date(Date.UTC(2017, 4, 7, 19, 33, 47, 261)).toISOString()}: {[2, " + ", 3n]} = 5.
            </>
        ));
        expect(container.innerHTML).toBe("2017-05-07T19:33:47.261Z: 2 + 3 = 5.");
    });

    it("renders JSX and recursively renders children", () => {
        const { container } = render(() => (
            <ul id="supple">
                <li class="item1">elem1</li>
                <li className="item2">
                    <span>elem2</span>
                </li>
                <li classList={{ item3: true }}>elem3</li>
            </ul>
        ));
        expect(container.innerHTML).toBe(
            '<ul id="supple"><li class="item1">elem1</li><li class="item2"><span>elem2</span></li><li class="item3">elem3</li></ul>',
        );
    });

    it("calls functions which are children of JSX or members of an array", () => {
        const { container } = render(() => (
            <ul id="supple">{() => [1, 2, 3].map((n) => () => <li id={n}>elem{n}</li>)}</ul>
        ));
        expect(container.innerHTML).toBe(
            '<ul id="supple"><li id="1">elem1</li><li id="2">elem2</li><li id="3">elem3</li></ul>',
        );
    });

    it("accepts nested arrays and children", () => {
        const [show, setShow] = createSignal(false);
        const nestedList = ["a", ["a", ["a", ["a", "b", "c"], "c"], "c"], "c"];
        function mapList(l) {
            return l.map((e) => (Array.isArray(e) ? mapList(e) : <p>{e}</p>));
        }
        function Child({ children }: { children?: any }) {
            return () => (
                <>
                    hello <span>world</span>!
                    <>
                        {" "}
                        {children}
                        <p>2</p>
                    </>
                </>
            );
        }

        const { container } = render(() => {
            if (show()) {
                return (
                    <>
                        <p>one</p>
                        <>
                            <div>before</div>
                            <>
                                <Child>{mapList(nestedList)}</Child>
                                <div>between</div>
                            </>
                            {() => nestedList}
                            <div>after</div>
                        </>
                        <p>two</p>
                    </>
                );
            } else {
                return <></>;
            }
        });

        expect(container).toBeEmptyDOMElement();

        setShow(true);
        expect(container.innerHTML).toBe(
            "<p>one</p><div>before</div>hello <span>world</span>! <p>a</p><p>a</p><p>a</p><p>a</p><p>b</p><p>c</p><p>c</p><p>c</p><p>c</p><p>2</p><div>between</div>aaaabcccc<div>after</div><p>two</p>",
        );
    });
});
