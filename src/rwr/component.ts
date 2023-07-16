import { createDOMComponent, mount } from "./dom";
import { createSignal } from "./reactivity";
import { DOMComponent, RWRChild } from "./types";

export function children(
    props: RWRChild[] | { children: RWRChild[] } | undefined | null
) {
    const target = createDOMComponent(
        Array.isArray(props) ? props : props?.children || []
    );
    const [children, setChildren] = createSignal<DOMComponent[]>([], {
        equals: false,
    });
    mount(target, (component, previousNodes) => {
        console.log("children notified with", component, target);
        setChildren(
            target.__kind === "multi_components" ? target.components : []
        );
    });
    return children;
}
