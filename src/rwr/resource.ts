import { createEffect, createMemo, createSignal } from "./reactivity";

type FetcherParameter<P> = P | false | null;

type Resource<R, P> = [
    {
        (): R | undefined;
        loading: boolean;
        error: any;
        state: "unresolved" | "pending" | "ready" | "refreshing" | "errored";
    },
    {
        mutate: (r?: R) => void;
        refetch: (p?: P) => void;
    }
];

/**
 * Creates a signal that reflects the result of an async request.
 *
 * The function takes an asynchronous fetcher function and returns a signal
 * that is updated with the resulting data when the fetcher completes.
 *
 * There are two ways to use createResource: you can pass the fetcher function
 * as the sole argument, or you can additionally pass a source signal as the
 * first argument. The source signal will retrigger the fetcher whenever it
 * changes, and its value will be passed to the fetcher.
 *
 * @param source an optionnal signal for passing parameters to the fetcher
 * @param fetcher the asynchronous fetcher function
 */
export function createResource<R, P>(
    fetcher: (p: P) => R | Promise<R>
): Resource<R, P>;
export function createResource<R, P>(
    source: FetcherParameter<P> | (() => FetcherParameter<P>),
    fetcher: (p: P) => R | Promise<R>
): Resource<R, P>;
export function createResource<R, P>(
    source:
        | FetcherParameter<P>
        | (() => FetcherParameter<P>)
        | ((p: P) => R | Promise<R>),
    fetcher?: (p: P) => R | Promise<R>
) {
    const [params, fetch] = createResourceParams<R, P>(source, fetcher);

    let loaded = false;
    let previousData: R | undefined = undefined;
    let paramValue: P | null | false = null;

    const [refresh, setRefresh] = createSignal({
        refresh: false,
        value: undefined as P | null | false,
    });

    const [result, setResult] = createSignal({
        data: undefined as R | undefined,
        loading: false,
        error: undefined as any,
        state: "unresolved" as
            | "unresolved"
            | "pending"
            | "ready"
            | "refreshing"
            | "errored",
    });

    createEffect(() => {
        const refreshing = refresh();
        paramValue = refreshing.refresh ? refreshing.value : params();
        refreshing.refresh = false;
        if (paramValue !== null && paramValue !== false) {
            const r = fetch(paramValue);
            if (r instanceof Promise) {
                setResult({
                    loading: !loaded,
                    data: previousData,
                    error: undefined,
                    state: loaded ? "refreshing" : "pending",
                });
                r.then((value) => {
                    loaded = true;
                    previousData = value;
                    setResult({
                        data: value,
                        loading: false,
                        error: undefined,
                        state: "ready",
                    });
                }).catch((error) => {
                    previousData = undefined;
                    setResult({
                        data: undefined,
                        loading: false,
                        error: error,
                        state: "errored",
                    });
                });
            } else {
                loaded = true;
                previousData = r;
                setResult({
                    data: r,
                    loading: false,
                    error: undefined,
                    state: "ready",
                });
            }
        } else {
            setResult({
                data: undefined,
                loading: false,
                error: undefined,
                state: "unresolved",
            });
        }
    });

    const resource = createMemo(() => result().data);

    Object.defineProperties(resource, {
        loading: {
            get: createMemo(() => result().loading),
        },
        error: {
            get: createMemo(() => result().error),
        },
        state: {
            get: createMemo(() => result().state),
        },
    });

    return [
        resource,
        {
            mutate(r?: R) {
                setResult({
                    data: r,
                    loading: false,
                    error: undefined,
                    state: "ready",
                });
            },
            refetch(p?: P) {
                setRefresh({
                    refresh: true,
                    value: p ?? paramValue,
                });
            },
        },
    ];
}

function createResourceParams<R, P>(
    source:
        | FetcherParameter<P>
        | (() => FetcherParameter<P>)
        | ((p: P) => R | Promise<R>),
    fetcher?: (p: P) => R | Promise<R>
) {
    let params = typeof source === "function" ? source : () => source;
    let fetch = fetcher;
    if (fetcher == null) {
        params = (() => undefined) as () => P;
        fetch = source as (p: P) => R | Promise<R>;
    }
    return [params, fetch] as [
        () => FetcherParameter<P>,
        (p: P) => R | Promise<R>
    ];
}
