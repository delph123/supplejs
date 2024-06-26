import { Accessor, MutableRef, Setter } from "./types";
import { idleCallbacks, sameValueZero } from "./helper";
import {
    cleanup,
    createChildContext,
    ForwardParameter,
    getOwner,
    onCleanup,
    runEffectInContext,
    TrackingContext,
} from "./context";

export interface EqualsOption<T> {
    equals?: false | ((prev: T, next: T) => boolean);
}

/**
 * Create a fine-grained reactive signal.
 *
 * Signals are the most basic reactive primitive. They track a single value
 * (which can be any JavaScript object) that changes over time. The Signal's
 * value starts out equal to the passed first argument initialValue (or
 * undefined if there are no arguments).
 * The createSignal function returns a pair of functions as a two-element
 * array: a getter (or accessor) and a setter. The getter automatically
 * subscribes to the signal, while the setter automatically notify any change
 * to all observers.
 *
 * By default, when calling a signal's setter, the signal only updates (and
 * causes dependents to rerun) if the new value is actually different than the
 * old one, according to JavaScript's SameValueZero algorithm. Alternatively,
 * you can set equals to false to always rerun dependents after the setter is
 * called, or you can pass your own function for testing equality.
 *
 * @param initialValue the initial value returned by the getter
 * @param options.equals the equality function to test if signal has changed
 * @returns [get, set] const array (typically destructured)
 */
export function createSignal<T>(
    initialValue?: T,
    options?: EqualsOption<T>,
): readonly [Accessor<T>, Setter<T>] {
    const equals = options?.equals === false ? () => false : options?.equals ?? sameValueZero;

    let state = initialValue as T;
    let observers = new Set<TrackingContext>();

    const set = (newState: T | ((s: T) => T)) => {
        let newValue: T | undefined;
        if (typeof newState === "function") {
            newValue = (newState as (s: T) => T)(state);
        } else {
            newValue = newState;
        }

        if (!equals(state, newValue)) {
            state = newValue;
        } else {
            return state; // do nothing
        }

        const currentObservers = observers;
        observers = new Set<TrackingContext>();
        currentObservers.forEach((o) => o.active && o.execute());
        return state;
    };

    const get = () => {
        // Automatically registers in the current tracking context (owner)
        const currentObserver = getOwner();
        if (currentObserver) {
            currentObserver.cleanups.push(function cleanup() {
                observers.delete(currentObserver);
            });
            observers.add(currentObserver);
        }
        return state;
    };

    return [get, set] as const;
}

/**
 * Creates a new computation that immediately runs the given function in a
 * tracking scope, thus automatically tracking its dependencies, and
 * automatically reruns the function whenever the dependencies changes.
 *
 * The function gets called with an argument equal to the value returned from
 * the function's last execution, or on the first call, equal to the optional
 * second argument to createComputed.
 *
 * @param effect the computation to run immediately and after any change
 * @param value the initial value to provide to the function
 */
export function createComputed<T>(effect: (v: T) => T, value?: T): void {
    const childContext = createChildContext(effect, value);
    runEffectInContext(childContext, effect);
}

/**
 * Creates a new effect (a computation with potentially side effects) that
 * runs the given function in a tracking scope, thus automatically tracking
 * its dependencies, and automatically re-runs the function whenever the
 * dependencies update.
 *
 * The effect function gets called with an argument equal to the value returned
 * from the effect function's last execution, or on the first call, equal to
 * the optional second argument to createEffect.
 *
 * The first execution of the effect function is not immediate; it's scheduled
 * to run after the current rendering phase (e.g., after calling the function
 * passed to render, createRoot, or runWithOwner).
 *
 * This delay in first execution is useful because it means an effect defined
 * in a component scope runs after the JSX returned by the component gets added
 * to the DOM. In particular, refs will already be set. Thus you can use an
 * effect to manipulate the DOM manually, call vanilla JS libraries, or other
 * side effects.
 *
 * @param effect the computation with side effects
 * @param value the initial value to provide to the function
 */
