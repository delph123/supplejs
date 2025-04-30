import { Accessor, ValueOrAccessor } from "./types";
import { untrack } from "./context";
import { createComputed, createMemo, createSignal } from "./reactivity";

export type FetcherParameter<P> = P | false | null;
export type ResourceFetcher<P, R, I = unknown> = (
    p: P,
    info: { value: R | undefined; refetching: boolean | I },
) => R | Promise<R>;

export type ResourceOptions<T> = {
    initialValue?: T;
};

export type ResourceReturn<R, I = unknown> = [
    {
        (): R | undefined;
        loading: boolean;
        error: any;
        state: "unresolved" | "pending" | "ready" | "refreshing" | "errored";
        latest: R | undefined;
    },
    {
        mutate: (r?: R) => R | undefined;
        refetch: (info?: I) => void;
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
export function createResource<R, P = any, I = unknown>(
    fetcher: ResourceFetcher<P, R, I>,
    options?: ResourceOptions<R>,
): ResourceReturn<R, I>;
export function createResource<R, P = any, I = unknown>(
    source: ValueOrAccessor<FetcherParameter<P>>,
    fetcher: ResourceFetcher<P, R, I>,
    options?: ResourceOptions<R>,
): ResourceReturn<R, I>;
export function createResource<R, P = any, I = unknown>(
    source: ValueOrAccessor<FetcherParameter<P>> | ResourceFetcher<P, R, I>,
    fetcher?: ResourceFetcher<P, R, I> | ResourceOptions<R>,
    options?: ResourceOptions<R>,
): ResourceReturn<R, I> {
    const [params, fetch, opts] = createResourceParams<R, P, I>(source, fetcher, options);

    let latestResponse: R | Promise<R>;
    let loaded = opts.initialValue !== undefined;

    const [refresh, setRefresh] = createSignal({
        refresh: false,
        info: undefined as I | undefined,
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
            latestResponse = fetch(paramValue, {
                value: untrack(result).latest,
                refetching: refreshing.info === undefined ? refreshing.refresh : refreshing.info,
            });
            if (latestResponse instanceof Promise) {
                setResult((prev) => ({
                    ...prev,
                    loading: true,
                    state: loaded ? "refreshing" : "pending",
                }));
                // Memorize the promise we are tackling
                const currentPromise = latestResponse;
                latestResponse.then(
                    (value) => {
                        // bail out if the promise we handle is not the latest response,
                        // so that the resource only tracks status of last response and
                        // ignore previous results (especially when the come out of order)
                        if (currentPromise === latestResponse) {
                            loaded = true;
                            setResult({
                                latest: value,
                                loading: false,
                                error: undefined,
                                state: "ready",
                            });
                        }
                    },
                    (error) => {
                        // bail out if the promise we handle is not the latest response,
                        // so that the resource only tracks status of last response and
                        // ignore previous results (especially when the come out of order)
                        if (currentPromise === latestResponse) {
                            loaded = true;
                            setResult((prev) => ({
                                ...prev,
                                loading: false,
                                error: error,
                                state: "errored",
                            }));
                        }
                    },
                );
            } else {
                loaded = true;
                setResult({
                    latest: latestResponse,
                    loading: false,
                    error: undefined,
                    state: "ready",
                });
            }
        } else {
            setResult((prev) => ({
                ...prev,
                loading: false,
                state: loaded ? (prev.error === undefined ? "ready" : "errored") : "unresolved",
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
                setResult((prev) => ({
                    ...prev,
                    latest: r,
                }));
                return r;
            },
            refetch(info?: I) {
                setRefresh({
                    refresh: true,
                    info: info,
                });
            },
        },
    ];
}

export function createResourceParams<R, P, I = unknown>(
    source: ValueOrAccessor<FetcherParameter<P>> | ResourceFetcher<P, R, I>,
    fetcher?: ResourceFetcher<P, R, I> | ResourceOptions<R>,
    options?: ResourceOptions<R>,
): readonly [Accessor<FetcherParameter<P>>, ResourceFetcher<P, R, I>, ResourceOptions<R>] {
    if (typeof fetcher === "function") {
        return [
            typeof source === "function" ? (source as Accessor<FetcherParameter<P>>) : () => source,
            fetcher,
            options ?? {},
        ] as const;
    } else {
        return [() => undefined as P, source as ResourceFetcher<P, R, I>, fetcher ?? {}] as const;
    }
}
