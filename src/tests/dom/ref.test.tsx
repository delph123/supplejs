import { describe, expect, it, vi } from "vitest";
import { createWaitableMock, render, screen } from "../utils";
import {
    createComputed,
    createEffect,
    createRef,
    h,
    onMount,
} from "../../core";

describe("createRef", () => {
    it("creates an uninitialized reference", () => {
        const ref = createRef();
        expect(ref).toHaveProperty("current");
        expect(ref.current).toBeUndefined();
    });

    it("creates an initialized reference", () => {
        const a = { a: "hello" };
        const ref = createRef(a);
        expect(ref.current).toBe(a);
    });
});

describe("Rendering ref in the DOM", () => {
    it("mounts ref with the DOM element", () => {
        const ref = createRef();
        render(() => <main ref={ref}>Hello!</main>);
        const main = screen.getByRole("main");
        expect(ref.current).toBeDefined();
        expect(ref.current).toBe(main);
    });

    it("calls ref handler with the DOM element", () => {
        const ref = vi.fn();
        render(() => <main ref={ref}>Hello!</main>);
        const main = screen.getByRole("main");
        expect(ref).toHaveBeenCalledOnce();
        expect(ref).toHaveBeenCalledWith(main);
    });

    it("ignores nullish refs", () => {
        const ref = null;
        expect(() => render(() => <p ref={undefined}>Hi!</p>)).not.toThrow();
        expect(() => render(() => <p ref={ref}>Hi!</p>)).not.toThrow();
    });

    it("throws for invalid refs", () => {
        const ref = 36;
        expect(() => render(() => <p ref>Hi!</p>)).toThrow();
        expect(() => render(() => <div ref={ref}>Hi!</div>)).toThrow();
    });
});

describe("Availability of ref in effects", () => {
    function App({ reactiveComputation, spy }) {
        const ref = createRef();
        reactiveComputation(() => spy(ref.current));
        return () => <main ref={ref}>Hello!</main>;
    }

    it("ref is *not* mounted during Computed setup", async () => {
        const spy = createWaitableMock();
        render(() => <App reactiveComputation={createComputed} spy={spy} />);
        await spy.waitToHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(undefined);
    });

    it("ref is mounted during Effect first call", async () => {
        const spy = createWaitableMock();
        render(() => <App reactiveComputation={createEffect} spy={spy} />);
        const main = screen.getByRole("main");
        await spy.waitToHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(main);
    });

    it("ref is mounted during onMount call", async () => {
        const spy = createWaitableMock();
        render(() => <App reactiveComputation={onMount} spy={spy} />);
        const main = screen.getByRole("main");
        await spy.waitToHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(main);
    });
});
