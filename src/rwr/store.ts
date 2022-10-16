import { createMemo } from "./reactivity";

export function createReduxStore() {
    // TODO
}

export function createReduxSelector<T, U>(
    source: () => T,
    fn: (src: T, prev: U) => U,
    value?: U,
    equals?: (a: U, b: U) => boolean
) {
    return createMemo((prev) => fn(source(), prev), value, { equals });
}
