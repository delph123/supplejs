import { RWRComponent, RWRElement, RWRNode, RWRNodeEffect } from "./types";
import { createRenderEffect } from "./dom";

export function h(
    type: string | RWRComponent,
    props?: Record<string, any>,
    ...children: (RWRNode | RWRNodeEffect)[]
): RWRNode {
    let altChildren: (RWRNode | RWRNodeEffect)[] =
        props?.children || children || [];
    if (!Array.isArray(altChildren) && altChildren != null) {
        altChildren = [altChildren];
    } else if (altChildren == null) {
        console.error("Children should be an array!");
    }

    const childNodes = altChildren.map((c) => {
        // If the function has no parameter we want to automatically
        // wrap it in a render effect, but for the purpose of iterator
        // or other control flow constructs we want to avoid doing so
        // in case it has any parameter.
        if (typeof c === "function" && c.length === 0) {
            return createRenderEffect(c);
        } else {
            return c;
        }
    }) as RWRNode[];

    let attributes = props ? { ...props } : {};
    if ("children" in attributes) {
        delete attributes.children;
    }

    if (typeof type === "function") {
        return createComponent(type, attributes, childNodes);
    } else {
        return {
            type,
            props: attributes,
            children: childNodes,
        } as RWRElement;
    }
}

export function Fragment() {
    // TODO
}

function createComponent(
    Component: RWRComponent,
    props: Record<string, any>,
    children: RWRNode[]
) {
    return createRenderEffect(Component({ ...props, children }));
}
