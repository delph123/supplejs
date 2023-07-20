import { children } from "./component";
import { onCleanup, onMount } from "./context";
import { createDOMComponent, createRenderEffect } from "./dom";
import { createMemo } from "./reactivity";
import { DOMComponent, RWRChild, RWRNode, RWRNodeEffect } from "./types";

type WhenCondition<T> = T | undefined | null | false;

export function Show<T>(props: {
    when: WhenCondition<T> | (() => WhenCondition<T>);
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

function filterMatchChildren(children: RWRChild[]) {
    const matchChildren: DOMComponent[] = [];
    for (const c of children) {
        if (c == null || (typeof c !== "object" && typeof c !== "function")) {
            continue;
        }
        if (typeof c === "function") {
            const p = createRenderEffect(c);
            matchChildren.push(...filterMatchChildren([p.target]));
            continue;
        }
        if (Array.isArray(c)) {
            matchChildren.push(
                ...filterMatchChildren(
                    c.map((sc) =>
                        typeof sc === "function" ? createRenderEffect(sc) : sc
                    )
                )
            );
            continue;
        }
        if (c.__kind === "proxy_component" && c.type === Match) {
            matchChildren.push(c.target);
            continue;
        }
        if (c.__kind === "proxy_component") {
            matchChildren.push(...filterMatchChildren([c.target]));
            continue;
        }
        if (c.__kind === "multi_components") {
            matchChildren.push(...filterMatchChildren(c.components));
            continue;
        }
    }
    return matchChildren;
}

export function Switch(props: {
    fallback?: RWRChild;
    children?: RWRChild[];
}): RWRNodeEffect {
    const resolved = children(props?.children);

    const firstChildMatching = createMemo(() => {
        const matchChildren = filterMatchChildren(resolved()) as (DOMComponent &
            MatchProps<unknown>)[];
        console.log("Filtered =>", matchChildren);

        const displayMatches = matchChildren.map((m) => {
            return typeof m.when === "function"
                ? (m.when() as unknown)
                : m.when;
        });
        const matchingIndex = displayMatches.findIndex(
            (v) => v != null && v !== false
        );
        if (matchingIndex >= 0) {
            return matchChildren[matchingIndex];
        } else {
            return null;
        }
    });

    return () => {
        const matching = firstChildMatching();
        if (matching) {
            if (
                matching.children?.length === 1 &&
                typeof matching.children?.[0] === "function"
            ) {
                return matching.children[0](matching.when as any);
            } else {
                return matching.children as RWRNode[];
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

type MatchProps<T> = {
    when: WhenCondition<T> | (() => WhenCondition<T>);
    children?:
        | RWRNode[]
        | [((item: () => T) => RWRNode) | ((item: T) => RWRNode)];
};

export function Match<T>(props: MatchProps<T>) {
    onMount(() => console.log("monting match"));
    onCleanup(() => console.log("cleaning up"));
    return () => {
        return {
            ...createDOMComponent(null),
            when: props.when,
            children: props?.children,
        };
    };
}

export function ErrorBoundary() {
    // TODO
}

export function Suspense() {
    // TODO
}
