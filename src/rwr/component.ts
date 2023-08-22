import { onCleanup, onMount } from "./context";
import {
    createDOMComponent,
    createRenderEffect,
    mount,
    multiComponents,
    render,
} from "./dom";
import { flatten, shallowArrayEqual, toArray } from "./helper";
import { mapArray } from "./iterators";
import { h } from "./jsx";
import { createComputed, createSignal } from "./reactivity";
import {
    DOMComponent,
    RWRChild,
    RWRComponent,
    RWRNode,
    RealDOMComponent,
} from "./types";

function extractRealDOMComponents(component: DOMComponent): RealDOMComponent[] {
    if (component.__kind === "dom_component") {
        return [component];
    } else if (component.__kind === "proxy_component") {
        return extractRealDOMComponents(component.target);
    } else {
        return component.components.flatMap(extractRealDOMComponents);
    }
}

export function children(childrenGetter: () => RWRNode | undefined) {
    const [components, setComponents] = createSignal<RealDOMComponent[]>([], {
        equals: shallowArrayEqual,
    });

    const childrenArray = mapArray(
        () => flatten(toArray(childrenGetter())),
        (child) => {
            if (typeof child === "function") {
                return createRenderEffect(child);
            } else {
                return createDOMComponent(child);
            }
        },
    );

    createComputed(() => {
        const root = multiComponents(childrenArray());
        const handler = (component) => {
            console.log("children notified with", component, root);
            setComponents(extractRealDOMComponents(root));
        };
        mount(root, handler);
        onCleanup(() => {
            root.components.forEach((c) => c.mount(null, root));
            root.components.length = 0;
            root.mount(null, handler);
        });
    });

    return components;
}

export function createContext() {
    // TODO
}

export function useContext() {
    // TODO
}

export function lazy<Component extends RWRComponent<any>>(
    componentLoader: () => Promise<{ default: Component }>,
): RWRComponent<any> & { preload: () => Promise<Component> } {
    let promise: Promise<Component> | undefined;
    const [component, setComponent] = createSignal<{
        target?: Component;
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

    const lazyComponent = (props) => {
        preload();

        return () => {
            // TODO ... improve with Suspense
            if (component().error) return "Error while loading component :-(";
            // TODO ... improve with ErrorBoundary
            if (!component().target) return "Loading component...";

            return h(component().target!, props);
        };
    };
    lazyComponent.preload = preload;

    return lazyComponent;
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

export function Portal(props: {
    mount?: HTMLElement;
    useShadow?: boolean;
    children?: RWRChild[];
}) {
    const dispose = render(
        () =>
            h("div", {
                useShadow: props.useShadow ?? false,
                children: props.children,
            }),
        props.mount ?? document.body,
    );
    onCleanup(dispose);
    return () => null;
}

export function useCSS(cssFilePath: string) {
    let link;
    onMount(() => {
        // Creating link element
        link = document.createElement("link");
        link.href = cssFilePath;
        link.type = "text/css";
        link.rel = "stylesheet";
        document.head.append(link);
    });
    onCleanup(() => {
        document.head.removeChild(link);
    });
}
