import {
    DOMComponent,
    ProxyDOMComponent,
    RealDOMComponent,
    RWRNode,
    RWRNodeEffect,
} from "./types";
import { createChildContext, createRoot, runEffectInContext } from "./context";

export function render(renderEffect: RWRNodeEffect, container: HTMLElement) {
    return createRoot((dispose) => {
        const node = createRenderEffect(renderEffect);
        mount(node, container);
        return () => {
            container.removeChild(node.getNode());
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
    let getNode: () => Node;
    let parentNode: HTMLElement;

    const replaceNode = (newComponent: DOMComponent) => {
        mount(newComponent, parentNode, getNode());

        if (newComponent.__kind === "dom_component") {
            node = newComponent.node;
            getNode = () => node!;
        } else {
            node = null;
            getNode = newComponent.getNode;
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
        getNode = () => node!;
    } else {
        node = null;
        getNode = component.getNode;
    }
    console.log("render", renderNb, component);

    return {
        __kind: "render_effect",
        getNode: () => getNode(),
        mount: (p) => {
            console.log("mounting", renderNb, p, component);
            if (component.__kind === "render_effect") {
                component.mount(p);
            }
            console.log("end");
            parentNode = p;
        },
    };
}

function createDOMComponent(component: RWRNode): DOMComponent {
    if (component == null || typeof component === "boolean") {
        return domComponent(document.createComment("void"));
    } else if (
        typeof component === "string" ||
        typeof component === "number" ||
        typeof component === "bigint"
    ) {
        return domComponent(document.createTextNode(component.toString()));
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
}

export function mount(
    component: DOMComponent,
    container: HTMLElement,
    previousNode?: Node
) {
    const newNode =
        component.__kind === "dom_component"
            ? component.node
            : component.getNode();

    if (component.__kind === "render_effect") {
        component.mount(container);
    }

    if (previousNode) {
        container.replaceChild(newNode, previousNode);
    } else {
        container.appendChild(newNode);
    }
}
