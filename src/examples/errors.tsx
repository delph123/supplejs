import {
    h,
    Fragment,
    ValueOrAccessor,
    toValue,
    createComputed,
    onCleanup,
    createSignal,
    ErrorBoundary,
    catchError,
    createRenderEffect,
    createEffect,
    createMemo,
    SuppleNode,
} from "../core";

function condThrow(errCode: ValueOrAccessor<number>, message: string): SuppleNode {
    const errCodeValue = toValue(errCode);
    if (errCodeValue === 1) {
        return (
            <div>
                <Pass bodyErrNo={0} renderErrNo={5} />
            </div>
        );
    } else if (errCodeValue !== 0) {
        throw new Error(message.replace("{errno}", errCodeValue.toString()));
    } else {
        return "hello world!";
    }
}

function World() {
    onCleanup(() => {
        console.log("cleaning <World />");
    });
    return () => <span>world!</span>;
}

function Cleanup() {
    createEffect(() => {
        createComputed(() => {
            onCleanup(() => {
                console.log("cleaning <Cleanup />");
            });
        });
    });
    return () => (
        <p>
            hello <World />
        </p>
    );
}

export function ThrowingComponent(props: {
    bodyErrNo: ValueOrAccessor<number>;
    renderErrNo: ValueOrAccessor<number>;
}) {
    const [count, setCount] = createSignal(0);
    createComputed(() => {
        onCleanup(() => {
            console.log("cleaning <ThrowingComponent />");
        });
        console.log("before");
        const c = catchError(
            () => {
                if (count() === 3) {
                    console.log("error 3");
                    throw new Error("3");
                }
                return Math.floor(count() / 2);
            },
            (err) => {
                console.log("3:", err);
            },
        );
        console.log("after", c);
    });
    condThrow(props.bodyErrNo, "Failed to run <ThrowingComponent /> body with code {errno}");
    return () => (
        <div>
            {condThrow(props.renderErrNo, "Failed to run <ThrowingComponent /> renderer with code {errno}")}
            <button onClick={() => setCount((c) => c + 1)}>{count}</button>
        </div>
    );
}

function Erase() {
    createComputed(() => {
        onCleanup(() => {
            console.log("cleaning <Erase />");
        });
    });
    return () => <Pass bodyErrNo={3} renderErrNo={0} />;
}

function Pass(props: { bodyErrNo: ValueOrAccessor<number>; renderErrNo: ValueOrAccessor<number> }) {
    return () => (
        <div>
            <ThrowingComponent bodyErrNo={props.bodyErrNo} renderErrNo={props.renderErrNo} />
        </div>
    );
}

function Counter() {
    const [count, setCount] = createSignal(-1);
    const increment = () => setCount(count() + 1);

    catchError(
        () => {
            createComputed(() => {
                console.log("bef");
                const h = createMemo(() => {
                    onCleanup(() => console.log("cleaning memo"));
                    if (count() === 1) {
                        throw new Error("1");
                        createEffect(() => {
                            onCleanup(() => console.log("cleaning effect"));
                            console.log("error 1");
                            throw new Error("1");
                        });
                    } else {
                        return count();
                    }
                });
                console.log("aft", (h() ?? NaN) + 10);
            });
        },
        (err) => {
            console.log("1:", err);
        },
    );

    createComputed(() => {
        console.log("before");
        const c = catchError(
            () => {
                if (count() === 3) {
                    console.log("error 3");
                    throw new Error("3");
                }
                return count();
            },
            (err) => {
                console.log("3:", err);
            },
        );
        console.log("after", c);
    });

    return () => (
        <button type="button" onClick={increment}>
            {() =>
                catchError(
                    () => {
                        if (count() === 4) {
                            throw new Error("4");
                        } else {
                            return <span style={{ color: "blue" }}>{count}</span>;
                        }
                    },
                    (err) => {
                        console.log("4:", err);
                    },
                ) ?? "x"
            }
        </button>
    );
}

export function ErrorManager({ initialErrno }: Readonly<{ initialErrno?: number }>) {
    const [errno, setErrno] = createSignal(initialErrno ?? 0);
    const [errno2, setErrno2] = createSignal(0);
    onCleanup(() => {
        console.log("cleaning <ErrorManager />");
    });
    return () => (
        <main>
            <div>
                <button onClick={() => setErrno((n) => (n == 0 ? 1 : 0))}>{errno}</button>
                <button onClick={() => setErrno2((n) => (n == 0 ? 2 : 0))}>{errno2}</button>
                <Counter />
            </div>
            <ErrorBoundary
                fallback={(err, reset) => (
                    <>
                        <button onClick={() => reset()}>reset</button>
                        {
                            (createEffect(() => {
                                if (errno() === 0) {
                                    reset();
                                }
                            }),
                            " ")
                        }
                        {err.message}
                    </>
                )}
            >
                <Pass bodyErrNo={0} renderErrNo={errno} />
                <Cleanup />
            </ErrorBoundary>
            <Pass bodyErrNo={0} renderErrNo={errno2} />
            {() =>
                catchError(
                    () =>
                        catchError(
                            () =>
                                createRenderEffect(() => (
                                    <>
                                        <Erase />
                                    </>
                                )),
                            (err) => {
                                console.log("Catched in <ErrorManager.Sub />:", err.message);
                                throw err;
                            },
                        ),
                    (err) => {
                        console.log("Catched in <ErrorManager />:", err.message);
                    },
                )
            }
        </main>
    );
}
