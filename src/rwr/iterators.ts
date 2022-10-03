import { DOMComponent, RWRNode, RWRNodeEffect } from "./types";
import { createRoot } from "./context";
import { createRenderEffect } from "./dom";

interface Entry {
    key: string;
    index: number;
    node: DOMComponent;
    dispose: () => void;
}

interface KeyedElement {
    key: string;
}

interface ForProps {
    each: () => Iterable<KeyedElement>;
    children?: [(element: KeyedElement) => RWRNode];
}

export function For({ each, children }: ForProps): RWRNodeEffect {
    let previous = new Map<string, Entry>();

    return () => {
        const nextList = [...each()];
        const next = new Map<string, Entry>();

        const nextComponents = [] as DOMComponent[];

        for (const [i, element] of nextList.entries()) {
            let node: DOMComponent;
            let dispose: () => void;
            if (previous.has(element.key)) {
                const previousEntry = previous.get(element.key)!;
                node = previousEntry.node;
                dispose = previousEntry.dispose;
                previousEntry.index = -1;
            } else {
                const item = createRoot((dispose) => ({
                    node: createRenderEffect(
                        () =>
                            (children && children[0] && children[0](element)) ||
                            null
                    ),
                    dispose,
                }));
                node = item.node;
                dispose = item.dispose;
            }

            next.set(element.key, {
                key: element.key,
                index: i,
                node,
                dispose,
            });
            nextComponents.push(node);
        }

        // Cleanup
        previous.forEach(({ index, dispose }) => {
            if (index >= 0) {
                dispose();
            }
        });

        previous = next;
        return nextComponents; // a fragment :)
    };
}

export function Index() {
    // TODO
}

/* HELPERS */

export function mapArray() {
    // TODO
}

export function indexArray() {
    // TODO
}
