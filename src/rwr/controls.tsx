import { children } from "./component";
import { untrack } from "./context";
import { createDOMComponent } from "./dom";
import { toValue } from "./helper";
import { createMemo } from "./reactivity";
import {
    DOMComponent,
    RWRChild,
    RWRNode,
    RWRNodeEffect,
    ValueOrAccessor,
} from "./types";

type WhenCondition<T> = T | undefined | null | false;

interface MatchProps<T> {
    when: ValueOrAccessor<WhenCondition<T>>;
    children?: RWRNode[] | [(item: T) => RWRNode];
}

interface ShowProps<T> extends MatchProps<T> {
    keyed?: boolean;
    fallback?: RWRChild;
}

export function Show<T>(props: ShowProps<T>): RWRNodeEffect {
    const whenValue = createMemo(() => toValue(props.when));
    const display = createMemo(() => {
        return whenValue() != null && whenValue() !== false;
    });
    return () => {
        if (display()) {
            if (
                props.children?.length === 1 &&
                typeof props.children?.[0] === "function"
            ) {
                if (props.keyed) {
                    // Pass the value and track it so that the child function
                    // is re-executed whenever the underlying model is changed
                    return props.children[0](whenValue() as T);
                } else {
                    // Pass the value but do not track, so that the Show component
                    // only re-renders when the truthiness of the value changes
                    return props.children[0](untrack(whenValue) as T);
                }
            } else {
                return props.children as RWRNode[];
            }
        } else {
            return toValue(props.fallback) ?? null;
        }
    };
}

export function Switch(props: {
    keyed?: boolean;
    fallback?: RWRChild;
    children?: RWRChild[];
}): RWRNodeEffect {
    const resolved = children(() => props.children);

    const firstChildMatching = createMemo(
        () => {
            const matchChildren = resolved().filter(
                (c) => "type" in c && c.type === Match,
            ) as (DOMComponent & MatchProps<unknown>)[];
            console.log("Filtered =>", matchChildren);

            const displayMatches = matchChildren.map((m) => toValue(m.when));
            const matchingIndex = displayMatches.findIndex(
                (v) => v != null && v !== false,
            );
            if (matchingIndex >= 0) {
                return [
                    matchChildren[matchingIndex],
                    displayMatches[matchingIndex],
                ] as const;
            } else {
                return null;
            }
        },
        undefined,
        {
            equals(prev, next) {
                if (!props.keyed) {
                    // If the Switch is not keyed, the memo will only re-render when the
                    // matched branch actually changes, independantly of the value of the
                    // underlying model (the "when" attribute's value)
                    return (
                        (prev == null && next == null) ||
                        (prev != null && next != null && prev[0] === next[0])
                    );
                } else {
                    // Whereas, if the Switch is keyed, we want the memo to re-render
                    // both when the matched branche changes, but also when the underlying
                    // model changes value, therefore we compare both
                    return (
                        (prev == null && next == null) ||
                        (prev != null &&
                            next != null &&
                            prev[0] === next[0] &&
                            prev[1] === next[1])
                    );
                }
            },
        },
    );

    return () => {
        const matching = firstChildMatching();
        if (matching) {
            if (
                matching[0].children?.length === 1 &&
                typeof matching[0].children?.[0] === "function"
            ) {
                return matching[0].children[0](matching[1]);
            } else {
                return matching[0].children as RWRNode[];
            }
        } else {
            return toValue(props.fallback) ?? null;
        }
    };
}

export function Match<T>(props: MatchProps<T>) {
    // The Match component is returning a fake empty DOM Component
    // that is enriched with the Match props, so that this
    // component can be resolved with children() helper and analyzed
    // by the parent Switch, which is in charge of running the when
    // clause, defining the Match branch to display & finally add
    // Match children to the DOM.
    return () => {
        return {
            ...createDOMComponent(null),
            type: Match,
            when: props.when,
            children: props.children,
        };
    };
}

export function ErrorBoundary() {
    // TODO
}

export function Suspense() {
    // TODO
}
