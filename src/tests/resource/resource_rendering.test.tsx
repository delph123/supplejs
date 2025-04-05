import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "supplejs-testing-library";
import { h, createSignal } from "../../core";
import { promisator } from "./helpers";
import { ResourceManager, resourceManagerContent } from "./ResourceManager";

describe("Rendering Resource", () => {
    it("returns reactive variables, tracking state/loading/error/latest, etC.", async () => {
        const [source, setSource] = createSignal<false | number>(0);
        const [fetcher, promises] = promisator<string>();

        render(() => <ResourceManager source={source} fetcher={fetcher} />);

        expect(resourceManagerContent()).toEqual({
            state: "pending",
            loading: true,
            color: "orange",
            content: "Loading...",
        });

        await promises[0].resolve("hi");
        expect(resourceManagerContent()).toEqual({
            state: "ready",
            loading: false,
            latest: "hi",
            data: "hi",
            color: "black",
            content: "hi",
        });

        setSource(1);
        expect(resourceManagerContent()).toEqual({
            state: "refreshing",
            loading: true,
            latest: "hi",
            data: "hi", // XXX error
            color: "orange",
            content: "Loading...",
        });

        await promises[1].reject(new Error("!no!"));
        expect(resourceManagerContent()).toEqual({
            state: "errored",
            loading: false,
            latest: "hi",
            data: "hi", // XXX error
            error: "!no!",
            color: "red",
            content: "!no!",
        });
    });

    it("can pause resource", async () => {
        const [source, setSource] = createSignal<false | number>(false);
        const [fetcher, promises] = promisator<string>();

        render(() => <ResourceManager source={source} fetcher={fetcher} />);

        expect(resourceManagerContent()).toEqual({
            state: "unresolved",
            loading: false,
            color: "blue",
            content: "Unresolved.",
        });

        setSource(0);

        expect(resourceManagerContent()).toEqual({
            state: "pending",
            loading: true,
            color: "orange",
            content: "Loading...",
        });

        setSource(false);

        expect(resourceManagerContent()).toEqual({
            state: "unresolved",
            loading: false,
            color: "blue",
            content: "Unresolved.",
        });

        setSource(0);
        await promises[0].resolve("hi");

        expect(resourceManagerContent()).toEqual({
            state: "ready",
            loading: false,
            latest: "hi",
            data: "hi",
            color: "black",
            content: "hi",
        });

        setSource(false);

        expect(resourceManagerContent()).toEqual({
            state: "ready",
            loading: false,
            latest: "hi",
            data: "hi",
            color: "black",
            content: "hi",
        });

        setSource(1);

        expect(resourceManagerContent()).toEqual({
            state: "refreshing",
            loading: true,
            latest: "hi",
            data: "hi", // XXX fixme (throws suspense)
            color: "orange",
            content: "Loading...",
        });

        setSource(false);

        expect(resourceManagerContent()).toEqual({
            state: "ready",
            loading: false,
            latest: "hi",
            data: "hi",
            color: "black",
            content: "hi",
        });

        setSource(1);
        await promises[1].reject(new Error("!no!"));

        expect(resourceManagerContent()).toEqual({
            state: "errored",
            loading: false,
            error: "!no!",
            latest: "hi",
            data: "hi", // XXX fixme (throws)
            color: "red",
            content: "!no!",
        });

        setSource(false);

        expect(resourceManagerContent()).toEqual({
            state: "errored",
            loading: false,
            error: "!no!",
            latest: "hi",
            data: "hi", // XXX fixme (throws)
            color: "red",
            content: "!no!",
        });

        setSource(2);
        await promises[2].resolve("hello");

        expect(resourceManagerContent()).toEqual({
            state: "ready",
            loading: false,
            latest: "hello",
            data: "hello",
            color: "black",
            content: "hello",
        });
    });

    it("allows to refetch or mutate resource", async () => {
        const [source, setSource] = createSignal<false | number>(0);
        const [fetcher, promises] = promisator<string>();

        render(() => <ResourceManager source={source} fetcher={fetcher} />);

        fireEvent.click(screen.getByRole("button", { name: "Mutate" }));

        expect(resourceManagerContent()).toEqual({
            state: "pending",
            loading: true,
            data: "mutated!",
            latest: "mutated!",
            color: "orange",
            content: "Loading...",
        });

        await promises[0].resolve("hello");

        expect(resourceManagerContent()).toEqual({
            state: "ready",
            loading: false,
            data: "hello",
            latest: "hello",
            color: "black",
            content: "hello",
        });

        fireEvent.click(screen.getByRole("button", { name: "Refetch" }));

        expect(resourceManagerContent()).toEqual({
            state: "refreshing",
            loading: true,
            data: "hello",
            latest: "hello",
            color: "orange",
            content: "Loading...",
        });

        fireEvent.click(screen.getByRole("button", { name: "Mutate" }));

        expect(resourceManagerContent()).toEqual({
            state: "refreshing",
            loading: true,
            data: "mutated!",
            latest: "mutated!",
            color: "orange",
            content: "Loading...",
        });

        await promises[1].reject(new Error("!no!"));

        expect(resourceManagerContent()).toEqual({
            state: "errored",
            loading: false,
            error: "!no!",
            data: "mutated!",
            latest: "mutated!",
            color: "red",
            content: "!no!",
        });

        setSource(2);
        await promises[2].resolve("nice");
        setSource(3);
        await promises[3].reject(new Error("!nice!"));

        expect(resourceManagerContent()).toEqual({
            state: "errored",
            loading: false,
            error: "!nice!",
            data: "nice",
            latest: "nice",
            color: "red",
            content: "!nice!",
        });

        fireEvent.click(screen.getByRole("button", { name: "Mutate" }));

        expect(resourceManagerContent()).toEqual({
            state: "errored",
            loading: false,
            error: "!nice!",
            data: "mutated!",
            latest: "mutated!",
            color: "red",
            content: "!nice!",
        });
    });
});
