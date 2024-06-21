import { Accessor, AccessorArray } from "./types";

export type CleanupFunction = () => void;
export type ErrorHandler = (err: any) => void;

export interface TrackingContext<T = any> {
    execute: () => void;
    previousValue: T;
    active: boolean;
    parent: TrackingContext<any> | null;
    children: TrackingContext<T>[];
    cleanups: CleanupFunction[];
    errorHandler: ErrorHandler | null;
    contextsMap: Map<symbol, any>;
}

export enum ForwardParameter {
    NOTHING,
    PREVIOUS_VALUE,
    DISPOSE,
}

/** The tracking context stack. (Implemented as an Array) */
const contextStack = [] as (TrackingContext<unknown> | null)[];

/**
 * Gets the reactive scope that owns the currently running code (i.e. the
 * current tracking context). This could be used for example for passing
 * into a later call to runWithOwner outside of the current scope.
 *
 * @returns owner (TrackingContext)
 */
export function getOwner(): TrackingContext<unknown> | null {
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
 * @param forwardDispose forward dispose function to the effect as 1st parameter
 * @returns the result of the effect
 */
export function runEffectInContext<T>(
    context: TrackingContext<T> | null,
    effect: ((dispose: () => void) => T) | ((prev: T) => T) | (() => T),
    forward: ForwardParameter = ForwardParameter.PREVIOUS_VALUE,
): T {
    // Only execute context if it is active!
    if (context?.active === false) {
        return undefined as T;
    }

    try {
        contextStack.push(context);

        if (forward === ForwardParameter.DISPOSE && context) {
            const fn = effect as (dispose: () => void) => T;
            return fn(() => cleanup(context, true));
        } else if (forward === ForwardParameter.PREVIOUS_VALUE && context) {
            const fn = effect as (prev: T) => T;
            context.previousValue = fn(context.previousValue);
            return context.previousValue;
        } else {
            const fn = effect as () => T;
            return fn();
        }
    } catch (error) {
        handleErrorInContext(context, error);
        return undefined as T; // to return a value with correct type
    } finally {
        contextStack.pop();
    }
}

function handleErrorInContext(context: TrackingContext<unknown> | null, error: any) {
    // Unwrap if previous stack frame is the parent stack (and current stack
    // does not have a different error handler)
    // Or rethrow if there is no error handler.
    if (
        context?.errorHandler == null ||
        (contextStack.length > 1 &&
            context?.parent != null &&
            context?.errorHandler === context?.parent?.errorHandler &&
            context?.parent === contextStack[contextStack.length - 2])
    ) {
        throw error;
    }

    try {
        context.errorHandler(error);
    } catch (followupError) {
        // Search parent error handler in the parent tree (by looking for the
        // first error handler different from current one)
        let owner = context;
        while (owner.parent?.errorHandler === context.errorHandler) {
            owner = owner.parent;
        }
        // Then throw the follow-up error to the parent error handler
        handleErrorInContext(owner.parent, followupError);
    }
}

export function createChildContext<T>(effect: (prev: T) => T, value?: T): TrackingContext<T> {
    const execute = () => {
        // TODO: call cleanup before value is changed in signal.
        // When cleanup is called, the new value of the signal was set, and
        // therefore, the cleanup function accesses the new value instead of
        // the old value -> this may not be what is expected by the developer
        cleanup(context);
        runEffectInContext(context, effect);
    };

    const context: TrackingContext<T> = {
        execute,
        previousValue: value as T,
        active: true,
        parent: getOwner(),
        children: [],
        cleanups: [],
        // Inherit error handler from parent
        errorHandler: getOwner()?.errorHandler ?? null,
        // Copy context map from parent tracking context
        contextsMap: new Map(getOwner()?.contextsMap?.entries()),
    };

    // Add current context as child of parent's context
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
 * @param dispose dispose of the current context (deactivate it)
 */
export function cleanup<T>(context: TrackingContext<T>, dispose = false): void {
    // Recursively dispose of the context and it's children,
    // while calling all cleanup functions.
    function disposeRec(ctx: TrackingContext<T>, dispose: boolean) {
        // Dispose children & clean-up dependant disposables
        ctx.children.forEach((child) => {
            // called with dispose = true for deactivating the children
            disposeRec(child, true);
        });
        // XXX unsafe execution of cleanup `fn`
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
export function untrack<T>(effect: () => T): T {
    return runEffectInContext(null, effect, ForwardParameter.NOTHING);
}

/**
 * Creates a new non-tracked owner scope that doesn't auto-dispose.
 *
 * This is useful for nested reactive scopes that you do not wish to release
 * when the parent re-evaluates.
 *
 * @param effect the computation, which will be called with dispose as parameter
 * @returns the result of the effect
 */
export function createRoot<T>(effect: (dispose: () => void) => T): T {
    // Create an inactive context (which won't be notified) to
    // track children and dependent contexts
    const context: TrackingContext = {
        execute: () => console.error("Executing Root Context!!"),
        previousValue: undefined,
        active: true,
        parent: null,
        children: [],
        cleanups: [],
        errorHandler: null,
        // Copy context map from parent tracking context
        // (this is especially useful when the new root is created
        // in the frame of an existing one, as it is the case with
        // the <For />, <Index /> and <Portal /> components)
        contextsMap: new Map(getOwner()?.contextsMap?.entries()),
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
export function runWithOwner<T>(owner: TrackingContext<T>, effect: () => T): T {
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
export function onMount(runOnce: () => void): void {
    queueMicrotask(() => untrack(runOnce));
}

/**
 * Registers a cleanup method that executes on disposal or recalculation of
 * the current reactive scope. Can be used in any Component or Effect.
 *
 * @param cleanup the cleanup function to run
 */
export function onCleanup(cleanup: CleanupFunction): void {
    const context = getOwner();
    if (context) {
        context.cleanups.push(cleanup);
    } else {
        console.error("No current tracking context!");
    }
}

/**
 * Return an effect function that is designed to run only when one of the
 * dependencies changes.
 *
 * on(deps, fn) is designed to be passed into a computation (createEffect,
 * createMemo, createComputed, etc.) to make its dependencies explicit. If
 * an array of dependencies is passed, input and prevInput are arrays.
 *
 * @param deps the dependency or list of dependencies
 * @param fn the computation to run each time on of the dependency changes
 * @param options.defer opt-in to only run the computation on change by
 *                      setting the defer option to true
 */
export function on<T, U>(
    deps: Accessor<T> | AccessorArray<T>,
    fn: (input: T, prevInput?: T, prevValue?: U) => U,
    options: { defer?: boolean } = {},
): (prevValue?: U) => U | undefined {
    let defer = options?.defer ?? false;
    let prevInput: T | undefined;
    let input: T;
    return (prevValue?: U) => {
        prevInput = input;
        input = Array.isArray(deps) ? (deps.map((dep) => dep()) as T) : deps();
        if (!defer) {
            return untrack(() => fn(input, prevInput, prevValue));
        } else {
            defer = false;
            return undefined;
        }
    };
}

/**
 * Wraps a tryFn with an error handler that fires if an error occurs below that point.
 *
 * Only the nearest scope error handlers execute. Rethrow to trigger up the line.
 *
 * @param tryFn boundary for the error
 * @param onError an error handler that receives the error
 * @returns the result of the tryFn if no error was thrown
 */
export function catchError<T>(tryFn: () => T, onError: ErrorHandler): T | undefined {
    // return createMemo(
    //     () => {
    //         getOwner()!.errorHandler = onError;
    //         return tryFn();
    //     },
    //     undefined,
    //     {
    //         equals: false,
    //     },
    // )();
    const owner = getOwner();
    const currentHandler = owner?.errorHandler;
    if (owner) {
        owner.errorHandler = onError;
    }
    try {
        return tryFn();
    } catch (err) {
        onError(err);
        return undefined;
    } finally {
        if (owner) {
            owner.errorHandler = currentHandler ?? null;
        }
    }
}
