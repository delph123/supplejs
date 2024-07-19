import { describe, expect, it } from "vitest";
import { Fragment, h, SuppleNode } from "../../core";
import { jsx, jsxDEV, jsxs } from "../../core/jsx-runtime";

const Aside = (props: { id?: string; className?: string; children?: SuppleNode }) => () => (
    <aside id={props.id} class={props.className}>
        {props.children}
    </aside>
);

const dummyHandler = () => void 0;

describe("hypertext", () => {
    it("accepts no props, no children", () => {
        expect(h("span")).toEqual(<span />);
        expect(h(Aside)).toEqual(<Aside></Aside>);
    });

    it("accepts props only, no children", () => {
        expect(
            h("br", {
                id: "nice",
                onClick: dummyHandler,
            }),
        ).toEqual(<br id="nice" onClick={dummyHandler} />);
        expect(h(Aside, { id: "nono", className: "nini" })).toEqual(<Aside id="nono" className="nini" />);
    });

    it("accepts single child, undefined props", () => {
        expect(h("p", undefined, "text")).toEqual(<p>text</p>);
        expect(h(Aside, undefined, "text")).toEqual(<Aside>text</Aside>);
    });

    it("accepts single child, null props", () => {
        expect(h("p", null as any, "text")).toEqual(<p>text</p>);
        expect(h(Aside, null as any, "text")).toEqual(<Aside>text</Aside>);
    });

    it("accepts single child, empty props", () => {
        expect(h("p", {}, "text")).toEqual(<p>text</p>);
        expect(h(Aside, {}, "text")).toEqual(<Aside>text</Aside>);
    });

    it("accepts multiple children, no props", () => {
        expect(h("p", undefined, "a", "b", "c")).toEqual(<p>a{"b"}c</p>);
        expect(h(Aside, undefined, "a", "b", "c")).toEqual(<Aside>a{"b"}c</Aside>);
    });

    it("accepts props + children", () => {
        expect(
            h(
                "h1",
                {
                    className: "head",
                },
                "Title",
            ),
        ).toEqual(<h1 className="head">Title</h1>);
        expect(h(Aside, { id: "R" }, "Title")).toEqual(<Aside id="R">Title</Aside>);
    });

    it("accepts props + multiple children", () => {
        expect(
            h(
                "h1",
                {
                    className: "head",
                },
                "Title",
                " of",
                " the header",
            ),
        ).toEqual(<h1 className="head">Title{" of"} the header</h1>);
        expect(h(Aside, { id: "F", className: "R" }, "a", "b", "c")).toEqual(
            <Aside id="F" className="R">
                a{"b"}c
            </Aside>,
        );
    });

    it("accepts children attribute inside props", () => {
        expect(
            h("h1", {
                className: "head",
                children: ["a", "b", "c"],
            }),
        ).toEqual(<h1 className="head">a{"b"}c</h1>);
        expect(h(Aside, { id: "R", children: ["Title"] })).toEqual(<Aside id="R">Title</Aside>);
    });

    it("accepts children attribute as non array", () => {
        expect(h("h1", { id: "R", children: "Title" })).toEqual(<h1 id="R">Title</h1>);
        expect(h(Aside, { id: "R", children: "Title" })).toEqual(<Aside id="R">Title</Aside>);
    });
});

describe("Fragment", () => {
    it("allows to have Fragment with no children", () => {
        expect(<></>).toEqual(h(Fragment));
    });
    it("allows to have Fragment with single children", () => {
        expect(<>aaa</>).toEqual(h(Fragment, undefined, "aaa"));
    });
    it("allows to have Fragment with multiple children", () => {
        expect(<>a{"b"}c</>).toEqual(h(Fragment, { children: ["a", "b", "c"] }));
    });
});

describe("jsx-runtime", () => {
    it("defines jsx", () => {
        // no props, no children
        expect(jsx("span")).toEqual(<span />);
        // single child, no props
        expect(jsx("p", { children: "text" })).toEqual(<p>text</p>);
        // props only, no children
        expect(
            jsx("br", {
                id: "nice",
                onClick: dummyHandler,
            }),
        ).toEqual(<br id="nice" onClick={dummyHandler} />);
        // props + children
        expect(
            jsx("h1", {
                className: "head",
                children: "Title",
            }),
        ).toEqual(<h1 className="head">Title</h1>);
    });

    it("defines jsxs", () => {
        // multiple children, no props
        expect(jsxs("p", { children: ["text", "r"] })).toEqual(<p>text{"r"}</p>);
        // props + multiple children
        expect(
            jsxs("h1", {
                className: "head",
                children: ["Title", " of", " the header"],
            }),
        ).toEqual(<h1 className="head">Title{" of"} the header</h1>);
    });

    it("defines jsxDEV for single child", () => {
        // no props, no children
        expect(jsxDEV("span")).toEqual(<span />);
        // single child, no props
        expect(jsxDEV("p", { children: "text" })).toEqual(<p>text</p>);
        // props only, no children
        expect(
            jsxDEV("br", {
                id: "nice",
                onClick: dummyHandler,
            }),
        ).toEqual(<br id="nice" onClick={dummyHandler} />);
        // props + children
        expect(
            jsxDEV("h1", {
                className: "head",
                children: "Title",
            }),
        ).toEqual(<h1 className="head">Title</h1>);
    });

    it("defines jsxDEV for multiple children", () => {
        // multiple children, no props
        expect(jsxDEV("p", { children: ["text", "r"] })).toEqual(<p>text{"r"}</p>);
        // props + multiple children
        expect(
            jsxDEV("h1", {
                className: "head",
                children: ["Title", " of", " the header"],
            }),
        ).toEqual(<h1 className="head">Title{" of"} the header</h1>);
    });
});
