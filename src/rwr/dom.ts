import {
    DOMComponent,
    MultiDOMComponent,
    ProxyDOMComponent,
    RealDOMComponent,
    RWRNode,
    RWRNodeEffect,
} from "./types";
import { flatten, createLogger, Nested } from "./helper";
import { createChildContext, createRoot, runEffectInContext } from "./context";

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
    renderEffect: RWRNodeEffect
): ProxyDOMComponent {
    const renderNb = nb++;
    let node: Node | null = null;
    let getNodes: () => Node[];
    let parentNode: HTMLElement;

    const replaceNode = (newComponent: DOMComponent) => {
        mount(newComponent, parentNode, getNodes());

        if (newComponent.__kind === "dom_component") {
            node = newComponent.node;
            getNodes = () => [node!];
        } else {
            node = null;
            getNodes = newComponent.getNodes;
        }
    };

    // Define the update context
    const childContext = createChildContext(() => {
        replaceNode(createDOMComponent(renderEffect()));
    });

    // Run the render effect a first time
    const component = runEffectInContext(childContext, () => {
        return createDOMComponent(renderEffect());
    });

    if (component.__kind === "dom_component") {
        node = component.node;
        getNodes = () => [node!];
    } else {
        node = null;
        getNodes = component.getNodes;
    }

    logger.log("render", renderNb, component);

    return {
        __kind: "render_effect",
        getNodes: () => getNodes(),
        mount: (p) => {
            logger.log("mounting", renderNb, p, component);
            notifyMount(p, component);
            logger.log("end");
            parentNode = p;
        },
    };
}

function notifyMount(parent: HTMLElement, component: DOMComponent) {
    if (component.__kind === "render_effect") {
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
            return multiComponents(component.map(createDOMComponent));
        } else {
            // take the spot for mount
            return domComponent(document.createComment("empty_fragment"));
        }
    } else if (component.__kind !== "element") {
        return component;
    } else {
        const element = document.createElement(component.type);
        Object.entries(component.props).forEach(([name, value]) => {
            if (!name.startsWith("on")) {
                element.setAttribute(name, value);
            } else {
                element.addEventListener(name.substring(2), value);
            }
        });
        component.children.forEach((child) => {
            mount(createDOMComponent(child), element);
        });
        return domComponent(element);
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
}

export function getAllNodes(components: DOMComponent[]): Nested<Node> {
    return components.map((c) => {
        if (c.__kind === "dom_component") {
            return [c.node];
        } else if (c.__kind === "render_effect") {
            return c.getNodes();
        } else {
            return getAllNodes(c.components);
        }
    });
}

export function mount(
    component: DOMComponent,
    container: HTMLElement,
    previousNodes?: Node[]
) {
    let newNodes: Node[];

    if (component.__kind === "dom_component") {
        newNodes = [component.node];
    } else {
        newNodes = component.getNodes();
    }

    notifyMount(container, component);

    if (previousNodes) {
        const nextSibling = previousNodes[previousNodes.length - 1].nextSibling;
        for (const prevNode of previousNodes) {
            container.removeChild(prevNode);
        }
        for (const newNode of newNodes) {
            container.insertBefore(newNode, nextSibling);
        }
    } else {
        newNodes.forEach((n) => container.appendChild(n));
    }
}
