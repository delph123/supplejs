import { describe, expect, it, vi } from "vitest";
import { renderHook } from "supplejs-testing-library";
import { createResource, createSignal, ValueOrAccessor } from "../../core";
import { Fetcher, FetcherParameter, ResourceOptions, ResourceReturn } from "../../core/resource";

function renderResource<R, P = any>(fetcher: Fetcher<P, R>, options?: ResourceOptions<R>): ResourceReturn<R>;
function renderResource<R, P = any>(
    source: ValueOrAccessor<FetcherParameter<P>>,
    fetcher: Fetcher<P, R>,
    options?: ResourceOptions<R>,
): ResourceReturn<R>;
function renderResource<R, P = any>(
    source: ValueOrAccessor<FetcherParameter<P>> | Fetcher<P, R>,
    fetcher?: Fetcher<P, R> | ResourceOptions<R>,
    options?: ResourceOptions<R>,
): ResourceReturn<R> {
    return renderHook(createResource<R, P>, [
        source as ValueOrAccessor<FetcherParameter<P>>,
        fetcher as Fetcher<P, R>,
        options,
    ]).result;
}

describe("createResource", () => {
    it("accepts a fetcher returning a value directly", () => {
        const [data] = renderResource(() => "hello");
        expect(data.state).toEqual("ready");
        expect(data.loading).toBe(false);
        expect(data.error).toBeUndefined();
        expect(data.latest).toEqual("hello");
        expect(data()).toEqual("hello");
    });

    it("calls fetcher with source, initial value & refetching = false", () => {
        const spy = vi.fn(() => 0);
        renderResource(spy);
        expect(spy).toHaveBeenCalledWith(undefined, { value: undefined, refetching: false });
        renderResource("hi", spy);
        expect(spy).toHaveBeenCalledWith("hi", { value: undefined, refetching: false });
        renderResource(spy, { initialValue: 5 });
        expect(spy).toHaveBeenCalledWith(undefined, { value: 5, refetching: false });
        renderResource(() => "hi", spy, { initialValue: 5 });
        expect(spy).toHaveBeenCalledWith("hi", { value: 5, refetching: false });
    });

    it("waits for source to be not null and not false to call fetcher", () => {
        const [source, setSource] = createSignal<FetcherParameter<string>>(false);
        const spy = vi.fn(() => 0);

        let [data] = renderResource(false, spy);
        expect(spy).not.toHaveBeenCalled();
        expect(data.state).toEqual("unresolved");
        expect(data.loading).toBe(false);
        expect(data.error).toBeUndefined();
        expect(data.latest).toBeUndefined();
        expect(data()).toBeUndefined();

        data = renderResource(source, spy, { initialValue: 3 })[0];
        expect(spy).not.toHaveBeenCalled();
        expect(data.state).toEqual("ready");
        expect(data.loading).toBe(false);
        expect(data.latest).toBe(3);

        setSource("a");
        expect(spy).toHaveBeenCalledWith("a", { value: 3, refetching: false });
        expect(data.state).toEqual("ready");
        expect(data.loading).toBe(false);
        expect(data.error).toBeUndefined();
        expect(data.latest).toEqual(0);
        expect(data()).toEqual(0);

        spy.mockClear();
        setSource(null);
        expect(spy).not.toHaveBeenCalled();
        expect(data.state).toEqual("ready");
        expect(data.loading).toBe(false);
        expect(data.error).toBeUndefined();
        expect(data.latest).toEqual(0);
        expect(data()).toEqual(0);
    });

    it("is pending while fetcher's promise is not resolved", async () => {
        const [data] = renderResource(() => Promise.resolve("hello"));

        expect(data.state).toEqual("pending");
        expect(data.loading).toBe(true);
        expect(data.error).toBeUndefined();
        expect(data.latest).toBeUndefined();
    });

    it("is ready after fetcher's promise is resolved", async () => {
        const p = Promise.resolve("hello");
        const [data] = renderResource(() => p);

        expect(data.loading).toBe(true);

        await p.then((r) => r);
        expect(data.state).toEqual("ready");
        expect(data.loading).toBe(false);
        expect(data.error).toBeUndefined();
        expect(data.latest).toEqual("hello");
        expect(data()).toEqual("hello");
    });

    it("errors after fetcher's promise is rejected", async () => {
        const p = Promise.reject(new Error("not good"));
        const [data] = renderResource(() => p);

        expect(data.loading).toBe(true);

        await p.catch((r) => r);
        expect(data.state).toEqual("errored");
        expect(data.loading).toBe(false);
        expect(data.error).toEqual(new Error("not good"));
        // expect(data.latest).toThrow()
        // expect(data()).toThrow()
    });

    it("returns a function to refetch", () => {
        const spy = vi.fn((_, { refetching }) => refetching || 0);
        const [data, { refetch }] = renderResource(spy);

        expect(data.state).toEqual("ready");
        expect(data()).toBe(0);

        refetch(5);
        expect(spy).toHaveBeenLastCalledWith(undefined, { value: 0, refetching: 5 });
        expect(data.state).toEqual("ready");
        expect(data()).toBe(5);

        refetch();
        expect(spy).toHaveBeenLastCalledWith(undefined, { value: 5, refetching: true });
    });

    it("is in state refreshing while refetching", async () => {
        const spy = vi.fn((_, { value, refetching }) => Promise.resolve(value + refetching));
        const [data, { refetch }] = renderResource(spy, { initialValue: 0 });

        expect(data.state).toEqual("refreshing");
        expect(data.loading).toBe(true);
        expect(data.error).toBeUndefined();
        expect(data.latest).toBe(0);

        await spy.mock.results[spy.mock.results.length - 1].value;
        expect(data.state).toEqual("ready");
        expect(data()).toBe(0);

        refetch(2);

        expect(data.state).toEqual("refreshing");
        expect(data.loading).toBe(true);
        expect(data.error).toBeUndefined();
        expect(data.latest).toBe(0);

        await spy.mock.results[spy.mock.results.length - 1].value;
        expect(data.loading).toBe(false);
        expect(data()).toBe(2);
    });

    it("keeps track of latest value", async () => {
        const [source, setSource] = createSignal<number>(0);
        const spy = vi.fn((source, { refetching }) => Promise.resolve(source + refetching + 1));
        const [data, { refetch }] = renderResource(source, spy);

        expect(spy).toHaveBeenLastCalledWith(0, { refetching: false, value: undefined });
        expect(data.state).toEqual("pending");
        expect(data.latest).toBeUndefined();

        await spy.mock.results[spy.mock.results.length - 1].value;
        expect(data.state).toEqual("ready");
        expect(data.latest).toBe(1);
        expect(data()).toBe(1);

        setSource(1);
        expect(spy).toHaveBeenLastCalledWith(1, { refetching: false, value: 1 });
        expect(data.state).toEqual("refreshing");
        expect(data.latest).toBe(1);

        await spy.mock.results[spy.mock.results.length - 1].value;
        expect(data.latest).toBe(2);
        expect(data()).toBe(2);

        refetch(3);
        expect(spy).toHaveBeenLastCalledWith(1, { refetching: 3, value: 2 });
        expect(data.loading).toBe(true);
        expect(data.latest).toBe(2);

        await spy.mock.results[spy.mock.results.length - 1].value;
        expect(data.loading).toBe(false);
        expect(data.latest).toBe(5);
        expect(data()).toBe(5);

        setSource(2);
        expect(spy).toHaveBeenLastCalledWith(2, { refetching: false, value: 5 });
        expect(data.latest).toBe(5);

        await spy.mock.results[spy.mock.results.length - 1].value;
        expect(data()).toBe(3);

        refetch();
        expect(spy).toHaveBeenLastCalledWith(2, { refetching: true, value: 3 });
    });

    it("returns a function to mutate data", async () => {
        const [source, setSource] = createSignal<number>(0);
        const spy = vi.fn((source, { refetching }) => Promise.resolve(source + refetching + 1));
        const [data, { mutate, refetch }] = renderResource(source, spy);

        expect(data.state).toEqual("pending");

        mutate(17);
        expect(data.state).toEqual("ready");
        expect(data.loading).toBe(false);
        expect(data.error).toBeUndefined();
        expect(data.latest).toEqual(17);
        expect(data()).toEqual(17);

        await spy.mock.results[spy.mock.results.length - 1].value;
        expect(data.state).toEqual("ready");
        expect(data.loading).toBe(false);
        expect(data.error).toBeUndefined();
        expect(data.latest).toEqual(1);
        expect(data()).toEqual(1);

        mutate(9);
        expect(data.state).toEqual("ready");
        expect(data.loading).toBe(false);
        expect(data.error).toBeUndefined();
        expect(data.latest).toEqual(9);
        expect(data()).toEqual(9);

        setSource(2);
        expect(data.state).toEqual("refreshing");
        expect(data.loading).toBe(true);
        expect(data.latest).toEqual(9);

        mutate(11);
        expect(data.latest).toEqual(11);
        expect(data()).toEqual(11);

        await spy.mock.results[spy.mock.results.length - 1].value;
        expect(data.latest).toEqual(3);
        expect(data()).toEqual(3);

        refetch(5);
        expect(data.state).toEqual("refreshing");
        expect(data.loading).toBe(true);
        expect(data.latest).toEqual(3);

        mutate(13);
        expect(data.latest).toEqual(13);
        expect(data()).toEqual(13);

        await spy.mock.results[spy.mock.results.length - 1].value;
        expect(data.latest).toEqual(8);
        expect(data()).toEqual(8);
    });

    it("remembers errors while refreshing", async () => {
        const [source, setSource] = createSignal<number>(1);
        const spy = vi.fn((source, { refetching }) => {
            if ((source + refetching) % 2 === 0) {
                return Promise.resolve(source + refetching + 1);
            } else {
                return Promise.reject(new Error(`${source} + ${Number(refetching)} is odd!`));
            }
        });
        const [data, { refetch }] = renderResource(source, spy);

        expect(data.loading).toBe(true);

        await spy.mock.results[spy.mock.results.length - 1].value.catch(noop);
        expect(data.state).toEqual("errored");
        expect(data.loading).toBe(false);
        expect(data.error).toEqual(new Error("1 + 0 is odd!"));

        refetch(1);
        expect(data.state).toEqual("refreshing");
        expect(data.loading).toBe(true);
        expect(data.error).toEqual(new Error("1 + 0 is odd!"));

        await spy.mock.results[spy.mock.results.length - 1].value;
        expect(data.state).toEqual("ready");
        expect(data.loading).toBe(false);
        expect(data.error).toBeUndefined();
        expect(data()).toEqual(3);

        refetch(2);
        await spy.mock.results[spy.mock.results.length - 1].value.catch(noop);
        expect(data.state).toEqual("errored");
        expect(data.loading).toBe(false);
        expect(data.error).toEqual(new Error("1 + 2 is odd!"));

        setSource(3);
        expect(data.state).toEqual("refreshing");
        expect(data.error).toEqual(new Error("1 + 2 is odd!"));

        await spy.mock.results[spy.mock.results.length - 1].value.catch(noop);
        expect(data.state).toEqual("errored");
        expect(data.error).toEqual(new Error("3 + 0 is odd!"));

        setSource(4);
        expect(data.state).toEqual("refreshing");
        refetch(1);
        expect(data.state).toEqual("refreshing");

        await spy.mock.results[spy.mock.results.length - 1].value.catch(noop);
        expect(data.state).toEqual("errored");
        expect(data.error).toEqual(new Error("4 + 1 is odd!"));
    });

    it("remembers previous value even after error", async () => {
        const [source, setSource] = createSignal<number>(1);
        const spy = vi.fn((source, { refetching }) => {
            if ((source + refetching) % 2 === 0) {
                return Promise.resolve(source + refetching + 1);
            } else {
                return Promise.reject(new Error(`${source} + ${Number(refetching)} is odd!`));
            }
        });
        const [data, { refetch }] = renderResource(source, spy);

        expect(spy).toHaveBeenLastCalledWith(1, { value: undefined, refetching: false });

        await spy.mock.results[spy.mock.results.length - 1].value.catch(noop);
        refetch(1);
        expect(spy).toHaveBeenLastCalledWith(1, { value: undefined, refetching: 1 });

        await spy.mock.results[spy.mock.results.length - 1].value;
        refetch(2);
        expect(spy).toHaveBeenLastCalledWith(1, { value: 3, refetching: 2 });

        await spy.mock.results[spy.mock.results.length - 1].value.catch(noop);
        expect(data.latest).toEqual(3);

        setSource(3);
        expect(spy).toHaveBeenLastCalledWith(3, { value: 3, refetching: false });
        expect(data.latest).toEqual(3);

        await spy.mock.results[spy.mock.results.length - 1].value.catch(noop);
        expect(data.latest).toEqual(3);

        setSource(4);
        expect(spy).toHaveBeenLastCalledWith(4, { value: 3, refetching: false });

        await spy.mock.results[spy.mock.results.length - 1].value;
        refetch(1);
        expect(spy).toHaveBeenLastCalledWith(4, { value: 5, refetching: 1 });

        await spy.mock.results[spy.mock.results.length - 1].value.catch(noop);
        expect(data.latest).toEqual(5);

        setSource(7);
        expect(spy).toHaveBeenLastCalledWith(7, { value: 5, refetching: false });

        await spy.mock.results[spy.mock.results.length - 1].value.catch(noop);
        expect(data.latest).toEqual(5);

        refetch();
        expect(spy).toHaveBeenLastCalledWith(7, { value: 5, refetching: true });

        await spy.mock.results[spy.mock.results.length - 1].value;
        expect(data.latest).toEqual(9);
    });
});

function noop() {}
