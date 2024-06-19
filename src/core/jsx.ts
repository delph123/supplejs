import {
    SuppleChildren,
    SuppleComponent,
    JSXElement,
    SuppleNodeEffect,
    Ref,
    ValueOrAccessor,
    JSXHTMLElement,
} from "./types";
import { toValue } from "./helper";

export function h<Props>(
    type: string | SuppleComponent<Props>,
    props?: Props & { children?: SuppleChildren },
    ...children: SuppleChildren
): JSXElement<Props> {
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
            __kind: "supple_element",
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

export function Fragment({ children }: { children: SuppleChildren }): SuppleNodeEffect {
    return () => children;
}

const OVERRIDES = {
    input: Input,
};

function overrideDomType<Props>(type: string | SuppleComponent<Props>) {
    if (typeof type === "string" && OVERRIDES[type]) {
        return OVERRIDES[type] as SuppleComponent<Props>;
    } else {
        return type;
    }
}

type InputElementInputEvent = InputEvent & {
    currentTarget: HTMLInputElement;
    target: Element;
};

function Input({
    ref,
    value,
    oninput,
    onInput,
    children,
    ...props
}: {
    ref?: Ref<HTMLInputElement | undefined>;
    value?: ValueOrAccessor<string>;
    oninput?: (e: InputElementInputEvent) => void;
    children?: SuppleChildren;
    [x: string]: any;
}): SuppleNodeEffect {
    let inputRef: HTMLInputElement | undefined;

    const inputProps = {
        ...props,
    };

    inputProps.ref = (el: HTMLInputElement) => {
        inputRef = el;
        if (ref != null) {
            if (typeof ref === "function") {
                ref(el);
            } else {
                ref.current = el;
            }
        }
    };

    if (oninput != null || onInput != null) {
        inputProps.onInput = (e: InputElementInputEvent) => {
            const oldSelection = e.currentTarget.selectionStart;
            (onInput ?? oninput)(e);
            if (inputRef) {
                inputRef.focus();
                inputRef.selectionStart = oldSelection;
            }
        };
    }

    return () => {
        if (value != null) {
            inputProps.value = toValue(value);
        }

        return {
            __kind: "html_element",
            type: "input",
            props: inputProps,
            children,
        } as JSXHTMLElement<Record<string, any>>;
    };
}
