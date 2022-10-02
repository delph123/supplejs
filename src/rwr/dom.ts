import { DOMComponent, RWRNode, RWRNodeEffect } from "./types";
import { createChildContext, createRoot, runEffectInContext } from "./context";

export function render(renderEffect: RWRNodeEffect, container: HTMLElement) {
    return createRoot((dispose) => {
        const node = createRenderEffect(renderEffect);
        container.appendChild(node);
        return () => {
            // XXX use the first child since the node above may have been replaced.
            // This isn't perfect but for now it will do!
            container.removeChild(container.firstChild!);
            dispose();
        };
    });
}

export function createRenderEffect(renderEffect: RWRNodeEffect) {
    let node: Node;
    const replaceNode = (newNode: Node) => {
        node.parentNode?.replaceChild(newNode, node);
        node = newNode;
    };

    // Define the update context
    const childContext = createChildContext(() => {
        replaceNode(createDOMComponent(renderEffect()));
    });

    // Run the render effect a first time
    node = runEffectInContext(childContext, () => {
        return createDOMComponent(renderEffect());
    });

    return node;
}

function createDOMComponent(component: RWRNode): DOMComponent {
    if (component == null || typeof component === "boolean") {
        return document.createComment("void");
    } else if (
        typeof component === "string" ||
        typeof component === "number" ||
        typeof component === "bigint"
    ) {
        return document.createTextNode(component.toString());
    } else if (component instanceof Node) {
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
            element.appendChild(createDOMComponent(child));
        });
        return element;
    }
}
