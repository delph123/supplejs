import {
    createChildContext,
    getOwner,
    runEffectInContext,
    TrackingContext,
} from "./context";

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
 * @param initialValue the inital value returned by the getter
 * @returns [get, set] const array (typically destructured)
 */
export function createSignal<T>(initialValue?: T) {
    let state = initialValue;
    let observers = new Set<TrackingContext>();
    const set = (newState?: T | ((s?: T) => T)) => {
        if (typeof newState === "function") {
            state = (newState as (s?: T) => T)(state);
        } else {
            state = newState;
        }
        const currentObservers = observers;
        observers = new Set<TrackingContext>();
        currentObservers.forEach((o) => o.active && o.execute());
    };
    const get = () => {
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
    return [get, set] as [() => T, (v?: T | ((s?: T) => T)) => void];
}

/**
 * Creates a new effect (a computation with potentially side effects) that
 * runs the given function in a tracking scope, thus automatically tracking
 * its dependencies, and automatically re-runs the function whenever the
 * dependencies update.
 *
 * @param effect the computation with side effects
 */
export function createEffect(effect: () => void) {
    const childContext = createChildContext(effect);
    runEffectInContext(childContext, effect);
}

/**
 * Creates a read-only reactive value equal to the return value of the given
 * function and makes sure that function only gets executed when its
 * dependencies change.
 * Memos let you efficiently use a derived value in many reactive computations.
 *
 * @param memo the function to compute new value which is memoized
 * @returns the memoized value (a read-only signal)
 */
export function createMemo<T>(memo: () => T) {
    let [memoizedValue, setMemoizedValue] = createSignal<T>();
    let memory = Symbol() as T;
    createEffect(() => {
        const val = memo();
        if (val !== memory) {
            memory = val;
            setMemoizedValue(memory);
        }
    });
    return memoizedValue;
}
