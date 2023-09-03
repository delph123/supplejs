import { describe, expect, it, vi } from "vitest";
import { createComputed, createSignal, onCleanup } from "../../core";
import { createSideEffectSpy, renderHook } from "../utils";

describe("createSignal", () => {
    it("takes a default value and returns a getter/setter pair", () => {
        const [sig, setSig] = createSignal({ a: 6 });
        expect(sig()).toEqual({ a: 6 });
        setSig({ a: 13 });
        expect(sig()).toEqual({ a: 13 });
    });

    it("can be mutated with a setter function which provides the previous value", () => {
        const mockSetter = vi.fn();
        const [sig, setSig] = createSignal("a");
        expect(sig()).toEqual("a");

        setSig(mockSetter.mockReturnValue("b"));
        expect(sig()).toEqual("b");
        expect(mockSetter).toHaveBeenCalledOnce();
        expect(mockSetter).toHaveBeenCalledWith("a");

        setSig(mockSetter.mockReturnValue("supplejs"));
        expect(sig()).toEqual("supplejs");
        expect(mockSetter).toHaveBeenCalledTimes(2);
        expect(mockSetter).toHaveBeenCalledWith("b");
    });

    it("accepts a function as signal value", () => {
        const f1 = () => 12;
        const f2 = () => 33;
        const mockSetter = vi.fn();
        const [sig, setSig] = createSignal(f1);
        expect(sig()).toBe(f1);

        setSig(mockSetter.mockReturnValue(f2));
        expect(sig()).toBe(f2);
        expect(mockSetter).toHaveBeenCalledOnce();
        expect(mockSetter).toHaveBeenCalledWith(f1);

        // must be called with a function setter so as to not confuse the function with a setter
        setSig(() => f1);
        expect(sig()).toBe(f1);
    });
});

describe("signal (atomic reactive primitive)", () => {
    it("automatically tracks calling context and reacts at value change", () => {
        const spy = vi.fn();
        const [sig, setSig] = createSignal(false);
        renderHook(() => {
            createComputed(() => spy(sig()));
        });
        spy.mockClear();
        setSig(true);
        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(true);
    });

    it("only tracks signal that are read", () => {
        const [spy, act] = createSideEffectSpy();
        const [firstName, setFirstName] = createSignal("John");
        const [lastName, setLastName] = createSignal("Doe");
        const [showLastName, setShowLastName] = createSignal(true);

        renderHook(() => {
            createComputed(() => {
                if (showLastName()) {
                    spy(`${firstName()} ${lastName()}`);
                } else {
                    spy(firstName());
                }
            });
        });

        act.beforeEach(spy.mockClear);

        expect(spy).toHaveBeenLastCalledWith("John Doe");
        act(() => setLastName("A"));
        expect(spy).toHaveBeenLastCalledWith("John A");
        act(() => setShowLastName(false));
        expect(spy).toHaveBeenLastCalledWith("John");
        act(() => setLastName("B"));
        expect(spy).not.toHaveBeenCalled();
        act(() => setFirstName("Marc"));
        expect(spy).toHaveBeenLastCalledWith("Marc");
    });

    it("doesn't send upstream changes when value is equal", () => {
        const spy = vi.fn();
        const [sig, setSig] = createSignal(13n);
        renderHook(() => {
            createComputed(() => spy(sig()));
        });
        spy.mockClear();
        setSig(7n * 2n - 1n);
        expect(spy).not.toHaveBeenCalled();
        setSig(11n);
        expect(spy).toHaveBeenCalledOnce();
        spy.mockClear();
        setSig(9n + 2n);
        expect(spy).not.toHaveBeenCalled();
    });

    it("accepts a custom equals comparator", () => {
        const [spy, act] = createSideEffectSpy();
        const [sig, setSig] = createSignal<{ v: number; x?: string }>(
            { v: 13 },
            {
                equals: (a, b) => a.v === b.v,
            },
        );

        renderHook(() => {
            createComputed(() => spy(sig()));
        });

        act.beforeEach(spy.mockClear);

        act(() => setSig({ v: 13 }));
        expect(spy).not.toHaveBeenCalled();
        act(() => setSig({ v: 0 }));
        expect(spy).toHaveBeenCalledOnce();
        act(() => setSig({ v: -0, x: "r" }));
        expect(spy).not.toHaveBeenCalled();
        act(() => setSig({ v: NaN }));
        expect(spy).toHaveBeenCalledOnce();
        act(() => setSig({ v: NaN }));
        expect(spy).toHaveBeenCalledOnce();
        act(() => setSig({ v: Infinity }));
        expect(spy).toHaveBeenCalledOnce();
        act(() => setSig({ v: Infinity }));
        expect(spy).not.toHaveBeenCalled();
        act(() => setSig({ v: Infinity }));
        expect(spy).not.toHaveBeenCalled();
    });

    it("always re-runs dependents when equals is false", () => {
        const spy = vi.fn();
        const [sig, setSig] = createSignal(13, { equals: false });
        renderHook(() => {
            createComputed(() => spy(sig()));
        });
        setSig(13);
        setSig(0);
        setSig(-0);
        setSig(NaN);
        setSig(NaN);
        setSig(7);
        setSig(7);
        setSig(7);
        setSig(-Infinity);
        expect(spy).toHaveBeenCalledTimes(10);
    });
});

