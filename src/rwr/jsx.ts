import {
    RWRChild,
    RWRComponent,
    RWRElement,
    RWRNode,
    RWRNodeEffect,
} from "./types";
import { flatten } from "./helper";
import { createRenderEffect } from "./dom";

export function h<Props>(
    type: string | RWRComponent<Props>,
    props?: Props & { children?: any[] },
    ...children: RWRChild[]
): RWRNode {
    let altChildren = props?.children || children || [];
    if (!Array.isArray(altChildren) && altChildren != null) {
        altChildren = [altChildren];
    } else if (altChildren == null) {
        console.error("Children should be an array!");
    }

    const attributes = props ? { ...props } : {};
    if ("children" in attributes) {
        delete attributes.children;
    }

    type = overrideDomType(type);

    if (typeof type === "function") {
        return createRWRComponent(type, attributes as Props, altChildren);
    } else {
        return createRWRElement(type, attributes, altChildren);
    }
}

export function Fragment({
    children,
}: {
    children: RWRChild[];
}): RWRNodeEffect {
    return () => children;
}

function createRWRElement(
    type: string,
    props: Record<string, any>,
    children: RWRChild[]
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

function createRWRComponent<Props>(
    Component: RWRComponent<Props>,
    props: Props,
    children: any[]
) {
    // When we create a component, we will pass children untouched so that the
    // component itself can define the semantics of the children prop as it
    // sees fit. This is useful for example for the iterators components which
    // expects a mapping function with item as a parameter instead of a raw
    // component.
    return createRenderEffect(Component({ ...props, children }), Component);
}

const OVERRIDES = {
    input: Input,
};

function overrideDomType<Props>(type: string | RWRComponent<Props>) {
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
    children,
    ...props
}: {
    id: string;
    value: string | (() => string);
    oninput: (e: InputElementInputEvent) => void;
    [x: string]: any;
}) {
    return () => {
        const inputProps = {
            ...props,
        };

        if (id != null) {
            inputProps.id = id;
        }
        if (value != null) {
            inputProps.value = typeof value === "function" ? value() : value;
        }
        if (oninput != null) {
            inputProps.oninput = (e: InputElementInputEvent) => {
                const node = e.currentTarget.parentElement!;
                const oldSelection = e.currentTarget.selectionStart;
                oninput(e);
                const input = node.querySelector("#" + id) as HTMLInputElement;
                input.focus();
                input.selectionStart = oldSelection;
            };
        }

        return createRWRElement("input", inputProps, children);
    };
}
