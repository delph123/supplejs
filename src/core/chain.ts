import { SuppleChild, SuppleNodeEffect } from "./types";
import { createSignal } from "./reactivity";
import { h } from "./jsx";

interface Chain {
    current?: SuppleChild;
    next?: () => Chain;
    setItem?: (c: Chain) => void;
}

function getLast(chain: Chain, condition: (chain: Chain) => boolean): Chain {
    if (condition(chain)) {
        return getLast(chain.next!(), condition);
    } else {
        return chain;
    }
}

function createChainItem(): () => Chain {
    const itemValue: Chain = {};
    const [item, setItem] = createSignal(itemValue);
    itemValue.setItem = setItem;
    return item;
}

export type ChainedListResult = readonly [
    () => SuppleNodeEffect, // ChainedList component
    (component: SuppleChild) => void, // Push method
    () => void, // Pop method
    () => number, // Get size method
];

export function createChainedList<Props>({
    tag,
    attributes,
}: { tag?: string; attributes?: Props & { children?: never } } = {}): ChainedListResult {
    const [size, setSize] = createSignal(0);

    const root = createChainItem();

    const push = (component: SuppleChild) => {
        const next = createChainItem();

        const last = getLast(root(), (c) => !!c.next);
        last.setItem?.({
            next,
            current: component,
            setItem: last.setItem,
        });

        setSize(size() + 1);
    };

    const pop = () => {
        if (size() === 0) {
            return;
        }

        const previousLast = getLast(root(), (c) => !!c?.next?.()?.next);
        previousLast.setItem?.({
            setItem: previousLast.setItem,
        });

        setSize(size() - 1);
    };

    const BoundedChainedList = () =>
        ChainedList({
            tag: tag ?? "div",
            attributes,
            item: root,
        });

    return [BoundedChainedList, push, pop, size] as const;
}

function ChainedList<Props>(props: {
    tag: string;
    attributes?: Props & { children?: never };
    item: () => Chain;
}): SuppleNodeEffect {
    return () => {
        if (props.item().next) {
            return h(
                props.tag,
                props.attributes,
                props.item().current!,
                h(ChainedList, {
                    tag: props.tag,
                    attributes: props.attributes,
                    item: props.item().next!,
                }),
            );
        } else {
            return h(props.tag, props.attributes);
        }
    };
}
