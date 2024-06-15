import { expect, vi } from "vitest";
import {
    Context,
    Match,
    Show,
    SuppleNodeEffect,
    Switch,
    ValueOrAccessor,
    createContext,
    h,
    onCleanup,
    toValue,
    useContext,
} from "../../core";

/* ----------------------------------------------- DEFAULT COMPONENT ----------------------------------------------- */

export default function MockComponent({ children, ...props }) {
    return () => <div {...props}>{children}</div>;
}

/* ------------------------------------------------------ SPY ------------------------------------------------------ */

export function createMockComponent<T>(data: ValueOrAccessor<T>) {
    const mountSpy = vi.fn();
    const cleanupSpy = vi.fn();
    const Cmp = () => {
        mountSpy();
        onCleanup(cleanupSpy);
        return () => <h1>{data}</h1>;
    };
    return [Cmp, mountSpy, cleanupSpy] as const;
}

/* ---------------------------------------------------- CONTEXT ---------------------------------------------------- */

export const ContextValues = {
    A: { value: "A" },
    B: { value: "B" },
    C: { value: "C" },
    D: { value: "D" },
    E: { value: "E" },
    Z: { value: "Z" },
};

export type UseContextProps = {
    id: string;
    className?: ValueOrAccessor<string>;
};

function readContextValueContent(context: Context<(typeof ContextValues)[keyof typeof ContextValues]>) {
    const contextValue = useContext(context);
    // make sure the context value actually comes from the ContextValue object
    expect(contextValue).toBe(ContextValues[contextValue.value]);
    return contextValue.value;
}

export function contextMocks() {
    const Context = createContext(ContextValues.Z);

    const ContextProvider = function ContextProvider(props: {
        value: string;
        children?: any;
    }): SuppleNodeEffect {
        return () => <Context.Provider value={ContextValues[props.value]}>{props.children}</Context.Provider>;
    };

    const UseDirectContext = function UseDirectContext({ id, className }: UseContextProps): SuppleNodeEffect {
        const contextValue = useContext(Context);
        // make sure the context value comes from the ContextValue object
        expect(contextValue).toBe(ContextValues[contextValue.value]);
        return () => (
            <div data-testid={id} class={toValue(className)}>
                {contextValue.value}
            </div>
        );
    };

    const UseRenderContext = function UseRenderContext({ id, className }: UseContextProps): SuppleNodeEffect {
        return () => (
            <p data-testid={id} class={toValue(className)} title="paragraph">
                {readContextValueContent(Context)}
            </p>
        );
    };

    const UseInnerContext = function UseInnerContext({ id, className }: UseContextProps): SuppleNodeEffect {
        return () => <UseRenderContext id={id} className={className} />;
    };

    const UseDeepContext = function UseDeepContext({ id, className }: UseContextProps): SuppleNodeEffect {
        return () => (
            <section>
                <UseInnerContext id={id} className={className} />
            </section>
        );
    };

    const useInlineContext = function useInlineContext({ id, className }: UseContextProps): SuppleNodeEffect {
        return () => (
            <span data-testid={id} class={toValue(className)}>
                {readContextValueContent(Context)}
            </span>
        );
    };

    const ShowContext = function ShowContext({
        id,
        when,
        className,
    }: UseContextProps & { when: ValueOrAccessor<boolean> }): SuppleNodeEffect {
        return () => (
            <Show when={when}>
                <UseDeepContext id={id} className={className} />
            </Show>
        );
    };

    const SwitchContext = function ShowContext({
        id,
        cond1,
        cond2,
        className,
    }: UseContextProps & {
        cond1: ValueOrAccessor<boolean>;
        cond2: ValueOrAccessor<boolean>;
    }): SuppleNodeEffect {
        return () => (
            <Switch>
                <Match when={cond1}>
                    <UseDeepContext id={id} className={className} />
                </Match>
                <Match when={cond2}>{useInlineContext({ id, className })}</Match>
            </Switch>
        );
    };

    return {
        Context,
        ContextProvider,
        UseDirectContext,
        UseRenderContext,
        UseDeepContext,
        useInlineContext,
        ShowContext,
        SwitchContext,
    };
}
