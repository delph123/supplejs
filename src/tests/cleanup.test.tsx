import { describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "./utils/testing-renderer";
import { h, Fragment, onCleanup, createComputed, createEffect } from "../rwr";
import { createWaitableMock } from "./utils";

describe("Cleans up the document tree", () => {
    it("cleans up elements from the DOM (single element)", () => {
        render(() => <h1>Hello</h1>);
        expect(screen.getByRole("heading")).toBeInTheDocument();
        cleanup();
        expect(document.body).toBeEmptyDOMElement();
    });

    it("cleans up elements from the DOM (single root with multiple elements)", () => {
        render(() => (
            <main>
                <h1>Hello</h1>
                <p>Paragraph</p>
            </main>
        ));
        expect(screen.getByRole("heading")).toBeInTheDocument();
        expect(screen.getByText("Paragraph")).toBeInTheDocument();
        cleanup();
        expect(document.body).toBeEmptyDOMElement();
    });

    it("cleans up elements from the DOM (single root with multiple elements)", () => {
        render(
            () => (
                <>
                    <h1>
                        Hello <span>world</span>!
                    </h1>
                    <p>Paragraph</p>
                </>
            ),
            { container: document.body },
        );
        expect(document.body.childNodes.length).toBe(2);
        cleanup();
        expect(document.body).toBeEmptyDOMElement();
    });

    it("cleans up an element not mounted in the document", () => {
        render(() => <div />, { container: document.createElement("div") });
        cleanup();
    });

    it("does not error when component was already unmounted", () => {
        const { container, unmount } = render(() => <div>hello</div>);
        unmount();
        expect(container).toBeEmptyDOMElement();
        cleanup();
        expect(document.body).toBeEmptyDOMElement();
    });
});

describe("Dispose call cleanup effects", () => {
    function App({ reactiveComputation, spy }) {
        onCleanup(() => spy());
        reactiveComputation(() => {
            spy();
            onCleanup(() => spy());
        });
        return () => <main>Hello!</main>;
    }

    it("runs cleanup effects registered during rendering", () => {
        const spy = vi.fn();
        render(() => {
            onCleanup(() => spy());
            return <div>hello</div>;
        });
        cleanup();
        expect(spy).toHaveBeenCalledOnce();
    });

    it("runs runs nested cleanup effect registered during createComputation", async () => {
        const spy = createWaitableMock();
        render(() => {
            onCleanup(() => spy());
            return <App reactiveComputation={createComputed} spy={spy} />;
        });
        await spy.waitToHaveBeenCalled();
        cleanup();
        expect(spy).toHaveBeenCalledTimes(4);
    });

    it("runs runs nested cleanup effect registered during createEffect", async () => {
        const spy = createWaitableMock();
        render(() => {
            onCleanup(() => spy());
            return <App reactiveComputation={createEffect} spy={spy} />;
        });
        await spy.waitToHaveBeenCalled();
        cleanup();
        expect(spy).toHaveBeenCalledTimes(4);
    });
});

describe("Automatic cleanup between tests", () => {
    it("renders a div in the document", () => {
        render(() => <div>hi</div>);
        const hi = screen.getByText("hi");
        expect(hi).toBeInTheDocument();
    });

    it("sees an empty document thanks to auto-cleanup", () => {
        expect(document.body).toBeEmptyDOMElement();
        const hi = screen.queryByText("hi");
        expect(hi).not.toBeInTheDocument();
    });
});
