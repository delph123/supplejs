import { describe, expect, it, vi } from "vitest";
import { createWaitableMock, render, renderHook } from "../utils";
import {
    h,
    catchError,
    createRenderEffect,
    createMemo,
    createSignal,
    createComputed,
    onCleanup,
    createEffect,
} from "../../core";

describe("catchError", () => {
    it("executes try function without failing and returns result", () => {
        const spy = vi.fn();

        const { asFragment } = render(
            () =>
                catchError(
                    () => {
                        return "hello";
                    },
                    (err) => {
                        spy(err);
                    },
                ) + " world!",
        );

        expect(asFragment()).toBe("hello world!");
        expect(spy).not.toHaveBeenCalled();
    });

    it("catches error when running initially", () => {
        const spy = vi.fn();
        const error = new Error(":(");

        const { asFragment } = render(() => {
            catchError(
                () => {
                    throw error;
                },
                (err) => {
                    spy(err);
                },
            );
            return "hello";
        });

        expect(asFragment()).toBe("hello");
        expect(spy).toHaveBeenCalledWith(error);
    });

    it("can be nested", () => {
        const innerSpy = vi.fn();
        const outerSpy = vi.fn();
        const error = new Error(":(");

        const { asFragment } = render(() => {
            catchError(
                () =>
                    catchError(
                        () => {
                            throw error;
                        },
                        (err) => {
                            innerSpy(err);
                        },
                    ),
                (err) => {
                    outerSpy(err);
                },
            );
            return "hello";
        });

        expect(asFragment()).toBe("hello");
        expect(innerSpy).toHaveBeenCalledWith(error);
        expect(outerSpy).not.toHaveBeenCalled();
    });

    it("continues after catch, sending undefined", () => {
        const innerSpy = vi.fn();
        const outerSpy = vi.fn();

        render(() => {
            catchError(
                () => {
                    innerSpy("a");
                    const r = catchError(
                        () => {
                            if (1 === Math.floor(3.2 / (1 + 1 + 1))) {
                                throw "b";
                            }
                            return "z";
                        },
                        (err) => {
                            innerSpy(err);
                        },
                    );
                    innerSpy(r);
                },
                (err) => {
                    outerSpy(err);
                },
            );
            return "hello";
        });

        expect(innerSpy.mock.calls).toEqual([["a"], ["b"], [undefined]]);
        expect(outerSpy).not.toHaveBeenCalled();
    });

    it("can rethrow up the line in error handler", () => {
        const innerSpy = vi.fn();
        const middleSpy = vi.fn();
        const outerSpy = vi.fn();

        renderHook(() => {
            catchError(
                () => {
                    catchError(
                        () => {
                            if (1 === Math.floor(3.2 / (1 + 1 + 1))) {
                                throw "b";
                            }
                            return "z";
                        },
                        (err) => {
                            innerSpy(err);
                            throw err;
                        },
                    );
                    middleSpy("x");
                },
                (err) => {
                    outerSpy(err);
                },
            );
        });

        expect(innerSpy).toHaveBeenCalledWith("b");
        expect(middleSpy).not.toHaveBeenCalled();
        expect(outerSpy).toHaveBeenCalledWith("b");
    });

    it("can be used inside JSX", () => {
        const firstSpy = vi.fn();
        const secondSpy = vi.fn();

        const B = () => () => <label>b</label>;
        const Cmp = () => () => (
            <span>
                <B />
            </span>
        );

        const { asFragment } = render(() => (
            <div>
                {() =>
                    catchError(
                        () => <Cmp />,
                        (err) => firstSpy(err),
                    )
                }
                -
                {() =>
                    catchError(
                        () => {
                            throw new Error(":(");
                        },
                        (err) => secondSpy(err),
                    ) ?? <p>a</p>
                }
            </div>
        ));

        expect(asFragment()).toEqual("<div><span><label>b</label></span>-<p>a</p></div>");
        expect(firstSpy).not.toHaveBeenCalled();
        expect(secondSpy).toHaveBeenCalled();
    });

    it("can catch errors in deeply nested contexts", () => {
        const innerSpy = vi.fn();
        const outerSpy = vi.fn();
        const error = new Error(":(");

        const B = () => () => (
            <label>
                {createMemo(() => {
                    throw error;
                })}
            </label>
        );
        const Cmp = () => () => (
            <span>
                <B />
            </span>
        );

        const { asFragment } = render(
            () =>
                catchError(
                    () =>
                        catchError(
                            () =>
                                createRenderEffect(() => (
                                    <div>
                                        <Cmp />
                                    </div>
                                )),
                            (err) => {
                                innerSpy(err);
                            },
                        ) ?? <h1>hello</h1>,
                    (err) => {
                        outerSpy(err);
                    },
                ) ?? "error",
        );

        expect(asFragment()).toBe("<h1>hello</h1>");
        expect(innerSpy).toHaveBeenCalledWith(error);
        expect(outerSpy).not.toHaveBeenCalled();
    });
});

