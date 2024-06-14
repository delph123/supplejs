import {
    DOMComponent,
    MultiDOMComponent,
    ProxyDOMComponent,
    RealDOMComponent,
    SuppleComponent,
    SuppleNode,
    SuppleNodeEffect,
    DOMContainer,
    JSXHTMLElement,
} from "./types";
import { createLogger, flatten } from "./helper";
import { createChildContext, createRoot, runEffectInContext } from "./context";
import { createComputed } from "./reactivity";
import { createComponent, runEffectInComponentContext } from "./component";

const logger = createLogger("dom");

export function render(renderEffect: SuppleNodeEffect, container?: Node) {
    const parent = container ?? document.body;
    return createRoot((dispose) => {
        const component = createRenderEffect(renderEffect);
        // component.mount(parent, null);
        mount(component, parent);
        return () => {
            for (const node of component.nodes()) {
                parent.removeChild(node);
            }
            dispose();
        };
    });
}

export function createRenderEffect(
    renderEffect: SuppleNodeEffect,
    inputProxyComponent?: ProxyDOMComponent,
): ProxyDOMComponent {
    const proxy = inputProxyComponent ?? proxyComponent();

    // Define the update context
    const childContext = createChildContext(() => {
        const previousNodes = proxy.target.nodes();
        // Unmount current target
        // proxy.target.mount(null, proxy);
        // Re-render DOM component
        proxy.target = createDOMComponent(runEffectInComponentContext(proxy, renderEffect));
        overwriteParent(proxy.target, proxy, null);
        logger.log("re-rendered", proxy.id, proxy.target);
        remount(proxy, previousNodes);
    });

    // Run the render effect a first time
    runEffectInContext(childContext, () => {
        proxy.target = createDOMComponent(runEffectInComponentContext(proxy, renderEffect));
        overwriteParent(proxy.target, proxy, null);
        logger.log("rendered", proxy.id, proxy.target);
    });

    return proxy;
}

function overwriteParent(component: DOMComponent, parent: DOMContainer, oldParent: DOMContainer) {
    if (component.parent === oldParent || component.parent === parent) {
        component.parent = parent;
    } else if (
        (typeof getParentHTMLElement(component.parent) === "function" &&
            getParentHTMLElement(parent) instanceof Node) ||
        (getParentHTMLElement(component.parent) == null && getParentHTMLElement(parent) != null)
    ) {
        logger.warn("Overwriting", component, parent);
        component.parent = parent;
    } else {
        logger.warn("Bad overwrite", component, parent);
        component.parent = parent;
    }
}

export function createDOMComponent(component: SuppleNode): DOMComponent {
    if (component == null || typeof component === "boolean") {
        // take the spot for mount
        return domComponent(document.createComment("void"));
    } else if (
        typeof component === "string" ||
        typeof component === "number" ||
        typeof component === "bigint"
    ) {
        return domComponent(document.createTextNode(component.toString()));
    } else if (Array.isArray(component)) {
        if (component.length > 0) {
            return multiComponents(
                // First, we need to recursively flatten the children array.
                // Then, if any child is a function, we want to automatically wrap
                // it in a render effect, so that it is automatically executed in a
                // tracking context.
                flatten(component).map((child) => {
                    if (typeof child === "function") {
                        return createRenderEffect(child);
                    } else {
                        return createDOMComponent(child);
                    }
                }),
            );
        } else {
            // take the spot for mount
            return domComponent(document.createComment("empty_fragment"));
        }
    } else if (component.__kind === "supple_element") {
        // Delegate component creation to `component.ts` so that we can set-up
        // the component context at the same time (for create/useContext APIs)
        return createComponent(component);
    } else if (component.__kind === "html_element") {
        return createHtmlElement(component);
    } else {
        return component;
    }
}

