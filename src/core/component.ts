import { onCleanup } from "./context";
import { createDOMComponent, createRenderEffect, mount, multiComponents } from "./dom";
import { createLogger, flatten, shallowArrayEqual, toArray } from "./helper";
import { mapArray } from "./iterators";
import { h } from "./jsx";
import { createComputed, createSignal } from "./reactivity";
import { DOMComponent, SuppleComponent, SuppleNode, RealDOMComponent } from "./types";

const logger = createLogger("children");

function extractRealDOMComponents(component: DOMComponent): RealDOMComponent[] {
    if (component.__kind === "dom_component") {
        return [component];
    } else if (component.__kind === "proxy_component") {
        return extractRealDOMComponents(component.target);
    } else {
        return component.components.flatMap(extractRealDOMComponents);
    }
}

/**
 * The children helper is for complicated interactions with props.children,
 * when you're not just passing children on to another component using
 * {props.children} once in JSX.
 *
 * The function takes a getter for props.children like so:
 * ```
 *     const resolved = children(() => props.children);
 * ```
 *
 * The return value is a memo evaluating to the resolved children, which
 * updates whenever the children change. Using this memo instead of accessing
 * props.children directly has some important advantages in some scenarios.
 * The underlying issue is that, when you access children from the component,
 * they have not yet been processed by SuppleJS and are therefore still encoded
 * as a low-level virtual DOM array. The children will be converted into real
 * DOM by SuppleJS only after they are added in the rendering tree (the goal
 * being that they should only be rendered when actually needed and that they
 * should be re-created from scratch when they are inserted back in the tree
 * after they were removed, for example by a <Show /> component).
 *
 * Two particular consequences:
 *  - If you add props.children multiple times in the tree, the children (and
 *    associated DOM) will be created multiple times. This is useful if you
 *    want the DOM to be duplicated (as DOM nodes can appear in only one parent
 *    element).
 *  - If you need to access props.children outside of a tracking scope, you are
 *    accessing a low-level interface which is not part of the API and on which
 *    you should not rely.
 *
 * In addition, the children helper "resolves" children by calling argumentless
 * functions and flattening arrays of arrays into an array.
 *
 * An important aspect of the children helper is that it forces the children to
 * be created and resolved, as it accesses props.children immediately. This can
 * be undesirable for conditional rendering, e.g., when using the children
 * within a <Show> component. To evaluate the children only when <Show> would
 * render them, you can pass a function that evaluates children only when you
 * actually want to evaluate the children:
 * ```
 *     const resolved = children(() => visible() && props.children);
 * ```
 *
 * @private this API is currently private since it exposes low-level details
 *
 * @param childrenGetter a function to get the children
 * @returns a flat array of resolved children
 */
export function children(childrenGetter: () => SuppleNode | undefined) {
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
            logger.log("children notified with", component, root);
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

/**
 * Used to lazy load components to allow for code splitting.
 *
 * Components are not loaded until rendered. Lazy loaded components can be used
 * the same as their statically imported counterpart, receiving props, etc.
 *
 * Example:
 * ```
 *     // Wrap import
 *     const ComponentA = lazy(() => import("./ComponentA"));
 *
 *     // Use in JSX
 *     <ComponentA title={props.title} />;
 * ```
 *
 * Additionally, the returned component exposes a ```Component.preload()```
 * method that can be used to start preloading the component.
 *
 * @param componentLoader the function that loads the component. Returns a
 *                        Promise<Component>
 * @returns a dynamic component that will lazy load the actual component
 *          and render it after it has finished loaded
 */
export function lazy<Component extends SuppleComponent<any>>(
    componentLoader: () => Promise<{ default: Component }>,
): SuppleComponent<any> & { preload: () => Promise<Component> } {
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

    const LazyComponent = (props) => {
        preload();

        return () => {
            // TODO ... improve with Suspense
            if (component().error) return "Error while loading component :-(";
            // TODO ... improve with ErrorBoundary
            if (!component().target) return "Loading component...";

            return h(component().target!, props);
        };
    };
    LazyComponent.preload = preload;

    return LazyComponent;
}
