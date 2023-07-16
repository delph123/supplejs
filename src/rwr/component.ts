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

export function lazy<Component extends RWRComponent<any>>(
    componentLoader: () => Promise<{ default: Component }>
): RWRComponent<any> & { preload: () => Promise<Component> } {
    let promise: Promise<Component>;
    const [component, setComponent] = createSignal<{
        target?: any;
        error?: any;
    }>({});

    const preload = () => {
        if (!promise) {
            promise = componentLoader()
                .then(({ default: target }) => {
                    setComponent({ target });
                    return target;
                })
                .catch((error) => {
                    setComponent({ error });
                    throw error;
                });
        }
        return promise;
    };

    const lazyCompnent = (props) => {
        preload();

        return () => {
            // TODO ... improve with Suspense
            if (component().error) return "Error while loading component :-(";
            // TODO ... improve with ErrorBoundary
            if (!component().target) return "Loading component...";

            return h(component()!.target, props);
        };
    };
    lazyCompnent.preload = preload;

    return lazyCompnent;
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
