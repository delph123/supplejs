export type RWRElement = string | null;

export const version = "0.1";

export function render(
  component: () => RWRElement,
  element: HTMLElement
): void {
  let rwrelement = component();
  if (rwrelement) {
    const child = document.createTextNode(rwrelement);
    element.appendChild(child);
  }
}
