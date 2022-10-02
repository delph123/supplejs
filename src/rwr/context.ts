export interface Disposable {
    cleanup: () => void;
}

export interface TrackingContext {
    execute: () => void;
    active: boolean;
    children: TrackingContext[];
    dependencies: Disposable[];
}

/** The tracking context stack. (Implemented as an Array) */
const contextStack = [] as (TrackingContext | null)[];

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
    effect: ((dispose: () => void) => T) | (() => T),
    forwardDispose = false
): T {
    let result: T;

    contextStack.push(context);

    if (forwardDispose && context) {
        result = effect(() => cleanup(context, true));
    } else {
        result = (effect as () => T)();
    }

    contextStack.pop();

    return result;
}

export function createChildContext(effect: () => void) {
    const execute = () => {
        cleanup(context);
        contextStack.push(context);
        effect();
        contextStack.pop();
    };

    const context: TrackingContext = {
        execute,
        active: true,
        children: [],
        dependencies: [],
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
 * @param context the tracking context to cleanup
 * @param dispose dipose of the current context (deactivate it)
 */
function cleanup(context: TrackingContext, dispose = false) {
    // Recursively dispose of the context and it's children,
    // while calling all cleanup functions.
    function disposeRec(ctx: TrackingContext, dispose: boolean) {
        // Dispose children & clean-up dependant disposables
        ctx.children.forEach((child) => {
            // called with dispose = true for deactivating the children
            disposeRec(child, true);
        });
        ctx.dependencies.forEach((dep) => {
            dep.cleanup();
        });

        // Clear list of children & dependencies
        ctx.children.length = 0;
        ctx.dependencies.length = 0;

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
    return runEffectInContext(null, effect);
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
        active: false,
        children: [],
        dependencies: [],
    };

    // Run the effect under the created context
    return runEffectInContext(context, effect, true);
}

/**
 * Executes the given function under the provided context (as returned by
 * getOwner), instead of (and without affecting) the current outer scope.
 *
 * @param owner the wrapping context to use
 * @param effect the effect to run
 * @returns the result of the effect
 */
export function runWithOwner<T>(
    owner: TrackingContext,
    effect: (dispose: () => void) => T
) {
    return runEffectInContext(owner, effect, true);
}

/**
 * Registers a cleanup method that executes on disposal or recalculation of
 * the current reactive scope. Can be used in any Component or Effect.
 *
 * @param cleanup the cleanup function to run
 */
export function onCleanup(cleanup: () => void) {
    const context = getOwner();
    if (context) {
        context.dependencies.push({
            cleanup,
        });
    } else {
        console.error("No current tracking context!");
    }
}
