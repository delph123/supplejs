import { RWRNodeEffect } from "./types";
import { h } from "./jsx";

type InputElementInputEvent = InputEvent & {
    currentTarget: HTMLInputElement;
    target: Element;
};

export function Input({
    id,
    value,
    oninput,
    className,
    ...props
}: {
    id: string;
    value: () => string;
    oninput: (e: InputElementInputEvent) => void;
    [x: string]: any;
}) {
    return () => (
        <input
            id={id}
            value={value()}
            oninput={(e: InputElementInputEvent) => {
                let node = e.currentTarget.parentElement!;
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