describe("nested signals", () => {
    function createNestedEffects() {
        const [spy, act] = createSideEffectSpy();
        const cleanupSpy = vi.fn();
        const [a, setA] = createSignal(1);
        const [b, setB] = createSignal(10);
        const [c, setC] = createSignal(100);

        renderHook(() => {
            createComputed(() => {
                spy(`${a()}`);
                onCleanup(() => cleanupSpy(`${a()}`));

                createComputed(() => {
                    spy(`${a()}.${b()}`);
                    onCleanup(() => cleanupSpy(`${a()}.${b()}`));

                    createComputed(() => {
                        spy(`${a()}.${b()}.${c()}`);
                        onCleanup(() => cleanupSpy(`${a()}.${b()}.${c()}`));
                    });

                    createComputed(() => {
                        spy(`${a()}.${b()}.bis`);
                        onCleanup(() => cleanupSpy(`${a()}.${b()}.bis`));
                    });
                });

                createComputed(() => {
                    spy(`${a()}.${b() + 1}`);
                    onCleanup(() => cleanupSpy(`${a()}.${b() + 1}`));

                    createComputed(() => {
                        spy(`${a()}.${b() + 1}.${c()}`);
                        onCleanup(() => cleanupSpy(`${a()}.${b() + 1}.${c()}`));
                    });
                });
            });
        });

        act.beforeEach(spy.mockClear);
        act.beforeEach(cleanupSpy.mockClear);

        return [spy, act, setA, setB, setC, cleanupSpy] as const;
    }

    it("runs nested effects", () => {
        const [spy] = createNestedEffects();
        expect(spy.mock.calls.flat()).toEqual(["1", "1.10", "1.10.100", "1.10.bis", "1.11", "1.11.100"]);
    });

    it("reacts to signal changes", () => {
        const [spy, act, setA, setB, setC] = createNestedEffects();

        act(() => setC(200));
        expect(spy.mock.calls.flat()).toEqual(["1.10.200", "1.11.200"]);

        act(() => setA(2));
        expect(spy.mock.calls.flat()).toEqual(["2", "2.10", "2.10.200", "2.10.bis", "2.11", "2.11.200"]);

        act(() => setB(20));
        expect(spy.mock.calls.flat()).toEqual(["2.20", "2.20.200", "2.20.bis", "2.21", "2.21.200"]);

        act(() => setB(30));
        expect(spy.mock.calls.flat()).toEqual(["2.30", "2.30.200", "2.30.bis", "2.31", "2.31.200"]);

        act(() => setC(300));
        expect(spy.mock.calls.flat()).toEqual(["2.30.300", "2.31.300"]);

        act(() => setA(3));
        expect(spy.mock.calls.flat()).toEqual(["3", "3.30", "3.30.300", "3.30.bis", "3.31", "3.31.300"]);
    });

    it("cleans-up before signal changes", () => {
        const [, act, setA, setB, setC, cleanSpy] = createNestedEffects();

        act(() => setC(200));
        expect(cleanSpy.mock.calls.flat()).toEqual(["1.10.200", "1.11.200"]);

        act(() => setA(2));
        expect(cleanSpy.mock.calls.flat()).toEqual(["2.10.200", "2.10.bis", "2.10", "2.11.200", "2.11", "2"]);

        act(() => setB(20));
        expect(cleanSpy.mock.calls.flat()).toEqual(["2.20.200", "2.20.bis", "2.20", "2.21.200", "2.21"]);

        act(() => setB(30));
        expect(cleanSpy.mock.calls.flat()).toEqual(["2.30.200", "2.30.bis", "2.30", "2.31.200", "2.31"]);

        act(() => setC(300));
        expect(cleanSpy.mock.calls.flat()).toEqual(["2.30.300", "2.31.300"]);

        act(() => setA(3));
        expect(cleanSpy.mock.calls.flat()).toEqual(["3.30.300", "3.30.bis", "3.30", "3.31.300", "3.31", "3"]);
    });
});
