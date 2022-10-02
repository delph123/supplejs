import { RWRNode, RWRNodeEffect } from "./types";
import { createRoot } from "./context";
import { createEffect } from "./reactivity";
import { createRenderEffect } from "./dom";

interface Entry {
    key: string;
    index: number;
    node: () => Node;
    dispose: () => void;
}

interface KeyedElement {
    key: string;
}

interface ForProps {
    anchor: string;
    each: () => Iterable<KeyedElement>;
    children?: [(item: KeyedElement) => RWRNode];
}

export function For({ anchor, each, children }: ForProps): RWRNodeEffect {
    let previous = new Map<string, Entry>();
    const root = document.createElement(anchor);

    createEffect(() => {
        const nextList = [...each()];
        const next = new Map<string, Entry>();
        while (root.firstChild) {
            root.firstChild.remove();
        }
        for (const [i, element] of nextList.entries()) {
            let node: () => Node;
            let dispose: () => void;
            if (previous.has(element.key)) {
                const previousEntry = previous.get(element.key)!;
                node = previousEntry.node;
                dispose = previousEntry.dispose;
                previousEntry.index = -1;
            } else {
                const root = createRoot((dispose) => ({
                    node: createRenderEffect(
                        () =>
                            (children && children[0] && children[0](element)) ||
                            null
                    ),
                    dispose,
                }));
                node = root.node;
                dispose = root.dispose;
            }
            next.set(element.key, {
                key: element.key,
                index: i,
                node,
                dispose,
            });
            root.appendChild(node());
        }
        previous.forEach(({ index, dispose }) => {
            if (index >= 0) {
                dispose();
            }
        });
        previous = next;
    });

    return () => root;
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
