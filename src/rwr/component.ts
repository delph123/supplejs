import { onCleanup } from "./context";
import { createDOMComponent, mount, render } from "./dom";
import { memo } from "./helper";
import { h } from "./jsx";
import { createSignal } from "./reactivity";
import { DOMComponent, RWRChild, RWRComponent } from "./types";

const mirrorComponent = (target: DOMComponent, mc) => {
    return {
        __kind: target.__kind,
        get node() {
            return target.__kind === "dom_component" ? target.node : undefined;
        },
        get components() {
            return target.__kind === "multi_components"
                ? target.components.map((c) => mc(c, mc))
                : undefined;
        },
        get type() {
            return target.__kind === "proxy_component"
                ? target.type
                : undefined;
        },
        get target() {
            return target.__kind === "proxy_component"
                ? mc(target.target, mc)
                : (undefined as any);
        },
        get id() {
            return target.__kind === "proxy_component"
                ? "mirror:" + target.id
                : (undefined as any);
        },
        parent: null,
        nodes() {
            // return (this as any).clones;
            // console.log("nodes()", this);
            return target.nodes(); //.map((n) => n.cloneNode());
        },
        mount(parent, oldParent) {
            console.log("Mounting", this, parent);
            this.parent = parent;
            // target.mount(parent, oldParent);
        },
    } as DOMComponent;
};

const memoizedMirrorComponent = memo(mirrorComponent);

export function children(
    props: RWRChild[] | { children: RWRChild[] } | undefined | null,
) {
    const target = createDOMComponent(
        Array.isArray(props) ? props : props?.children ?? [],
    );
    const [components, setComponents] = createSignal<DOMComponent[]>([], {
        equals: false,
    });
    mount(target, (component) => {
        console.log("children notified with", component, target);
        setComponents(
            target.__kind === "multi_components"
                ? target.components.map(memoizedMirrorComponent)
                : [],
        );
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
    mount: HTMLElement;
    useShadow?: boolean;
    children?: RWRChild[];
}) {
    let container: Node = props.mount;
    if (props?.useShadow) {
        container =
            props.mount.shadowRoot ??
            props.mount.attachShadow({ mode: "open" });
    }
    const dispose = render(
        () => h("div", {}, ...(props?.children ?? [])),
        container,
    );
    onCleanup(dispose);
    return () => null;
}
