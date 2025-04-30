import { renderHook } from "supplejs-testing-library";
import {
    createResource,
    ResourceFetcher,
    FetcherParameter,
    ResourceOptions,
    ResourceReturn,
    ValueOrAccessor,
} from "../../core";
import { noop } from "../utils";

export function renderResource<R, P = any>(
    fetcher: ResourceFetcher<P, R>,
    options?: ResourceOptions<R>,
): ResourceReturn<R>;
export function renderResource<R, P = any>(
    source: ValueOrAccessor<FetcherParameter<P>>,
    fetcher: ResourceFetcher<P, R>,
    options?: ResourceOptions<R>,
): ResourceReturn<R>;
export function renderResource<R, P = any>(
    source: ValueOrAccessor<FetcherParameter<P>> | ResourceFetcher<P, R>,
    fetcher?: ResourceFetcher<P, R> | ResourceOptions<R>,
    options?: ResourceOptions<R>,
): ResourceReturn<R> {
    return renderHook(createResource<R, P>, [
        source as ValueOrAccessor<FetcherParameter<P>>,
        fetcher as ResourceFetcher<P, R>,
        options,
    ]).result;
}

export interface ManagedPromise<T> {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => Promise<T>;
    reject: (reason?: any) => Promise<T | void>;
}

function createManagedPromise<T>(): Readonly<ManagedPromise<T>> {
    let [fulfill, dismiss] = [] as unknown as Parameters<ConstructorParameters<typeof Promise<T>>[0]>;
    const promise = new Promise<T>((resolve, reject) => {
        fulfill = resolve;
        dismiss = reject;
    });
    const mp: ManagedPromise<T> = {
        promise,
        resolve(value) {
            fulfill(value);
            return promise;
        },
        reject(reason) {
            dismiss(reason);
            return promise.catch(noop);
        },
    };
    return Object.freeze(mp);
}

export function promisator<R>(initializedPromises?: number) {
    const managedPromises: ManagedPromise<R>[] = Array.from(
        { length: initializedPromises ?? 0 },
        createManagedPromise<R>,
    );
    let slotPointer = 0;
    const fetcher: ResourceFetcher<number | undefined, R> = (p, { refetching }) => {
        const slot = typeof refetching === "number" ? refetching : (p ?? slotPointer);
        slotPointer++;
        if (slot >= managedPromises.length || managedPromises[slot] == null) {
            managedPromises[slot] = createManagedPromise<R>();
        }
        return managedPromises[slot].promise;
    };
    return [fetcher, managedPromises] as const;
}
