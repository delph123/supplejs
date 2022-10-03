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

    let attributes = props ? { ...props } : {};
    if ("children" in attributes) {
        delete attributes.children;
    }

    if (typeof type === "function") {
        return createRWRComponent(type, attributes, altChildren);
    } else {
        return createRWRElement(type, attributes, altChildren);
    }
}

export function Fragment() {
    // TODO
}

function createRWRElement(
    type: string,
    props: Record<string, any>,
    children: (RWRNode | RWRNodeEffect)[]
): RWRElement {
    // First, we need to recursively flatten the children array.
    // Then, if any child is a function, we want to automatically wrap
    // it in a render effect, so that it is automatically executed in a
    // tracking context.
    const directChildren = flatten(children).map((c) => {
        if (typeof c === "function") {
            return createRenderEffect(c);
        } else {
            return c;
        }
    });

    return {
        __kind: "element",
        type,
        props,
        children: directChildren,
    };
}

function createRWRComponent(
    Component: RWRComponent,
    props: Record<string, any>,
    children: any[]
) {
    // When we create a component, we will pass children untouched so that the
    // component itself can define the semantics of the children prop as it
    // sees fit. This is useful for example for the iterators components which
    // expects an mapping function with item as a parameter instead of a raw
    // component.
    return createRenderEffect(Component({ ...props, children }));
}

/**
 * Flatten childrens (developers may return an array containing nested arrays
 * and expect them to be flatten out in the rendering phase).
 */
type Nested<T> = T[] | Nested<T>[];
function flatten<T>(nestedChildren: Nested<T>) {
    const children: T[] = [];
    for (const c of nestedChildren) {
        if (Array.isArray(c)) {
            children.push(...flatten(c));
        } else {
            children.push(c);
        }
    }
    return children;
}
