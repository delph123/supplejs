import {
    cleanup,
    createChildContext,
    ForwardParameter,
    getOwner,
    runEffectInContext,
    TrackingContext,
} from "./context";

interface EqualsOption<T> {
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
 * causes dependents to rerun) if the new value is actually different than
 * the old one, according to JavaScript's === operator. Alternatively, you
 * can set equals to false to always rerun dependents after the setter is
 * called, or you can pass your own function for testing equality.
 *
 * @param initialValue the inital value returned by the getter
 * @param options.equals the equality function to test if signal has changed
 * @returns [get, set] const array (typically destructured)
 */
export function createSignal<T>(initialValue?: T, options?: EqualsOption<T>) {
    const equals =
        options?.equals === false
            ? () => false
            : options?.equals || ((p, n) => p === n);

    let state = initialValue;
    let observers = new Set<TrackingContext>();

    const set = (newState?: T | ((s?: T) => T)) => {
        let newValue: T | undefined;
        if (typeof newState === "function") {
            newValue = (newState as (s?: T) => T)(state);
        } else {
            newValue = newState;
        }

        if (!equals(state!, newValue!)) {
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

    return [get, set] as [() => T, (newState?: T | ((s?: T) => T)) => T];
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
 * @param fn the computation to run immediately and after any change
 * @param value the initial value to provide to the function
 */
export function createComputed<T>(effect: (v: T) => T, value?: T) {
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
 * @param effect the computation with side effects
 * @param value the initial value to provide to the function
 */
export function createEffect<T>(effect: (v: T) => T, value?: T) {
    const childContext = createChildContext(effect, value);
    setTimeout(() => runEffectInContext(childContext, effect), 0);
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
export function createMemo<T>(
    memo: (v: T) => T,
    value?: T,
    options?: EqualsOption<T>
) {
    const [memoizedValue, setMemoizedValue] = createSignal<T>(value, options);
    createComputed((previousValue) => {
        const nextValue = memo(previousValue);
        setMemoizedValue(nextValue);
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
export function createReaction(onReaction: () => void) {
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
export function createSelector<T, U>(
    source: () => T,
    equals?: (a: U, b: T) => boolean
) {
    const comparator = equals || ((a: U, b: T) => (a as unknown) === b);
    return function selector(k: U) {
        return createMemo(() => comparator(k, source()))();
    };
}
