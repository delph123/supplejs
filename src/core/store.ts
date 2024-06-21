import { Accessor } from "./types";
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

export function createReduxSlice<T>(
    initialValue: T,
    reducers: Reducers<T>,
): readonly [Accessor<T>, (action: ActionPayload<any>) => void] {
    const [store, setStore] = createSignal(initialValue);
    const dispatch = function (action: ActionPayload<any>) {
        if (action.type in reducers) {
            // XXX unsafe execution of reducer `reducers[action.type]`
            setStore(() => reducers[action.type](store(), action));
        }
    };
    return [store, dispatch] as const;
}

export function createReduxSelector<T, U>(
    source: () => T,
    fn: (src: T, prev: U) => U,
    value?: U,
    equals?: (a: U, b: U) => boolean,
): Accessor<U> {
    return createMemo((prev) => fn(source(), prev), value, { equals });
}