function createHtmlElement(component: JSXHTMLElement<any>) {
    const element = document.createElement(component.type);

    Object.entries(component.props as Record<string, any>).forEach(([name, value]) => {
        if (name === "ref") {
            if (typeof value === "function") {
                (value as (t: HTMLElement) => void)(element);
            } else if (value != null) {
                value.current = element;
            }
        } else if (name === "useShadow") {
            // do nothing
        } else if (!name.startsWith("on")) {
            if (typeof value === "function") {
                createComputed(() => {
                    setDOMAttribute(element, name, value());
                });
            } else {
                setDOMAttribute(element, name, value);
            }
        } else if (name.startsWith("on:")) {
            // Adds an event listener verbatim (for unusual names)
            element.addEventListener(name.substring(3), value);
        } else if (name.startsWith("oncapture:")) {
            // Adds an event listener verbatim (for unusual names)
            element.addEventListener(name.substring(10), value);
        } else {
            // Add an event listener for common UI event (name is lower cased)
            element.addEventListener(name.substring(2).toLowerCase(), value);
        }
    });

    let container: Node = element;
    if ("useShadow" in component.props && component.props.useShadow) {
        container = element.shadowRoot ?? element.attachShadow({ mode: "open" });
    }

    const domElement = domComponent(element);
    (element as any).__supple_component = domElement;

    // Treat children same as for multi-components, except this time we directly
    // mount the children to avoid one unnecessary level of indirection
    flatten(component.children)
        .map((child) => {
            if (typeof child === "function") {
                return createRenderEffect(child);
            } else {
                return createDOMComponent(child);
            }
        })
        .forEach((domChild) => {
            domChild.mount(domElement, null);
            mount(domChild, container);
        });

    return domElement;
}

function setDOMAttribute(element: HTMLElement, name: string, value: any) {
    switch (name) {
        case "style":
            if (typeof value === "object") {
                // Initialize style in case it's not empty
                if (element.style.length > 0) {
                    element.style.cssText = "";
                }
                // Set values through JS setter (supports both JS-style & CSS-style properties)
                Object.entries(value as Record<string, string>).forEach(([prop, val]) => {
                    element.style[prop] = val;
                });
                return;
            }
            break;
        case "className":
            element.className = value ?? "";
            return;
        case "classList":
            Object.entries(value as Record<string, any>).forEach(
                // Only set or unset changed elements from the record and leave other
                // classes unchanged (in case class & classList attributes are combined)
                ([className, status]) => {
                    if (Boolean(status) != element.classList.contains(className)) {
                        element.classList.toggle(className);
                    }
                },
            );
            return;
    }

    if (name.startsWith("prop:")) {
        element[name.substring(5)] = value;
    } else {
        const attrName = name.startsWith("attr:") ? name.substring(5) : name;
        if (value != null) {
            element.setAttribute(attrName, value);
        } else {
            element.removeAttribute(attrName);
        }
    }
}

function domComponent(node: Node): RealDOMComponent {
    return {
        __kind: "dom_component",
        node,
        parent: null,
        nodes: () => [node],
        mount(parent, oldParent) {
            logger.log("mounting-dom into", parent);
            overwriteParent(this, parent, oldParent);
        },
    };
}

export function multiComponents(components: DOMComponent[]): MultiDOMComponent {
    const component = {
        __kind: "multi_components",
        components,
        parent: null,
        nodes: () => components.flatMap((c) => c.nodes()),
        mount(parent, oldParent) {
            logger.log("mounting-multi into", parent);
            overwriteParent(this, parent, oldParent);
            // components.forEach((child) => child.mount(this, null));
        },
    } satisfies MultiDOMComponent;
    components.forEach((c) => overwriteParent(c, component, null));
    return component;
}

let nb = 0;

export function proxyComponent<Props>(Component?: SuppleComponent<Props>): ProxyDOMComponent {
    const renderNb = nb++;
    return {
        __kind: "proxy_component",
        type: Component,
        target: undefined as unknown as DOMComponent,
        parent: null,
        id: renderNb,
        nodes() {
            return this.target.nodes();
        },
        mount(parent, oldParent) {
            logger.log("mounting", renderNb, parent, this.target);
            overwriteParent(this, parent, oldParent);
            logger.log("end");
            // this.target.mount(this, null);
        },
    };
}

function getParentHTMLElement(container: DOMContainer) {
    if (container == null || !("__kind" in container)) {
        return container;
    } else {
        return getParentHTMLElement(container.parent);
    }
}

function mount(component: DOMComponent, container: Node) {
    component.nodes().forEach((n) => container.appendChild(n));
}

