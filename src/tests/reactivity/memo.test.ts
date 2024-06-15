import { describe, expect, it, vi } from "vitest";
import { createComputed, createMemo, createSignal } from "../../core";
import { renderHook } from "../utils";

describe("createMemo", () => {
    it("doesn't send upstream changes when value is equal", () => {
        const [count, setCount] = createSignal(0);

        const derivedSignal = vi.fn(() => Math.floor(count() / 10));
        const memoizedSignal = vi.fn();

        renderHook(() => {
            memoizedSignal.mockImplementation(createMemo(() => Math.floor(count() / 10)));
            createComputed(derivedSignal);
            createComputed(memoizedSignal);
        });

        expect(derivedSignal).toHaveBeenCalledOnce();
        expect(memoizedSignal).toHaveBeenCalledOnce();

        setCount(3);
        setCount(4);
        expect(derivedSignal).toHaveBeenCalledTimes(3);
        expect(memoizedSignal).toHaveBeenCalledOnce();

        setCount(10);
        expect(derivedSignal).toHaveBeenCalledTimes(4);
        expect(memoizedSignal).toHaveBeenCalledTimes(2);

        setCount(15);
        setCount(16);
        setCount(17);
        expect(derivedSignal).toHaveBeenCalledTimes(7);
        expect(memoizedSignal).toHaveBeenCalledTimes(2);
    });

    it("accepts a memo function argument which returns a function", () => {
        const [doubler, setDoubler] = createSignal(true);
        const spy = vi.fn();

        renderHook(() => {
            const memoizedSignal = createMemo(() => (doubler() ? (n) => 2 * n : (n) => n + 1));
            createComputed(() => spy(memoizedSignal()(2)));
        });

        expect(spy).toHaveBeenLastCalledWith(4);
        setDoubler(false);
        expect(spy).toHaveBeenLastCalledWith(3);
    });
});
