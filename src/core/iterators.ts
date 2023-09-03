import { SuppleChild, SuppleNode, SuppleNodeEffect } from "./types";
import { createRoot } from "./context";
import { createMemo, createSignal } from "./reactivity";
import { createRenderEffect } from "./dom";
import { sameValueZero, toValue } from "./helper";

interface ForProps<T> {
    each: () => Iterable<T>;
    children?: [(item: T, index: () => number) => SuppleNode];
    fallback?: SuppleChild;
    equals?: (prev: T, next: T) => boolean;
}

/**
 * A referentially keyed loop with efficient updating of only changed items.
 *
 * @param props.each an iterator<T> which elements are displayed
 * @param props.children a mapping function with two parameters:
 *          (item: T, index: () => number) => SuppleNode
 *            - item is the element of the array
 *            - index is a signal representing the position in the array
 * @returns a reactive fragment composed of mapped element of the iterator
 */
export function For<T>({ each, children, equals, fallback }: ForProps<T>): SuppleNodeEffect {
    const resolvedChildren = mapArray(
        each,
        (element, index) => createRenderEffect(() => children?.[0]?.(element, index) ?? null),
        equals,
    );
    return () => {
        if (resolvedChildren().length > 0) {
            return resolvedChildren();
        } else {
            return toValue(fallback) ?? null;
        }
    };
}

interface IndexProps<T> {
    each: () => Iterable<T>;
    children?: [(item: () => T, index: number) => SuppleNode];
    fallback?: SuppleChild;
    equals?: (prev: T, next: T) => boolean;
}

/**
 * Non-keyed list iteration (rendered nodes are keyed to an array index).
 *
 * This is useful when there is no conceptual key, like if the data consists of
 * primitives and it is the index that is fixed rather than the value.
 *
 * @param props.each an iterator<T> which elements are displayed
 * @param props.children a mapping function with two parameters:
 *          (item: () => T, index: number) => SuppleNode
 *            - item is a signal which is called for each element of the array
 *              and again each time the array's content is changed
 *            - index is the position (a constant number) in the array
 * @returns a reactive fragment composed of mapped element of the iterator
 */
export function Index<T>({ each, children, fallback, equals }: IndexProps<T>) {
    const resolvedChildren = indexArray(
        each,
        (element, index) => createRenderEffect(() => children?.[0]?.(element, index) ?? null),
        equals,
    );
    return () => {
        if (resolvedChildren().length > 0) {
            return resolvedChildren();
        } else {
            return toValue(fallback) ?? null;
        }
    };
}

/* HELPERS */

const REMOVED = Symbol("REMOVED");

interface Entry<T, U> {
    setIndex: (i: number) => void;
    element: T | typeof REMOVED;
    mappedElement: U;
    dispose: () => void;
}

/**
 * Reactive map helper that caches each item by reference to reduce unnecessary
 * mapping on updates. It only runs the mapping function once per value and
 * then moves or removes it as needed. The index argument is a signal.
 *
 * Underlying helper for the <For> control flow.
 *
 * @param iterator an iterator<T> which elements are looped over
 * @param mapFn a non-tracking mapping function with two arguments:
 *          - the element of the array
 *          - an index signal representing the position in the array
 * @param equals a function to compare elements of the iterator
 * @returns a reactive array of mapped elements
 */
