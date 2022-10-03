import { RWRNodeEffect } from "./types";
import { h } from "./jsx";

export function Input({
    id,
    value,
    oninput,
    className,
    ...props
}: {
    id: string;
    value: () => string;
    oninput: (e) => void;
    [x: string]: any;
}): RWRNodeEffect {
    return () => (
        <input
            id={id}
            value={value()}
            oninput={(e) => {
                let node: HTMLElement = e.currentTarget.parentElement;
                let oldSelection = e.currentTarget.selectionStart;
                oninput(e);
                let input = node.querySelector("#" + id) as HTMLInputElement;
                input.focus();
                input.selectionStart = oldSelection;
            }}
            {...props}
        ></input>
    );
}

export function Show() {
    // TODO
}

export function Switch() {
    // TODO
}

export function Match() {
    // TODO
}

export function ErrorBoundary() {
    // TODO
}

export function Suspense() {
    // TODO
}
