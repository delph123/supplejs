import { createMemo } from "./reactivity";

export function createReduxStore() {
    // TODO
}

export function createReduxSelector<T>(source: () => T) {
    return function selector<U>(
        fn: (src: T, prev: U) => U,
        value: U,
        equals?: (a: U, b: U) => boolean
    ) {
        return createMemo((prev) => fn(source(), prev), value, { equals });
    };
}
