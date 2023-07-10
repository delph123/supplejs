import { onCleanup, untrack } from "./context";
import { createRenderEffect, mount } from "./dom";
import { flatten } from "./helper";
import { mapArray } from "./iterators";
import { createMemo, createSignal } from "./reactivity";
import {
    DOMComponent,
    ProxyDOMComponent,
    RWRChild,
    RWRComponent,
    RWRNode,
    RWRNodeEffect,
} from "./types";

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
    const [children, setChildren] = createSignal<DOMComponent[]>([], {
        equals: false,
    });
    const source = mapArray(
        () => props?.children || [],
        (v) => createRenderEffect(typeof v === "function" ? v : () => v)
    );
    const childrenMap = new Map<Node, number>();
    const acceptComponent = (
        component: DOMComponent,
        previousNodes?: Node[]
    ) => {
        let newChildren = untrack(children);
        let index = newChildren.length;
        if (previousNodes) {
            index = childrenMap.get(previousNodes[0])!;
            // firstChild =
            //     childrenMap.get(previousNodes[0]) ?? newChildren.length;
            // previousNodes.forEach((n) => {
            //     if (!childrenMap.delete(n)) {
            //         console.error("couldn't delete", n, childrenMap);
            //     }
            // });
            if (!childrenMap.delete(previousNodes[0])) {
                console.error("couldn't delete", previousNodes[0], childrenMap);
                setChildren(newChildren);
                return;
            }
        }
        newChildren[index] = component;
        let newNodes;
        if (component.__kind === "dom_component") {
            newNodes = [component.node];
        } else {
            newNodes = component.getNodes();
        }
        // newNodes.forEach((n) => childrenMap.set(n, index));
        childrenMap.set(newNodes[0], index);
        // console.log("Switch accepted", component, previousNodes, newChildren);
        setChildren(newChildren);
    };
    source().forEach((p) => {
        // console.log("Mounting", p.target());
        mount(p, acceptComponent);
    });

    return () => {
        // console.log(children());
        const matchChildren = filterMatchChildren(children());
        console.log("Filtered =>", matchChildren);

        const firstChildMatching = matchChildren.find((p) => {
            const nodes = p.getNodes();
            return nodes.length > 1 || nodes[0].nodeType != Node.COMMENT_NODE;
        });

        if (firstChildMatching) {
            return firstChildMatching;
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
            return [];
        }
    };
}

export function ErrorBoundary() {
    // TODO
}

export function Suspense() {
    // TODO
}
