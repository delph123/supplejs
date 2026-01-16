import { describe, expect, it } from "vitest";
import { promisator, renderResource } from "./helpers";
import { createSignal } from "../../core";

describe("Manage concurrency in createResource", () => {
    it("allows to have 2 concurrent calls in order", async () => {
        const [fetcher, promises] = promisator<string>(2);

        const [data, { refetch }] = renderResource(fetcher);

        refetch();
        await promises[0].resolve("hi");
        expect(data.state).toEqual("pending");
        expect(data.loading).toBe(true);
        expect(data.error).toBeUndefined();

        await promises[1].resolve("hello");
        expect(data.state).toEqual("ready");
        expect(data()).toEqual("hello");
    });

    it("only cares about state of the latest request and disregard others", async () => {
        const [fetcher, promises] = promisator<string>(5);

        const [data, { refetch }] = renderResource(fetcher);

        refetch();
        await promises[0].resolve("hi");
        expect(data.state).toEqual("pending");
        expect(data.loading).toBe(true);
        expect(data.error).toBeUndefined();

        refetch();
        await promises[1].resolve("hi2");
        expect(data.state).toEqual("pending");
        expect(data.loading).toBe(true);
        expect(data.error).toBeUndefined();

        refetch();
        refetch();
        expect(data.state).toEqual("pending");

        await promises[4].resolve("hello");

        expect(data.state).toEqual("ready");
        expect(data()).toEqual("hello");
    });

    it("doesn't care about previous requests failing or resolving out of order", async () => {
        const [fetcher, promises] = promisator<string>();
        const [source, setSource] = createSignal<number>(0);

        const [data, { refetch }] = renderResource(source, fetcher);

        setSource(1);
        refetch(2);
        await promises[0].resolve("hi");
        expect(data.state).toEqual("pending");
        expect(data.loading).toBe(true);
        expect(data.error).toBeUndefined();

        await promises[2].resolve("hello");
        expect(data.loading).toBe(false);
        expect(data()).toEqual("hello");

        setSource(3);
        refetch(4);
        setSource(5);
        await promises[4].reject("hi4");
        await promises[3].resolve("hi3");
        await promises[1].reject("hi1");
        expect(data.state).toEqual("refreshing");
        expect(data.error).toBeUndefined();

        await promises[5].resolve("hi5");
        expect(data.loading).toBe(false);
        expect(data.state).toEqual("ready");
        expect(data()).toEqual("hi5");
    });

    it("raises an error when last request errors", async () => {
        const [fetcher, promises] = promisator<string>();
        const [source, setSource] = createSignal<number>(0);

        const [data, { refetch }] = renderResource(source, fetcher);

        setSource(1);
        refetch(2);
        await promises[0].reject("!hi!");
        expect(data.state).toEqual("pending");
        expect(data.loading).toBe(true);
        expect(data.error).toBeUndefined();

        await promises[2].reject("!hello!");
        expect(data.loading).toBe(false);
        expect(data.error).toEqual("!hello!");

        setSource(3);
        refetch(4);
        setSource(5);
        await promises[4].reject("hi4");
        await promises[3].resolve("hi3");
        await promises[1].reject("hi1");
        expect(data.loading).toBe(true);
        expect(data.error).toEqual("!hello!");

        await promises[5].reject("!hi5!");
        expect(data.loading).toBe(false);
        expect(data.error).toEqual("!hi5!");

        setSource(6);
        refetch(7);
        await promises[7].resolve("good");
        expect(data.state).toEqual("ready");
        expect(data.error).toBeUndefined();
        expect(data()).toEqual("good");
    });

    it("is not reacting to previous requests finishing out of order", async () => {
        const [fetcher, promises] = promisator<string>(5);

        const [data, { refetch }] = renderResource(fetcher);

        refetch();
        refetch();
        refetch();

        await promises[1].resolve("hello");
        expect(data.state).toEqual("pending");

        await promises[3].resolve("hi");
        expect(data.state).toEqual("ready");
        expect(data()).toEqual("hi");

        await promises[2].reject("bou!");
        expect(data.state).toEqual("ready");
        expect(data.loading).toEqual(false);
        expect(data.error).toBeUndefined();
        expect(data.latest).toEqual("hi");
        expect(data()).toEqual("hi");

        await promises[0].resolve("nice");
        expect(data.state).toEqual("ready");
        expect(data.loading).toEqual(false);
        expect(data.error).toBeUndefined();
        expect(data.latest).toEqual("hi");
        expect(data()).toEqual("hi");
    });
});