describe("catchError in a reactive context", () => {
    it("catches error when they happen during re-rendering", () => {
        const [count, setCount] = createSignal(0);
        const spy = vi.fn();
        const error = new Error(":(");

        renderHook(() => {
            createComputed(() => {
                catchError(
                    () => {
                        if (count() === 1) {
                            throw error;
                        }
                    },
                    (err) => {
                        spy(err);
                    },
                );
                spy("ok");
            });
        });

        expect(spy).toHaveBeenCalledWith("ok");

        spy.mockClear();
        setCount(1);
        expect(spy).toHaveBeenCalledWith(error);

        spy.mockClear();
        setCount(2);
        expect(spy).toHaveBeenCalledWith("ok");
    });

    it("fully re-runs the wrapping context around catchError", () => {
        const [count, setCount] = createSignal(0);
        const spy = vi.fn();
        const error = new Error(":(");

        renderHook(() => {
            createComputed(() => {
                spy("before");
                const c = catchError(
                    () => {
                        if (count() === 1) {
                            throw error;
                        } else {
                            return "after";
                        }
                    },
                    (err) => {
                        spy(err);
                    },
                );
                spy(c);
            });
        });

        expect(spy.mock.calls).toEqual([["before"], ["after"]]);

        spy.mockClear();
        setCount(1);
        expect(spy.mock.calls).toEqual([["before"], [error], [undefined]]);

        spy.mockClear();
        setCount(2);
        expect(spy.mock.calls).toEqual([["before"], ["after"]]);
    });

    it("catches errors in a deeply nested reactive context", async () => {
        const [count, setCount] = createSignal(0);
        const spy = createWaitableMock();
        const cleanupSpy = vi.fn();
        const effectCleanupSpy = vi.fn();
        const error = new Error(":(");

        renderHook(() => {
            catchError(
                () => {
                    createComputed(() => {
                        spy("before");
                        const c = createMemo(() => {
                            onCleanup(cleanupSpy);
                            if (count() === 1) {
                                createEffect(() => {
                                    onCleanup(effectCleanupSpy);
                                    throw "error";
                                });
                                return -1;
                            } else if (count() === 2) {
                                throw error;
                            } else {
                                return count();
                            }
                        });
                        spy(c());
                    });
                },
                (err) => {
                    spy(err);
                },
            );
        });

        expect(spy.mock.calls).toEqual([["before"], [0]]);
        expect(cleanupSpy).not.toHaveBeenCalled();

        [spy, cleanupSpy].forEach((s) => s.mockClear());
        setCount(1);
        await spy.waitToHaveBeenCalledTimes(3);
        expect(spy.mock.calls).toEqual([["before"], [-1], ["error"]]);
        expect(cleanupSpy).toHaveBeenCalledTimes(2);
        expect(effectCleanupSpy).not.toHaveBeenCalled();

        [spy, cleanupSpy].forEach((s) => s.mockClear());
        setCount(2);
        expect(spy.mock.calls).toEqual([[error]]);
        expect(cleanupSpy).toHaveBeenCalledOnce();
        expect(effectCleanupSpy).toHaveBeenCalledOnce();

        [spy, cleanupSpy].forEach((s) => s.mockClear());
        setCount(3);
        // XXX or toEqual([]) if computed context is cleaned?
        expect(spy.mock.calls).toEqual([["before"], [3]]);
        expect(cleanupSpy).toHaveBeenCalledTimes(2);
    });

    it("continues after catch in nested JSX", () => {
        const [count, setCount] = createSignal(0);
        const spy = vi.fn();

        const B = () => () => (
            <label>
                {createMemo(() => {
                    throw new Error("1");
                })}
            </label>
        );
        const Cmp = () => () => (
            <span>
                <B />
            </span>
        );

        const { asFragment } = render(() => (
            <div>
                {() =>
                    catchError(
                        () => {
                            if (count() === 1) {
                                createRenderEffect(() => (
                                    <main>
                                        <Cmp />
                                    </main>
                                ));
                            } else {
                                return <span>{count}</span>;
                            }
                        },
                        (err) => {
                            spy(err);
                        },
                    ) ?? "hi!"
                }
            </div>
        ));

        expect(asFragment()).toEqual("<div><span>0</span></div>");
        expect(spy).not.toHaveBeenCalled();

        setCount(1);
        expect(asFragment()).toEqual("<div>hi!</div>");
        expect(spy).toHaveBeenCalled();

        setCount(2);
        expect(asFragment()).toEqual("<div><span>2</span></div>");
    });

    it("can reactively rethrow up the line in error handler", () => {
        const [count, setCount] = createSignal(0);
        const innerSpy = vi.fn();
        const middleSpy = vi.fn();
        const outerSpy = vi.fn();

        renderHook(() => {
            createComputed(() => {
                catchError(
                    () => {
                        createComputed(() => {
                            createMemo(() =>
                                catchError(
                                    () => {
                                        createComputed(() => {
                                            createMemo(() => {
                                                if (count() === 1) {
                                                    throw "error";
                                                } else {
                                                    return count();
                                                }
                                            })();
                                        });
                                    },
                                    (err) => {
                                        innerSpy(err);
                                        throw err;
                                    },
                                ),
                            );
                            middleSpy("x");
                        });
                    },
                    (err) => {
                        outerSpy(err);
                    },
                );
            });
        });

        expect(innerSpy).not.toHaveBeenCalled();
        expect(middleSpy).toHaveBeenCalled();
        expect(outerSpy).not.toHaveBeenCalled();

        [innerSpy, middleSpy, outerSpy].forEach((s) => s.mockClear());
        setCount(1);
        expect(innerSpy).toHaveBeenCalledWith("error");
        expect(middleSpy).not.toHaveBeenCalled();
        expect(outerSpy).toHaveBeenCalledWith("error");
    });
});
