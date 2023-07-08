import { createMemo } from "./reactivity";
import { RWRChild, RWRNode, RWRNodeEffect } from "./types";

type WhenCondition<T> = T | undefined | null | false;

export function Show<T>(props: {
    when: WhenCondition<T> | (() => WhenCondition<T>);
    keyed?: boolean;
    fallback?: RWRChild;
    children?:
        | RWRNode[]
        | [((item: () => T) => RWRNode) | ((item: T) => RWRNode)];
}): RWRNodeEffect {
    const when = (
        typeof props.when === "function" ? props.when : () => props.when
    ) as () => WhenCondition<T>;
    const display = createMemo(() => {
        const v = when();
        return v != null && v !== false;
    });
    return () => {
        if (display()) {
            if (
                props.children?.length === 1 &&
                typeof props.children?.[0] === "function"
            ) {
                return props.children[0](props.when as any);
            } else {
                return props.children as RWRNode[];
            }
        } else {
            if (typeof props?.fallback === "function") {
                return props.fallback();
            } else {
                return props?.fallback ?? null;
            }
        }
    };
}

export function Switch() {
    // TODO
}

export function Match() {
    // TODO
}

export function ErrorBoundary() {
    // TODO
}

export function Suspense() {
    // TODO
}
