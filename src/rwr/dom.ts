import {
    DOMComponent,
    MultiDOMComponent,
    ProxyDOMComponent,
    RealDOMComponent,
    RWRComponent,
    RWRNode,
    RWRNodeEffect,
} from "./types";
import { flatten, createLogger, Nested } from "./helper";
import { createChildContext, createRoot, runEffectInContext } from "./context";
import { createComputed } from "./reactivity";

const logger = createLogger("dom");

export function render(renderEffect: RWRNodeEffect, container: HTMLElement) {
    return createRoot((dispose) => {
        const node = createRenderEffect(renderEffect);
        mount(node, container);
        return () => {
            for (const c of node.getNodes()) {
                container.removeChild(c);
            }
            dispose();
        };
    });
}

let nb = 0;

export function createRenderEffect(
    renderEffect: RWRNodeEffect,
    Component?: RWRComponent
): ProxyDOMComponent {
    const renderNb = nb++;
    let component: DOMComponent;
    let node: Node | null = null;
    let getNodes: () => Node[];
    let parentNode:
        | HTMLElement
        | ((component: DOMComponent, previousNodes?: Node[]) => void);

    const rerender = () => {
        component = createDOMComponent(renderEffect());
        if (component.__kind === "dom_component") {
            node = component.node;
            getNodes = () => [node!];
        } else {
            node = null;
            getNodes = component.getNodes;
        }
    };

    // Define the update context
    const childContext = createChildContext(() => {
        const previousNodes = getNodes();
        rerender();
        mount(component, parentNode, previousNodes);
    });

    // Run the render effect a first time
    runEffectInContext(childContext, () => {
        rerender();
        logger.log("render", renderNb, component);
    });

    return {
        __kind: "proxy_component",
        type: Component,
        get target() {
            return component;
        },
        getNodes: () => getNodes(),
        mount: (p) => {
            if (parentNode && parentNode !== p) {
                console.warn("Overwriting", parentNode, "with", p);
            }
            logger.log("mounting", renderNb, p, component);
            notifyMount(p, component);
            logger.log("end");
            parentNode = p;
        },
    };
}

function notifyMount(
    parent:
        | HTMLElement
        | ((component: DOMComponent, previousNodes?: Node[]) => void),
    component: DOMComponent
) {
    if (component.__kind === "proxy_component") {
        component.mount(parent);
    } else if (component.__kind === "multi_components") {
        const notifyMountOfParent = notifyMount.bind(null, parent);
        component.components.forEach(notifyMountOfParent);
    }
}

function createDOMComponent(component: RWRNode): DOMComponent {
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
                component.map((c) => {
                    if (typeof c === "function") {
                        return createRenderEffect(c);
                    } else {
                        return createDOMComponent(c);
                    }
                })
            );
        } else {
            // take the spot for mount
            return domComponent(document.createComment("empty_fragment"));
        }
    } else if (component.__kind !== "element") {
        return component;
    } else {
        const element = document.createElement(component.type);
        Object.entries(component.props).forEach(([name, value]) => {
            if (name === "ref") {
                if (typeof value === "function") {
                    value(element);
                } else {
                    value.current = element;
                }
            } else if (!name.startsWith("on")) {
                if (typeof value === "function") {
                    createComputed(() => {
                        setDOMAttribute(element, name, value());
                    });
                } else {
                    setDOMAttribute(element, name, value);
                }
            } else {
                element.addEventListener(name.substring(2), value);
            }
        });
        component.children.forEach((child) => {
            mount(createDOMComponent(child), element);
        });
        return domComponent(element);
    }
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
                Object.entries(value as Record<string, string>).forEach(
                    ([prop, val]) => {
                        element.style[prop] = val;
                    }
                );
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
                    if (
                        Boolean(status) != element.classList.contains(className)
                    ) {
                        element.classList.toggle(className);
                    }
                }
            );
            return;
    }
    element.setAttribute(name, value);
}

function domComponent(node: Node): RealDOMComponent {
    return {
        __kind: "dom_component",
        node,
    };
}

function multiComponents(components: DOMComponent[]): MultiDOMComponent {
    return {
        __kind: "multi_components",
        components,
        getNodes: () => flatten(getAllNodes(components)),
    };
}

export function getAllNodes(components: DOMComponent[]): Nested<Node> {
    return components.map((c) => {
        if (c.__kind === "dom_component") {
            return [c.node];
        } else if (c.__kind === "proxy_component") {
            return c.getNodes();
        } else {
            return getAllNodes(c.components);
        }
    });
}

export function mount(
    component: DOMComponent,
    container:
        | HTMLElement
        | ((component: DOMComponent, previousNodes?: Node[]) => void),
    previousNodes?: Node[]
) {
    let newNodes: Node[];

    if (component.__kind === "dom_component") {
        newNodes = [component.node];
    } else {
        newNodes = component.getNodes();
    }

    notifyMount(container, component);

    if (
        (container == null || typeof container === "function") &&
        previousNodes &&
        previousNodes.length > 0 &&
        previousNodes[0].parentNode
    ) {
        console.error(
            "Previous nodes had parent",
            previousNodes[0],
            previousNodes[0].parentNode
        );
        const parent = previousNodes[0].parentNode;
        previousNodes.forEach((n) => parent.removeChild(n));
    }

    if (container == null) {
        console.warn("No re-rendering of", component, "since it has no parent");
        return;
    }

    if (typeof container === "function") {
        container(component, previousNodes);
        return;
    }

    if (
        previousNodes &&
        previousNodes.length > 0 &&
        previousNodes[0].parentNode
    ) {
        const nextSibling = previousNodes[previousNodes.length - 1].nextSibling;
        const [newItems, oldItems] = convertToItems(newNodes, previousNodes);
        replaceNodes(container, newItems, oldItems, nextSibling);
    } else {
        if (previousNodes && previousNodes.length > 0) {
            console.error("No parent for previous nodes", previousNodes);
        }
        newNodes.forEach((n) => container.appendChild(n));
    }
}

function replaceNodes(
    container: HTMLElement,
    newItems: NodeItem[],
    oldItems: NodeItem[],
    nextSibling: Node | null
) {
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
                    container.insertBefore(
                        newItems[newCursor].node,
                        oldItem.node
                    );
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

function nodeToItem(
    map: Map<Node, NodeItem>,
    indexProp: "oldSlot" | "newSlot",
    node: Node,
    index: number
) {
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
