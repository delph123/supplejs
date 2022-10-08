import {
    createChildContext,
    getOwner,
    runEffectInContext,
    TrackingContext,
    untrack,
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
            currentObserver.dependencies.push({
                cleanup() {
                    observers.delete(currentObserver);
                },
            });
            observers.add(currentObserver);
        }
        return state;
    };

    return [get, set] as [() => T, (newState?: T | ((s?: T) => T)) => T];
}

function computed<T>(fn: (v: T) => T, value?: T) {
    let previousValue = value;
    return () => {
        previousValue = fn(previousValue!);
    };
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
export function createComputed<T>(fn: (v: T) => T, value?: T) {
    const effect = computed(fn, value);
    const childContext = createChildContext(effect);
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
export function createEffect<T>(fn: (v: T) => T, value?: T) {
    const effect = computed(fn, value);
    const childContext = createChildContext(effect);
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
    let memory = value as T;
    createComputed(() => {
        memory = memo(memory);
        setMemoizedValue(memory);
    });
    return memoizedValue;
}

/**
 * Registers a method that runs after initial render and elements have been
 * mounted. Ideal for using refs and managing other one time side effects.
 *
 * It is equivalent to a createEffect which does not have any dependencies.
 *
 * @param effect the computation which runs once at startup
 */
export function onMount(effect: () => void) {
    setTimeout(() => untrack(effect), 0);
}
