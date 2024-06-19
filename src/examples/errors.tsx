import {
    h,
    Fragment,
    ValueOrAccessor,
    toValue,
    createComputed,
    onCleanup,
    onError,
    createSignal,
    ErrorBoundary,
    catchError,
} from "../core";

function condThrow(errCode: ValueOrAccessor<number>, message: string): string {
    const errCodeValue = toValue(errCode);
    if (errCodeValue !== 0) {
        throw new Error(message.replace("{errno}", errCodeValue.toString()));
    } else {
        return "hello world!";
    }
}

export function ThrowingComponent(props) {
    onError((err) => {
        console.log("<ThrowingComponent />:", err.message);
    });
    onCleanup(() => {
        console.log("cleaning <ThrowingComponent />");
    });
    condThrow(props.bodyErrNo, "Failed to run <ThrowingComponent /> body with code {errno}");
    return () => (
        <div>
            {condThrow(props.renderErrNo, "Failed to run <ThrowingComponent /> renderer with code {errno}")}
        </div>
    );
}

function Erase() {
    createComputed(() => {
        onError((err) => {
            console.log("<Erase />:", err.message);
        });
        onCleanup(() => {
            console.log("cleaning <Erase />");
        });
    });
    return () => <Pass bodyErrNo={0} renderErrNo={0} />;
}

function Pass(props) {
    onError((err) => {
        console.log("<Pass />:", err.message);
    });
    return () => <ThrowingComponent bodyErrNo={props.bodyErrNo} renderErrNo={props.renderErrNo} />;
}

export function ErrorManager({ initialErrno }: Readonly<{ initialErrno?: number }>) {
    const [errno, setErrno] = createSignal(initialErrno ?? 0);
    const [errno2, setErrno2] = createSignal(0);
    onError((err) => {
        console.log("<ErrorManager />:", err.message);
    });
    return () => (
        <main>
            <div>
                <button onClick={() => setErrno((n) => (n == 0 ? 1 : 0))}>{errno()}</button>
                <button onClick={() => setErrno2((n) => (n == 0 ? 2 : 0))}>{errno2()}</button>
            </div>
            <ErrorBoundary
                fallback={(err, reset) => (
                    <>
                        <button onClick={() => reset()}>reset</button> {err.message}
                    </>
                )}
            >
                <ThrowingComponent bodyErrNo={0} renderErrNo={errno()} />
            </ErrorBoundary>
            <Pass bodyErrNo={0} renderErrNo={errno2()} />
            {catchError(
                () => (
                    <Erase />
                ),
                (err) => {
                    console.log("Catched in <ErrorManager />:", err.message);
                },
            )}
        </main>
    );
}
