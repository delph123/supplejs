import { Accessor, ValueOrAccessor } from "./types";
import { untrack } from "./context";
import { createComputed, createMemo, createSignal } from "./reactivity";

export type FetcherParameter<P> = P | false | null;
export type Fetcher<P, R> = (
    p: P,
    info: { value: R | undefined; refetching: boolean | unknown },
) => R | Promise<R>;

export type ResourceOptions<T> = {
    initialValue?: T;
};

export type ResourceReturn<R> = [
    {
        (): R | undefined;
        loading: boolean;
        error: any;
        state: "unresolved" | "pending" | "ready" | "refreshing" | "errored";
        latest: R | undefined;
    },
    {
        mutate: (r?: R) => R | undefined;
        refetch: (info?: unknown) => void;
    },
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
 * @param source an optional signal for passing parameters to the fetcher
 * @param fetcher the asynchronous fetcher function
 */
export function createResource<R, P = any>(
    fetcher: Fetcher<P, R>,
    options?: ResourceOptions<R>,
): ResourceReturn<R>;
export function createResource<R, P = any>(
    source: ValueOrAccessor<FetcherParameter<P>>,
    fetcher: Fetcher<P, R>,
    options?: ResourceOptions<R>,
): ResourceReturn<R>;
export function createResource<R, P = any>(
    source: ValueOrAccessor<FetcherParameter<P>> | Fetcher<P, R>,
    fetcher?: Fetcher<P, R> | ResourceOptions<R>,
    options?: ResourceOptions<R>,
): ResourceReturn<R> {
    const [params, fetch, opts] = createResourceParams<R, P>(source, fetcher, options);

    let loaded = opts.initialValue !== undefined;

    const [refresh, setRefresh] = createSignal({
        refresh: false,
        info: undefined as unknown,
    });

    const [result, setResult] = createSignal({
        latest: opts.initialValue,
        loading: false,
        error: undefined as any,
        state: "unresolved" as ResourceReturn<R>[0]["state"],
    });

    createComputed(() => {
        const refreshing = refresh();
        const paramValue = params();
        if (paramValue !== null && paramValue !== false) {
            const r = fetch(paramValue, {
                value: untrack(result).latest,
                refetching: refreshing.info === undefined ? refreshing.refresh : refreshing.info,
            });
            if (r instanceof Promise) {
                setResult((prev) => ({
                    ...prev,
                    loading: true,
                    state: loaded ? "refreshing" : "pending",
                }));
                r.then(
                    (value) => {
                        loaded = true;
                        setResult({
                            latest: value,
                            loading: false,
                            error: undefined,
                            state: "ready",
                        });
                    },
                    (error) => {
                        loaded = true;
                        setResult((prev) => ({
                            ...prev,
                            loading: false,
                            error: error,
                            state: "errored",
                        }));
                    },
                );
            } else {
                loaded = true;
                setResult({
                    latest: r,
                    loading: false,
                    error: undefined,
                    state: "ready",
                });
            }
        } else {
            setResult((prev) => ({
                ...prev, // ??
                loading: false,
                state: loaded ? "ready" : "unresolved",
            }));
        }
        refreshing.refresh = false;
        refreshing.info = undefined;
    });

    const resource = createMemo(() => result().latest);

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
        latest: {
            get: createMemo(() => result().latest),
        },
    });

    return [
        resource as ResourceReturn<R>[0],
        {
            mutate(r?: R) {
                setResult({
                    latest: r,
                    loading: false,
                    error: undefined,
                    state: "ready",
                });
                return r;
            },
            refetch(info?: unknown) {
                setRefresh({
                    refresh: true,
                    info: info,
                });
            },
        },
    ];
}

export function createResourceParams<R, P>(
    source: ValueOrAccessor<FetcherParameter<P>> | Fetcher<P, R>,
    fetcher?: Fetcher<P, R> | ResourceOptions<R>,
    options?: ResourceOptions<R>,
): readonly [Accessor<FetcherParameter<P>>, Fetcher<P, R>, ResourceOptions<R>] {
    if (typeof fetcher === "function") {
        return [
            typeof source === "function" ? (source as Accessor<FetcherParameter<P>>) : () => source,
            fetcher,
            options ?? {},
        ] as const;
    } else {
        return [() => undefined as P, source as Fetcher<P, R>, fetcher ?? {}] as const;
    }
}