export function mapArray<T, U>(
    iterator: () => Iterable<T>,
    mapFn: (v: T, i: () => number) => U,
    equals?: (prev: T, next: T) => boolean,
) {
    // Define the finder function (either uses the provided equals function
    // or use default sameValueZero algorithm to compare underlying elements)
    const compare = equals ?? sameValueZero;
    const finder = function finder(nextElement: T) {
        return (previousEntry: Entry<T, U>) => {
            return previousEntry.element !== REMOVED && compare(previousEntry.element, nextElement);
        };
    };

    // The previous input & mapped lists
    let previousEntries = [] as Entry<T, U>[];
    let previousMappedArray = [] as U[];

    return createMemo(() => {
        const nextList = [...iterator()];

        if (listEquals(previousEntries, nextList, compare)) {
            return previousMappedArray;
        }

        const nextEntries = [] as Entry<T, U>[];
        const nextMappedArray = [] as U[];

        for (const [i, element] of nextList.entries()) {
            let nextEntry: Entry<T, U>;

            const previousEntry = previousEntries.find(finder(element));

            if (previousEntry) {
                nextEntry = {
                    setIndex: previousEntry.setIndex,
                    element: element,
                    mappedElement: previousEntry.mappedElement,
                    dispose: previousEntry.dispose,
                };
                previousEntry.element = REMOVED;
                nextEntry.setIndex(i);
            } else {
                nextEntry = createRoot((dispose) => {
                    const [index, setIndex] = createSignal(i);
                    const mappedElement = mapFn(element, index);
                    return {
                        setIndex,
                        element,
                        mappedElement,
                        dispose,
                    };
                });
            }

            nextEntries.push(nextEntry);
            nextMappedArray.push(nextEntry.mappedElement);
        }

        // Cleanup
        previousEntries.forEach(({ element, dispose }) => {
            // If an element wasn't reused in next list, dispose of it.
            if (element !== REMOVED) {
                dispose();
            }
        });

        previousEntries = nextEntries;
        previousMappedArray = nextMappedArray;

        return nextMappedArray;
    });
}

interface IndexEntry<T, U> {
    setElement: (e: T) => void;
    mappedElement: U;
    dispose: () => void;
}

/**
 * Similar to mapArray except it maps by index. The item is a signal and the
 * index is now the constant.
 *
 * Underlying helper for the <Index> control flow.
 *
 * @param iterator an iterator<T> which elements are looped over
 * @param mapFn a non-tracking mapping function with two arguments:
 *          - the element of the array as a signal
 *          - an index representing the position in the array
 * @returns a reactive array of mapped elements
 */
export function indexArray<T, U>(
    iterator: () => Iterable<T>,
    mapFn: (v: () => T, i: number) => U,
    equals?: false | ((prev: T, next: T) => boolean),
) {
    // The previous input & mapped lists
    let previousEntries = [] as IndexEntry<T, U>[];
    let previousMappedArray = [] as U[];

    return createMemo(() => {
        const nextList = [...iterator()];

        const nextEntries = [] as IndexEntry<T, U>[];
        const nextMappedArray = [] as U[];

        for (const [i, nextElement] of nextList.entries()) {
            let nextEntry: IndexEntry<T, U>;

            if (i < previousEntries.length) {
                nextEntry = previousEntries[i];
                nextEntry.setElement(nextElement);
            } else {
                nextEntry = createRoot((dispose) => {
                    const [element, setElement] = createSignal(nextElement, {
                        equals,
                    });
                    const mappedElement = mapFn(element, i);
                    return {
                        setElement,
                        mappedElement,
                        dispose,
                    };
                });
            }

            nextEntries.push(nextEntry);
            nextMappedArray.push(nextEntry.mappedElement);
        }

        // Cleanup
        for (let i = nextList.length; i < previousEntries.length; i++) {
            previousEntries[i].dispose();
        }

        // When the array hasn't changed size, the new array is the same
        // since it's content was changed via signals on array values
        if (nextList.length === previousEntries.length) {
            return previousMappedArray;
        }

        previousEntries = nextEntries;
        previousMappedArray = nextMappedArray;

        return nextMappedArray;
    });
}

function listEquals<T, U>(
    previousEntries: Entry<T, U>[],
    nextList: T[],
    equals: (prev: T, next: T) => boolean,
) {
    return (
        nextList.length === previousEntries.length &&
        previousEntries.every((e, i) => e.element !== REMOVED && equals(e.element, nextList[i]))
    );
}
