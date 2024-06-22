import { getQueriesForElement, prettyDOM } from "@testing-library/dom";
import type { Result, Options, Ref, RenderHookResult, RenderHookOptions } from "./types";
import {
    SuppleNodeEffect,
    TrackingContext,
    createRoot,
    getOwner,
    h,
    catchError,
    runWithOwner,
    render as core_render,
} from "../../core";

const mountedContainers = new Set<Ref>();

/**
 * Renders a component to test it
 * @param renderEffect {Ui} a function calling the component
 * @param options {Options} test options
 * @returns {Result} references and tools to test the component
 *
 * ```ts
 * const { getByText } = render(() => <App />, { wrapper: I18nProvider });
 * const button = getByText('Accept');
 * ```
 * ### Options
 * - `options.container` - the HTML element which the UI will be rendered into; otherwise a `<div>` will be created
 * - `options.baseElement` - the parent of the container, the default will be `<body>`
 * - `options.queries` - custom queries (see https://testing-library.com/docs/queries/about)
 * - `options.wrapper` - a component that applies a context provider and returns `props.children`
 *
 * ### Result
 * - `result.asFragment()` - returns the HTML fragment as string
 * - `result.container` - the container in which the component is rendered
 * - `result.baseElement` - the parent of the component
 * - `result.debug()` - returns helpful debug output on the console
 * - `result.unmount()` - unmounts the component, usually automatically called in cleanup
 * - `result.`[queries] - testing library queries, see https://testing-library.com/docs/queries/about)
 */
function render(renderEffect: SuppleNodeEffect, options: Options = {}): Result {
    let { container, baseElement = container } = options;
    let transientContainer: HTMLElement | undefined = undefined;

    if (!baseElement) {
        // Default to document.body instead of documentElement to avoid output of potentially-large
        // head elements (such as JSS style blocks) in debug output.
        baseElement = document.body;
    }

    if (!container) {
        transientContainer = document.createElement("div");
        container = baseElement.appendChild(transientContainer);
    }

    const wrappedUi: SuppleNodeEffect =
        typeof options.wrapper === "function"
            ? () =>
                  h(options.wrapper!, {
                      children: [renderEffect],
                  })
            : renderEffect;

    const dispose = core_render(wrappedUi, container);

    // We'll add it to the mounted components regardless of whether it's actually
    // added to document.body so the cleanup method works regardless of whether
    // they're passing us a custom container or not.
    mountedContainers.add({ container: transientContainer, dispose });

    const queryHelpers = getQueriesForElement(container, options.queries);

    return {
        asFragment: () => container?.innerHTML,
        container,
        baseElement,
        debug: (el = baseElement, maxLength?, options?) =>
            Array.isArray(el)
                ? el.forEach((e) => console.log(prettyDOM(e, maxLength, options)))
                : console.log(prettyDOM(el, maxLength, options)),
        unmount: dispose,
        ...queryHelpers,
    } as Result;
}

/**
 * "Renders" a hook to test it
 * @param hook {() => unknown)} a hook or primitive
 * @param options {RenderHookOptions} test options
 * @returns {RenderHookResult} references and tools to test the hook/primitive
 *
 * ```ts
 * const { result } = render(useI18n, { wrapper: I18nProvider });
 * expect(result.t('test')).toBe('works');
 * ```
 * ### Options
 * - `options.initialProps` - an array with the props that the hook will be provided with.
 * - `options.wrapper` - a component that applies a context provider and **always** returns `props.children`
 *
 * ### Result
 * - `result.result` - the return value of the hook/primitive
 * - `result.owner` - the reactive owner in which the hook is run (in order to run other reactive code in the same context with [`runWithOwner`](https://www.solidjs.com/docs/latest/api#runwithowner))
 * - `result.cleanup()` - calls the cleanup function of the hook/primitive
 */
export function renderHook<A extends any[], R>(
    hook: (...args: A) => R,
    options?: RenderHookOptions<A>,
): RenderHookResult<R> {
    const initialProps: A | [] = Array.isArray(options) ? options : options?.initialProps ?? [];
    const [dispose, owner, result] = createRoot((dispose) => {
        if (typeof options === "object" && "wrapper" in options && typeof options.wrapper === "function") {
            let result: ReturnType<typeof hook>;
            options.wrapper({
                children: [
                    () => {
                        result = hook(...(initialProps as A));
                        return null;
                    },
                ],
            });
            return [dispose, getOwner(), result!];
        }
        return [dispose, getOwner(), hook(...(initialProps as A))];
    });

    mountedContainers.add({ dispose });

    return { result, cleanup: dispose, owner };
}

export function testEffect<T = void>(
    fn: (done: (result: T) => void) => void,
    owner?: TrackingContext,
): Promise<T> {
    const context: {
        promise?: Promise<T>;
        done?: (result: T) => void;
        fail?: (error: any) => void;
    } = {};
    context.promise = new Promise<T>((resolve, reject) => {
        context.done = resolve;
        context.fail = reject;
    });
    createRoot((dispose) => {
        catchError(
            () => {
                (owner ? (done: (result: T) => void) => runWithOwner(owner, () => fn(done)) : fn)(
                    (result) => {
                        context.done?.(result);
                        dispose();
                    },
                );
            },
            (err) => context.fail?.(err),
        );
    });
    return context.promise;
}

function cleanupAtContainer(ref: Ref) {
    const { container, dispose } = ref;
    try {
        dispose();
    } catch (e) {
        // consume & ignore error
    }

    if (container?.parentNode != null) {
        container.parentNode.removeChild(container);
    }

    mountedContainers.delete(ref);
}

function cleanup() {
    mountedContainers.forEach(cleanupAtContainer);
}

export * from "@testing-library/dom";
export { render, cleanup };
