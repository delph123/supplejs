import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createComputed, createDeferred, createSignal } from "../../core";
import { renderHook } from "../utils";

describe("createDeferred", () => {
    beforeAll(() => {
        vi.useFakeTimers();
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    it("defers notification to downstream readonly", async () => {
        const [num, setNum] = createSignal(0);
        const spy = vi.fn();

        renderHook(() => {
            const d = createDeferred(num);
            createComputed(() => {
                spy(d());
            });
        });

        // readonly is subscribed to the computed
        expect(spy).toHaveBeenCalledWith(0);

        spy.mockClear();
        setNum(1);
        // notification is deferred
        expect(spy).not.toHaveBeenCalled();

        // advance timers to wait notification to be called
        vi.runAllTimers();
        expect(spy).toHaveBeenCalledWith(1);
    });

    it("only notifies once when multiple changes happened before the deferred readonly is notified", () => {
        const [num, setNum] = createSignal(0);
        const spy = vi.fn();

        renderHook(() => {
            const d = createDeferred(num);
            createComputed(() => {
                spy(d());
            });
        });

        spy.mockClear();
        setNum(1);
        setNum(2);
        setNum(3);
        // notification is deferred
        expect(spy).not.toHaveBeenCalled();

        // advance timers to wait notification to be called
        vi.runAllTimers();
        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(3);
    });

    it("accepts an Accessor<function> as source", () => {
        const [num, setNum] = createSignal<() => number>(() => 0);
        const spy = vi.fn();

        renderHook(() => {
            const d = createDeferred(num);
            createComputed(() => {
                spy(d());
            });
        });

        expect(spy).toHaveBeenCalledWith(expect.any(Function));
        expect(spy.mock.calls[0][0]()).toEqual(0);

        spy.mockClear();
        setNum(() => () => 1);
        vi.runAllTimers();
        expect(spy).toHaveBeenCalledWith(expect.any(Function));
        expect(spy.mock.calls[0][0]()).toEqual(1);
    });

    it("does not notify downstream when signal is not actually changed", () => {
        const [num, setNum] = createSignal(0, { equals: false });
        const spy = vi.fn();

        renderHook(() => {
            const d = createDeferred(num);
            createComputed(() => {
                spy(d());
            });
        });

        spy.mockClear();
        setNum(0);
        expect(spy).not.toHaveBeenCalled();

        vi.runAllTimers();
        expect(spy).not.toHaveBeenCalled();
    });

    it("accepts equals = false option to pass through all upstream calls", () => {
        const [num, setNum] = createSignal(0, { equals: false });
        const spy = vi.fn();

        renderHook(() => {
            const d = createDeferred(num, { equals: false });
            createComputed(() => {
                spy(d());
            });
        });

        spy.mockClear();
        setNum(0);
        expect(spy).not.toHaveBeenCalled();

        vi.runAllTimers();
        expect(spy).toHaveBeenCalledWith(0);
    });

    it("accepts custom comparison function to detect changes to pass through", () => {
        const [num, setNum] = createSignal(0, { equals: false });
        const spy = vi.fn();

        renderHook(() => {
            // compares that a & b have different parity
            const d = createDeferred(num, { equals: (a, b) => (a + b) % 2 === 0 });
            createComputed(() => {
                spy(d());
            });
        });

        spy.mockClear();
        setNum(4);
        vi.runAllTimers();
        expect(spy).not.toHaveBeenCalled();

        setNum(3);
        vi.runAllTimers();
        expect(spy).toHaveBeenCalledWith(3);

        spy.mockClear();
        setNum(5);
        vi.runAllTimers();
        expect(spy).not.toHaveBeenCalled();
    });
});

describe("createDeferred timeout", () => {
    beforeAll(() => {
        vi.useFakeTimers();
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    it("is less urgent than queueMicrotask", async () => {
        const [num, setNum] = createSignal(0);
        const spy = vi.fn();
        const spy2 = vi.fn();

        renderHook(() => {
            // no timeout specified
            const d = createDeferred(num);
            createComputed(() => {
                spy(d());
            });
            // very aggressive timeout
            const e = createDeferred(num, { timeoutMs: 0 });
            createComputed(() => {
                spy2(e());
            });
        });

        [spy, spy2].forEach((s) => s.mockClear());
        setNum(1);
        queueMicrotask(() => {
            setNum(2);
        });
        expect(spy).not.toHaveBeenCalled();
        expect(spy2).not.toHaveBeenCalled();

        // advance timers (including nextTick thanks to await)
        await vi.runAllTimersAsync();
        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(2);
        expect(spy2).toHaveBeenCalledOnce();
        expect(spy2).toHaveBeenCalledWith(2);
    });

    it("is less urgent than setTimeout(_, 0)", async () => {
        const [num, setNum] = createSignal(0);
        const spy = vi.fn();
        const spy2 = vi.fn();

        renderHook(() => {
            // no timeout specified
            const d = createDeferred(num);
            createComputed(() => {
                spy(d());
            });
            // very aggressive timeout
            const e = createDeferred(num, { timeoutMs: 1 });
            createComputed(() => {
                spy2(e());
            });
        });

        [spy, spy2].forEach((s) => s.mockClear());
        setNum(1);
        setTimeout(() => {
            setNum(2);
        }, 0);
        expect(spy).not.toHaveBeenCalled();
        expect(spy2).not.toHaveBeenCalled();

        // advance timers (including nextTick thanks to await)
        await vi.runAllTimersAsync();
        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(2);
        expect(spy2).toHaveBeenCalledOnce();
        expect(spy2).toHaveBeenCalledWith(2);
    });

    it("allows to adjust timeout value", async () => {
        const [num, setNum] = createSignal(0);
        const [spy, spy2, spy3] = [vi.fn(), vi.fn(), vi.fn()];

        renderHook(() => {
            // no timeout specified
            const d = createDeferred(num);
            createComputed(() => {
                spy(d());
            });
            // small timeout
            const e = createDeferred(num, { timeoutMs: 20 });
            createComputed(() => {
                spy2(e());
            });
            // very aggressive timeout
            const f = createDeferred(num, { timeoutMs: 5 });
            createComputed(() => {
                spy3(f());
            });
        });

        [spy, spy2, spy3].forEach((s) => s.mockClear());
        setNum(1);
        setTimeout(() => {
            setNum(2);
        }, 10);
        expect(spy).not.toHaveBeenCalled();
        expect(spy2).not.toHaveBeenCalled();
        expect(spy3).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(9);
        expect(spy).not.toHaveBeenCalled();
        expect(spy2).not.toHaveBeenCalled();
        // aggressive timeout allows to be notified before setNum(2)
        expect(spy3).toHaveBeenCalledOnce();
        expect(spy3).toHaveBeenCalledWith(1);

        // advance timers (including nextTick thanks to await)
        await vi.runAllTimersAsync();
        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(2);
        expect(spy2).toHaveBeenCalledOnce();
        expect(spy2).toHaveBeenCalledWith(2);
        expect(spy3).toHaveBeenCalledTimes(2);
        expect(spy3).toHaveBeenCalledWith(2);
    });
});
