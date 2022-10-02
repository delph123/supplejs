import { RWRComponent, RWRNode, RWRNodeEffect } from "./types";
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
        // If the child is a function, we want to automatically wrap it
        // in a render effect, but only when children will not be passed
        // to a component. When the type is a component, we will pass all
        // children untouched (for example, some components like the
        // iterator could redefine the children prop for other purposes
        // than simply happending them in the html)
        if (typeof c === "function" && typeof type !== "function") {
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
            __kind: "element",
            type,
            props: attributes,
            children: childNodes,
        };
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