export function createEffect<T>(effect: (v: T) => T, value?: T): void {
    const childContext = createChildContext(effect, value);
    queueMicrotask(() => runEffectInContext(childContext, effect));
}

/**
 * Creates a read-only reactive value equal to the return value of the given
 * function and makes sure that function only gets executed when its
 * dependencies change.
 * Memos let you efficiently use a derived value in many reactive computations.
 *
 * @param memo the function to compute new value which is memoized
 * @param value the initial value to provide to the function
 * @param options.equals the equality function to test if memo has changed
 * @returns the memoized value (a read-only signal)
 */
export function createMemo<T>(memo: (v: T) => T, value?: T, options?: EqualsOption<T>): Accessor<T> {
    const [memoizedValue, setMemoizedValue] = createSignal<T>(value, options);
    createComputed((previousValue) => {
        const nextValue = memo(previousValue);
        setMemoizedValue(() => nextValue);
        return nextValue;
    }, value);
    return memoizedValue;
}

/**
 * Registers a side effect that is run the first time the expression wrapped by
 * the returned tracking function is notified of a change.
 *
 * Useful to separate tracking from re-execution.
 *
 * @param onReaction the function to run in reaction to the next change
 * @returns a function that can be called to track the next change
 */
export function createReaction(onReaction: () => void): (fn: () => void) => void {
    let context: TrackingContext<void> | undefined;
    return function track(fn: () => void) {
        if (context) cleanup(context);
        context = createChildContext(onReaction);
        runEffectInContext(context, fn, ForwardParameter.NOTHING);
    };
}

/**
 * Creates a conditional signal that only notifies subscribers when entering or
 * exiting their key matching the value. Useful for delegated selection state.
 * As it makes the operation O(1) instead of O(n).
 *
 * @param source the source signal whose values are compared
 * @param equals the comparison function
 * @returns the result of the comparison
 */
export function createSelector<T, U>(source: () => T, equals?: (a: U, b: T) => boolean): (k: U) => boolean {
    const comparator = equals ?? sameValueZero;
    return function selector(k: U) {
        return createMemo(() => comparator(k, source()))();
    };
}

/**
 * Creates a mutable ref object, whose .current property is initialized to the
 * passed argument (initialValue).
 *
 * @param initialValue the initial value for the ref's current property
 * @returns a ref object with mutable current property
 */
export function createRef<T>(initialValue?: T): MutableRef<T> {
    return {
        current: initialValue as T,
    };
}

/**
 * Creates a readonly that only notifies downstream changes when the browser is
 * idle. timeoutMs is the maximum time to wait before forcing the update.
 *
 * @param source the source signal
 * @param options.timeoutMs the maximum time to wait before forcing the update
 * @param options.equals the comparison function
 */
export function createDeferred<T>(
    source: () => T,
    options?: EqualsOption<T> & {
        timeoutMs?: number;
    },
): () => T {
    const signalOptions = options?.equals != null ? { equals: options.equals } : undefined;
    const timeoutOptions = options?.timeoutMs != null ? { timeout: options.timeoutMs } : undefined;
    const [requestIdleCallback, cancelIdleCallback] = idleCallbacks();

    // The readonly that will notify changes downstream
    const [deferredValue, setDeferredValue] = createSignal<T>(undefined, signalOptions);

    // Create a context that is calling the setMemo when browser is idle
    const childContext = createChildContext(() => {
        const nextValue = source();
        const request = requestIdleCallback(() => {
            setDeferredValue(() => nextValue);
        }, timeoutOptions);
        // cancels the callback in case it was not called before next change is notified
        onCleanup(() => {
            cancelIdleCallback(request);
        });
    });

    // Set-up the context to register source signal & assign initial value to memo
    runEffectInContext(childContext, () => {
        setDeferredValue(source);
    });

    return deferredValue;
}
