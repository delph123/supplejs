import { createDOMComponent, mount } from "./dom";
import { h } from "./jsx";
import { createSignal } from "./reactivity";
import { DOMComponent, RWRChild, RWRComponent } from "./types";

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

export function createContext() {
    // TODO
}

export function useContext() {
    // TODO
}

export function lazy() {
    // TODO
}

export function Dynamic<Props>({
    component,
    ...props
}: Props & {
    children?: any[];
    component: RWRComponent<Props> | string;
}) {
    return () => h(component, props as Props & { children? });
}

export function Portal() {
    // TODO
}
