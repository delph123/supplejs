import {
    RWRChild,
    RWRComponent,
    RWRElement,
    RWRNodeEffect,
    ValueOrAccessor,
} from "./types";
import { toValue } from "./helper";

export function h<Props>(
    type: string | RWRComponent<Props>,
    props?: Props & { children?: RWRChild[] },
    ...children: RWRChild[]
): RWRElement<Props> {
    let altChildren = props?.children ?? children;
    if (!Array.isArray(altChildren)) {
        altChildren = [altChildren];
    }

    const attributes = props ? { ...props } : {};
    if ("children" in attributes) {
        delete attributes.children;
    }

    type = overrideDomType(type);

    // Create a virtual DOM that will only be rendered in the DOM (via createDOMComponent)
    // when the element will be attached in the DOM.
    // This is necessary to avoid evaluating all branches of a Show or a Match component
    // when only a single one should be executed. Also note that it means the virtual DOM
    // may be rendered multiple times each time it is added back in the DOM after it was
    // removed (as could be the case with a Show component alternating states)
    if (typeof type === "function") {
        return {
            __kind: "rwr_element",
            type,
            props: attributes as Props,
            children: altChildren,
        };
    } else {
        return {
            __kind: "html_element",
            type,
            props: attributes as Props,
            children: altChildren,
        };
    }
}

export function Fragment({
    children,
}: {
    children: RWRChild[];
}): RWRNodeEffect {
    return () => children;
}

const OVERRIDES = {
    input: Input,
};

function overrideDomType<Props>(type: string | RWRComponent<Props>) {
    if (typeof type === "string" && OVERRIDES[type]) {
        return OVERRIDES[type] as RWRComponent<Props>;
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
    value: ValueOrAccessor<string>;
    oninput: (e: InputElementInputEvent) => void;
    children: RWRChild[];
    [x: string]: any;
}): RWRNodeEffect {
    return () => {
        const inputProps = {
            ...props,
        };

        if (id != null) {
            inputProps.id = id;
        }
        if (value != null) {
            inputProps.value = toValue(value);
        }
        if (oninput != null) {
            inputProps.oninput = (e: InputElementInputEvent) => {
                const node = e.currentTarget.parentElement!;
                const oldSelection = e.currentTarget.selectionStart;
                oninput(e);
                const input = node.querySelector<HTMLInputElement>("#" + id)!;
                input.focus();
                input.selectionStart = oldSelection;
            };
        }

        return {
            __kind: "html_element",
            type: "input",
            props: inputProps,
            children,
        } as RWRElement<Record<string, any>>;
    };
}
