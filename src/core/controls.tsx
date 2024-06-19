import { children } from "./component";
import { onCleanup, untrack } from "./context";
import { h } from "./jsx";
import { createDOMComponent, render } from "./dom";
import { createLogger, toValue } from "./helper";
import { createMemo } from "./reactivity";
import {
    DOMComponent,
    Ref,
    SuppleChild,
    SuppleChildren,
    SuppleComponent,
    SuppleNode,
    SuppleNodeEffect,
    ValueOrAccessor,
} from "./types";

type WhenCondition<T> = T | undefined | null | false;

interface MatchProps<T> {
    when: ValueOrAccessor<WhenCondition<T>>;
    children?: SuppleChildren | [(item: T) => SuppleNode];
}

interface ShowProps<T> extends MatchProps<T> {
    keyed?: boolean;
    fallback?: SuppleChild;
}

const childrenLogger = createLogger("children");

/**
 * A component which conditionally renders children or fallback.
 *
 * The Show control flow is used to conditional render part of the view: it
 * renders children when the *when* is truthy, an fallback otherwise. It is
 * similar to the ternary operator (when ? children : fallback) but is ideal
 * for templating with JSX.
 *
 * Show can also accept a callback as its sole child. In which case, the
 * callback will be called by the Show component depending on the keyed prop:
 *  - If the <Show /> is not keyed, the callback will be called each time the
 *    visibility status changes (in other word, when the Boolean(when) does
 *    actually change. But it won't get called again if the underlying raw
 *    when signal is changed without resulting in a change of visibility.
 *  - If the <Show /> is keyed, the callback will be re-executed whenever the
 *    underlying when signal is changed, even if the visible status does not
 *    actually change. This can be used as a way of keying block to a model.
 *
 * @param when the condition to evaluate
 * @param children the children to display when the condition is truthy
 * @param fallback the fallback to display when the condition is falsy
 * @param keyed whether the callback is keyed to when signal or not
 */
export function Show<T>(props: ShowProps<T>): SuppleNodeEffect {
    const whenValue = createMemo(() => toValue(props.when));
    const display = createMemo(() => Boolean(whenValue()));
    return () => {
        if (display()) {
            if (props.children?.length === 1 && typeof props.children?.[0] === "function") {
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
                return props.children as SuppleNode[];
            }
        } else {
            return toValue(props.fallback) ?? null;
        }
    };
}

/**
 * A component which conditionally renders children depending on multiple
 * (usually exclusive) conditions.
 *
 * The <Switch> control flow is used to conditionally render part of the view:
 * it must be combined with one or multiple <Match> control flows, and works
 * similarly to a switch statement, but for JSX, by rendering <Match> children
 * for the first Match case for which when condition is truthy.
 *
 * Switch can also be keyed, in a way similar to the Show component. In the
 * case of the Switch/Match couple, the keyed prop must be set at Switch level
 * while the unique callback must be the only child of the Match component.
 * In this case, the matched callback will be re-executed whenever the
 * underlying when signal is changed, even if the visible match branch will
 * not actually change as a result of the update. Also note that multiple Match
 * branches may accepts different kinds of children, some Match branch can have
 * a callback while other have JSX. In this case, the keyed behavior apply only
 * to the Match cases that have a unique callback.
 *
 * @param fallback the fallback to display when no Match case match
 * @param keyed whether callback in Match are keyed to when signal or not
 */
