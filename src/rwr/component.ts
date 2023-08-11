import { onCleanup, untrack } from "./context";
import { createDOMComponent, mount, render } from "./dom";
import { shallowArrayEqual, toArray } from "./helper";
import { h } from "./jsx";
import { createComputed, createMemo, createSignal } from "./reactivity";
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

    const target = createMemo(() =>
        createDOMComponent(toArray(childrenGetter())),
    );

    createComputed(() => {
        mount(target(), (component) => {
            console.log("children notified with", component, target);
            setComponents(extractRealDOMComponents(untrack(target)));
        });
        onCleanup(() => mount(target(), null));
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

    const lazyCompnent = (props) => {
        preload();

        return () => {
            // TODO ... improve with Suspense
            if (component().error) return "Error while loading component :-(";
            // TODO ... improve with ErrorBoundary
            if (!component().target) return "Loading component...";

            return h(component().target!, props);
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
