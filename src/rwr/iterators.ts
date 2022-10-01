import { createEffect, createRenderEffect, untrack } from "./reactivity";
import { RWRNode } from "./rwr";

interface Entry {
  key: string;
  index: number;
  node: Node;
}

interface KeyedElement {
  key: string;
}

interface ForProps {
  anchor: string;
  each: () => Iterable<KeyedElement>;
  children: [(item) => RWRNode] | ((item) => RWRNode);
}

export function For({ anchor, each, children }: ForProps) {
  let previous = new Map<string, Entry>();
  const root = document.createElement(anchor);
  createEffect(() => {
    const nextList = [...each()];
    const next = new Map<string, Entry>();
    while (root.firstChild) {
      root.firstChild.remove();
    }
    for (const [i, element] of nextList.entries()) {
      let node: Node;
      if (previous.has(element.key)) {
        const previousEntry = previous.get(element.key)!;
        node = previousEntry.node;
        previousEntry.index = -1;
      } else {
        node = untrack(() => createRenderEffect(() => children[0](element)));
      }
      next.set(element.key, {
        key: element.key,
        index: i,
        node,
      });
      root.appendChild(node);
    }
    previous.forEach(({ index, node }) => {
      if (index >= 0) {
        // dispose?
        console.log("Dispose", node);
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
