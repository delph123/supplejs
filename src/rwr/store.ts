import { createMemo, createSignal } from "./reactivity";

export interface ActionPayload<T> {
    type: string;
    payload: T;
}

export interface Reducers<T> {
    [actionType: string]: (state: T, action: ActionPayload<any>) => T;
}

export function createReduxStore() {
    // TODO
}

export function createReduxSlice<T>(initialValue: T, reducers: Reducers<T>) {
    const [store, setStore] = createSignal(initialValue);
    const dispatch = function (action: ActionPayload<any>) {
        if (action.type in reducers) {
            setStore(reducers[action.type](store(), action));
        }
    };
    return [store, dispatch] as const;
}

export function createReduxSelector<T, U>(
    source: () => T,
    fn: (src: T, prev: U) => U,
    value?: U,
    equals?: (a: U, b: U) => boolean
) {
    return createMemo((prev) => fn(source(), prev), value, { equals });
}