export function Switch(props: {
    keyed?: boolean;
    fallback?: SuppleChild;
    children?: SuppleChildren;
}): SuppleNodeEffect {
    const resolved = children(() => props.children);

    const firstChildMatching = createMemo(
        () => {
            const matchChildren = resolved().filter((c) => "type" in c && c.type === Match) as (DOMComponent &
                MatchProps<unknown>)[];
            childrenLogger.log("Filtered =>", matchChildren);

            const displayMatches = matchChildren.map((m) => toValue(m.when));
            const matchingIndex = displayMatches.findIndex((v) => Boolean(v));
            if (matchingIndex >= 0) {
                return [matchChildren[matchingIndex], displayMatches[matchingIndex]] as const;
            } else {
                return null;
            }
        },
        undefined,
        {
            equals(prev, next) {
                if (!props.keyed) {
                    // If the Switch is not keyed, the memo will only re-render when the
                    // matched branch actually changes, independently of the value of the
                    // underlying model (the "when" attribute's value)
                    return (
                        (prev == null && next == null) ||
                        (prev != null && next != null && prev[0] === next[0])
                    );
                } else {
                    // Whereas, if the Switch is keyed, we want the memo to re-render
                    // both when the matched branch changes, but also when the underlying
                    // model changes value, therefore we compare both
                    return (
                        (prev == null && next == null) ||
                        (prev != null && next != null && prev[0] === next[0] && prev[1] === next[1])
                    );
                }
            },
        },
    );

    return () => {
        const matching = firstChildMatching();
        if (matching) {
            if (matching[0].children?.length === 1 && typeof matching[0].children?.[0] === "function") {
                return matching[0].children[0](matching[1]);
            } else {
                return matching[0].children as SuppleNode[];
            }
        } else {
            return toValue(props.fallback) ?? null;
        }
    };
}

/**
 * When combined with a Switch component (as direct parent) in the JSX tree,
 * conditionally displays its children if the when condition is the first
 * truthy Match condition of the Switch.
 *
 * @see Switch
 *
 * @param when the condition to evaluate
 * @param children the children to display when the condition is truthy
 */
export function Match<T>(props: MatchProps<T>): SuppleNodeEffect {
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

/**
 * This component lets you insert an arbitrary Component or HTML tag and passes
 * the props through to it.
 *
 * The component prop must be a valid component type. For example, it could be
 * an HTML tag name as a string (such as 'p' or 'h1'), or a SuppleJS component
 * (as a function).
 *
 * Caveat: as the component prop can accept a component type either wrapped
 * in a signal or as a direct value, it is necessary to provide functional
 * Components as a getter function.
 * ```
 *     <Dynamic component={() => Component} {...props}>
 *         <Children />
 *     </Dynamic>
 * ```
 *
 * @param component the component to display (as a signal) or a tag
 */
export function Dynamic<Props>({
    component,
    ...props
}: Props & {
    children?: any[];
    component: ValueOrAccessor<SuppleComponent<Props> | string | null | undefined>;
}): SuppleNodeEffect {
    const componentMemo = createMemo(() => toValue(component));
    return createMemo(() => {
        const comp = componentMemo();
        if (comp != null) {
            return h(comp, props as Props & { children? });
        } else {
            return null;
        }
    });
}

/**
 * This component lets you render its children into a different part of the UI.
 *
 * A Portal can be used when the children must not be rendered in the normal
 * tree flow but instead inserted in another DOM node. It is useful for example
 * with Modals which must be rendered outside of the page layout.
 *
 * A portal only changes the physical placement of the DOM node. In every other
 * way, the JSX you render into a portal acts as a child node of the component
 * that renders it. For example, the child can access the context provided by
 * the parent tree, and events bubble up from children to parents according to
 * the JSX tree.
 *
 * The portal is mounted in a <div> unless the target is the document head.
 *
 * @param mount an existing DOM node where to put the children
 * @param ref a ref that will target the header <div>
 * @param useShadow places children in a Shadow Root for style isolation
 * @param children anything that can be rendered in SuppleJS
 */
export function Portal(props: {
    mount?: ValueOrAccessor<HTMLElement>;
    ref?: Ref<HTMLDivElement | undefined>;
    useShadow?: boolean;
    children?: SuppleChildren;
}): SuppleNodeEffect {
    const parent = toValue(props.mount) ?? document.body;
    const dispose = render(() => {
        if (parent instanceof HTMLHeadElement) {
            return props.children ?? [];
        } else {
            return h("div", {
                useShadow: props.useShadow ?? false,
                children: props.children,
                ref: props.ref,
            });
        }
    }, parent);
    onCleanup(dispose);
    return () => null;
}

export function ErrorBoundary() {
    // TODO
}

export function Suspense() {
    // TODO
}
