type CleanupFunction = () => void;

export interface TrackingContext<T = any> {
    execute: () => void;
    previousValue: T;
    active: boolean;
    children: TrackingContext<T>[];
    cleanups: CleanupFunction[];
}

export enum ForwardParameter {
    NOTHING,
    PREVIOUS_VALUE,
    DISPOSE,
}

/** The tracking context stack. (Implemented as an Array) */
const contextStack = [] as (TrackingContext<any> | null)[];

/**
 * Gets the reactive scope that owns the currently running code (i.e. the
 * current tracking context). This could be used for example for passing
 * into a later call to runWithOwner outside of the current scope.
 *
 * @returns owner (TrackingContext)
 */
export function getOwner() {
    if (contextStack.length > 0) {
        return contextStack[contextStack.length - 1];
    } else {
        return null;
    }
}

/**
 * Executes the given function under the provided context, instead of (and
 * without affecting) the current tracking context (of the outer scope).
 *
 * @internal not part of the public API
 *
 * @param context the wrapping context to use
 * @param effect the effect to run
 * @param forwardDispose forward dispose function to the effect as 1st paramter
 * @returns the result of the effect
 */
export function runEffectInContext<T>(
    context: TrackingContext | null,
    effect: ((dispose: () => void) => T) | ((prev: T) => T) | (() => T),
    forward: ForwardParameter = ForwardParameter.PREVIOUS_VALUE
): T {
    let result: T;

    contextStack.push(context);

    if (forward === ForwardParameter.DISPOSE && context) {
        const fn = effect as (dispose: () => void) => T;
        result = fn(() => cleanup(context, true));
    } else if (forward === ForwardParameter.PREVIOUS_VALUE && context) {
        const fn = effect as (prev: T) => T;
        result = fn(context.previousValue);
        context.previousValue = result;
    } else {
        const fn = effect as () => T;
        result = fn();
    }

    contextStack.pop();

    return result;
}

export function createChildContext<T>(effect: (prev: T) => T, value?: T) {
    const execute = () => {
        cleanup(context);
        runEffectInContext(context, effect);
    };

    const context: TrackingContext<T> = {
        execute,
        previousValue: value as T,
        active: true,
        children: [],
        cleanups: [],
    };

    const parentTrackingContext = getOwner();
    if (parentTrackingContext) {
        parentTrackingContext.children.push(context);
    } else {
        console.error("No parent context!");
    }

    return context;
}

/**
 * Clean-up the provided tracking context.
 *
 * This won't deactivate the context (it will be possible to reuse it for
 * running or re-running effects) unless the dispose flag is provided.
 *
 * Dispose of any child and deactivate them so they cannot be used later,
 * then clean-up all dependant disposable resources.
 *
 * @private
 *
 * @param context the tracking context to cleanup
 * @param dispose dipose of the current context (deactivate it)
 */
export function cleanup<T>(context: TrackingContext<T>, dispose = false) {
    // Recursively dispose of the context and it's children,
    // while calling all cleanup functions.
    function disposeRec(ctx: TrackingContext<T>, dispose: boolean) {
        // Dispose children & clean-up dependant disposables
        ctx.children.forEach((child) => {
            // called with dispose = true for deactivating the children
            disposeRec(child, true);
        });
        ctx.cleanups.forEach((fn) => fn());

        // Clear list of children & dependencies
        ctx.children = [];
        ctx.cleanups = [];

        // Deactivate the context if dispose was requested
        ctx.active = ctx.active && !dispose;
    }

    // Call the recursive dispose in a non-tracking context,
    // so as to avoid subscribing to a signal while cleaning
    // up its dependencies in case the cleanup function uses
    // a signal.
    untrack(() => disposeRec(context, dispose));
}

/**
 * Ignores tracking any of the dependencies in the executing code block and
 * returns the value.
 *
 * @param effect the computation to run w/o tracking
 * @returns the result of the effect
 */
export function untrack<T>(effect: () => T) {
    return runEffectInContext(null, effect, ForwardParameter.NOTHING);
}

/**
 * Creates a new non-tracked owner scope that doesn't auto-dispose.
 *
 * This is useful for nested reactive scopes that you do not wish to release
 * when the parent re-evaluates.
 *
 * @param effect the computation, which will be called with dispose as paramter
 * @returns the result of the effect
 */
export function createRoot<T>(effect: (dispose: () => void) => T) {
    // Create an inactive context (which won't be notified) to
    // track children and dependent contexts
    const context: TrackingContext = {
        execute: () => console.error("Executing Root Context!!"),
        previousValue: undefined,
        active: false,
        children: [],
        cleanups: [],
    };

    // Run the effect under the created context
    return runEffectInContext<T>(context, effect, ForwardParameter.DISPOSE);
}

/**
 * Executes the given function under the provided context (as returned by
 * getOwner), instead of (and without affecting) the current outer scope.
 *
 * @param owner the wrapping context to use
 * @param effect the effect to run
 * @returns the result of the effect
 */
export function runWithOwner<T>(owner: TrackingContext<T>, effect: () => T) {
    return runEffectInContext(owner, effect, ForwardParameter.NOTHING);
}

/**
 * Registers a method that runs after initial render and elements have been
 * mounted. Ideal for using refs and managing other one time side effects.
 *
 * It is equivalent to a createEffect which does not have any dependencies.
 *
 * @param runOnce the computation which runs once at startup
 */
export function onMount(runOnce: () => void) {
    setTimeout(() => untrack(runOnce), 0);
}

/**
 * Registers a cleanup method that executes on disposal or recalculation of
 * the current reactive scope. Can be used in any Component or Effect.
 *
 * @param cleanup the cleanup function to run
 */
export function onCleanup(cleanup: CleanupFunction) {
    const context = getOwner();
    if (context) {
        context.cleanups.push(cleanup);
    } else {
        console.error("No current tracking context!");
    }
}
