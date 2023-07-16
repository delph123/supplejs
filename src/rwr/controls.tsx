import { children } from "./component";
import { onCleanup } from "./context";
import { createRenderEffect } from "./dom";
import { createMemo } from "./reactivity";
import { ProxyDOMComponent, RWRChild, RWRNode, RWRNodeEffect } from "./types";

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
    const matchChildren: ProxyDOMComponent[] = [];
    for (let c of children) {
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
            matchChildren.push(c);
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
        const matchChildren = filterMatchChildren(resolved());
        console.log("Filtered =>", matchChildren);

        return matchChildren.find((p) => {
            const nodes = p.nodes();
            return nodes.length > 1 || nodes[0].nodeType != Node.COMMENT_NODE;
        });
    });

    return () => {
        if (firstChildMatching()) {
            return firstChildMatching()!;
        } else {
            if (typeof props?.fallback === "function") {
                return props.fallback();
            } else {
                return props?.fallback ?? null;
            }
        }
    };
}

export function Match<T>(props: {
    when: WhenCondition<T> | (() => WhenCondition<T>);
    children?:
        | RWRNode[]
        | [((item: () => T) => RWRNode) | ((item: T) => RWRNode)];
}) {
    onCleanup(() => console.log("cleaning up"));
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
            return null;
        }
    };
}

export function ErrorBoundary() {
    // TODO
}

export function Suspense() {
    // TODO
}
