import { RWRComponent, RWRElement, RWRNode, RWRNodeEffect } from "./types";
import { flatten } from "./helper";
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

    type = overrideDomType(type);

    if (typeof type === "function") {
        return createRWRComponent(type, attributes, altChildren);
    } else {
        return createRWRElement(type, attributes, altChildren);
    }
}

export function Fragment({
    children,
    ...otherProps
}: {
    children: RWRNode[];
}): RWRNodeEffect {
    if (Object.entries(otherProps).length > 0) {
        console.error(Object.entries(otherProps));
    }
    return () => children;
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

const OVERRIDES = {
    input: Input,
};

function overrideDomType(type: string | RWRComponent) {
    if (typeof type === "string" && OVERRIDES[type]) {
        return OVERRIDES[type];
    } else {
        return type;
    }
}

type InputElementInputEvent = InputEvent & {
    currentTarget: HTMLInputElement;
    target: Element;
};

function Input({
    id,
    value,
    oninput,
    ...props
}: {
    id: string;
    value: string | (() => string);
    oninput: (e: InputElementInputEvent) => void;
    [x: string]: any;
}) {
    return () =>
        createRWRElement(
            "input",
            {
                id: id,
                value: typeof value === "function" ? value() : value,
                oninput: (e: InputElementInputEvent) => {
                    let node = e.currentTarget.parentElement!;
                    let oldSelection = e.currentTarget.selectionStart;
                    oninput(e);
                    let input = node.querySelector(
                        "#" + id
                    ) as HTMLInputElement;
                    input.focus();
                    input.selectionStart = oldSelection;
                },
                ...props,
            },
            []
        );
}
