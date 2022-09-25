import { createEffect, createMemo, createSignal } from "./reactivity";

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

export function createResource<R, P>(
  fetcher: (p: P) => R | Promise<R>
): Resource<R, P>;
export function createResource<R, P>(
  source: P | false | null | (() => P | false | null),
  fetcher: (p: P) => R | Promise<R>
): Resource<R, P>;
export function createResource<R, P>(
  source:
    | P
    | false
    | null
    | (() => P | false | null)
    | ((p: P) => R | Promise<R>),
  fetcher?: (p: P) => R | Promise<R>
) {
  let params = typeof source === "function" ? source : () => source;
  let fetch = fetcher;
  if (fetcher == null) {
    params = (() => undefined) as () => P;
    fetch = source as (p: P) => R | Promise<R>;
  }

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
    paramValue = refreshing.refresh
      ? refreshing.value
      : (params as () => P | false | null)();
    refreshing.refresh = false;
    if (paramValue !== null && paramValue !== false) {
      const r = fetch!(paramValue);
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