function remount(component: DOMComponent, previousNodes?: Node[]) {
    const parent = getParentHTMLElement(component.parent);

    // if (
    //     (parent == null || typeof parent === "function") &&
    //     previousNodes &&
    //     previousNodes.length > 0 &&
    //     previousNodes[0].parentNode
    // ) {
    //     console.error("Previous nodes had parent", previousNodes[0], previousNodes[0].parentNode, parent);
    //     const previousParent = previousNodes[0].parentNode;
    //     previousNodes.forEach((n) => previousParent.removeChild(n));
    // }

    if (typeof parent === "function") {
        parent(component, previousNodes);
        return;
    }

    // if (parent == null) {
    //     console.error("Error: no parent container!");
    //     return;
    // }

    if (previousNodes && previousNodes.length > 0 && previousNodes[0].parentNode) {
        // if (parent !== previousNodes[0].parentNode) {
        //     console.error("Different parent provided", parent, previousNodes[0].parentNode);
        // }
        const newNodes = component.nodes();
        const nextSibling = previousNodes[previousNodes.length - 1].nextSibling;
        const [newItems, oldItems] = convertToItems(newNodes, previousNodes);
        replaceNodes(previousNodes[0].parentNode, newItems, oldItems, nextSibling);
    } else {
        console.error("No parent for previous nodes", previousNodes);
    }
}

function replaceNodes(container: Node, newItems: NodeItem[], oldItems: NodeItem[], nextSibling: Node | null) {
    let newCursor = 0;
    let oldCursor = 0;

    let newItem: NodeItem;
    let oldItem: NodeItem;

    while (newCursor < newItems.length && oldCursor < oldItems.length) {
        newItem = newItems[newCursor];
        oldItem = oldItems[oldCursor];

        if (oldItem.newSlot !== NO_SLOT && oldItem.newSlot < newCursor) {
            oldCursor++;
        } else if (newItem === oldItem) {
            newCursor++;
            oldCursor++;
        } else if (oldItem.newSlot === NO_SLOT || newItem.oldSlot !== NO_SLOT) {
            container.replaceChild(newItem.node, oldItem.node);
            newCursor++;
            oldCursor++;
        } else if (oldItem.newSlot !== NO_SLOT && newItem.oldSlot === NO_SLOT) {
            if (isNextExisting(oldItem, newItems, newCursor + 1)) {
                while (newItems[newCursor].oldSlot === NO_SLOT) {
                    container.insertBefore(newItems[newCursor].node, oldItem.node);
                    newCursor++;
                }
            } else {
                container.replaceChild(newItem.node, oldItem.node);
                newCursor++;
                oldCursor++;
            }
        }
    }

    while (oldCursor < oldItems.length) {
        oldItem = oldItems[oldCursor];
        if (oldItem.newSlot === NO_SLOT) {
            container.removeChild(oldItem.node);
        }
        oldCursor++;
    }

    while (newCursor < newItems.length) {
        container.insertBefore(newItems[newCursor].node, nextSibling);
        newCursor++;
    }
}

function isNextExisting(item: NodeItem, items: NodeItem[], start: number) {
    let cursor = start;
    while (cursor < items.length && items[cursor].oldSlot === NO_SLOT) {
        cursor++;
    }
    return items[cursor] === item;
}

const NO_SLOT = -1;

interface NodeItem {
    node: Node;
    oldSlot: number;
    newSlot: number;
}

function convertToItems(newNodes: Node[], oldNodes: Node[]) {
    const allItemsMap = new Map();

    const convertNew = nodeToItem.bind(null, allItemsMap, "newSlot");
    const convertOld = nodeToItem.bind(null, allItemsMap, "oldSlot");

    const newItems = newNodes.map(convertNew);
    const oldItems = oldNodes.map(convertOld);

    return [newItems, oldItems];
}

function nodeToItem(map: Map<Node, NodeItem>, indexProp: "oldSlot" | "newSlot", node: Node, index: number) {
    let item: NodeItem;

    if (map.has(node)) {
        item = map.get(node)!;
    } else {
        item = {
            node,
            oldSlot: NO_SLOT,
            newSlot: NO_SLOT,
        };
        map.set(node, item);
    }

    item[indexProp] = index;

    return item;
}
