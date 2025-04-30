import { describe, expect, it } from "vitest";
import { Accessor } from "../../core";
import { createResourceParams } from "../../core/resource";

describe("createResourceParams", () => {
    it("takes a fetcher only", () => {
        const [params, fetcher, opts] = createResourceParams<number, undefined>(() => 0);

        expect(params()).toBeUndefined();
        expect(fetcher(undefined, { value: undefined, refetching: false })).toBe(0);
        expect(opts.initialValue).toBeUndefined();
    });

    it("takes a fetcher and an empty option", () => {
        const [params, fetcher, opts] = createResourceParams<number, undefined>(() => 0, {});

        expect(params()).toBeUndefined();
        expect(fetcher(undefined, { value: undefined, refetching: false })).toBe(0);
        expect(opts.initialValue).toBeUndefined();
    });

    it("takes a fetcher and an option with initial value", () => {
        const [params, fetcher, opts] = createResourceParams<number, undefined>(() => 0, {
            initialValue: 5,
        });

        expect(params()).toBeUndefined();
        expect(fetcher(undefined, { value: undefined, refetching: false })).toBe(0);
        expect(opts.initialValue).toBe(5);
    });

    it("takes a source as a function and a fetcher", () => {
        const [params, fetcher, opts] = createResourceParams<number, string>(
            () => "h",
            () => 0,
        );

        expect(params()).toEqual("h");
        expect(fetcher("h", { value: undefined, refetching: false })).toBe(0);
        expect(opts.initialValue).toBeUndefined();
    });

    it("takes a source as a raw value and a fetcher", () => {
        const [params, fetcher, opts] = createResourceParams<number, string>("h", () => 0);

        expect(params()).toEqual("h");
        expect(fetcher("h", { value: undefined, refetching: false })).toBe(0);
        expect(opts.initialValue).toBeUndefined();
    });

    it("takes a source as false and a fetcher", () => {
        const [params, fetcher, opts] = createResourceParams<number, string>(false, () => 0);

        expect(params()).toBe(false);
        expect(fetcher("h", { value: undefined, refetching: false })).toBe(0);
        expect(opts.initialValue).toBeUndefined();
    });

    it("takes a source as null and a fetcher", () => {
        const [params, fetcher, opts] = createResourceParams<number, string>(null, () => 0);

        expect(params()).toBeNull();
        expect(fetcher("h", { value: undefined, refetching: false })).toBe(0);
        expect(opts.initialValue).toBeUndefined();
    });

    it("takes a source as () => false and a fetcher", () => {
        const [params, fetcher, opts] = createResourceParams<number, string>(
            (() => false) as Accessor<false>,
            () => 0,
        );

        expect(params()).toBe(false);
        expect(fetcher("h", { value: undefined, refetching: false })).toBe(0);
        expect(opts.initialValue).toBeUndefined();
    });

    it("takes a source as () => null and a fetcher", () => {
        const [params, fetcher, opts] = createResourceParams<number, string>(
            () => null,
            () => 0,
        );

        expect(params()).toBeNull();
        expect(fetcher("h", { value: undefined, refetching: false })).toBe(0);
        expect(opts.initialValue).toBeUndefined();
    });

    it("takes a source as a function, a fetcher and an empty option", () => {
        const [params, fetcher, opts] = createResourceParams<number, string>(
            () => "h",
            () => 0,
            {},
        );

        expect(params()).toEqual("h");
        expect(fetcher("h", { value: undefined, refetching: false })).toBe(0);
        expect(opts.initialValue).toBeUndefined();
    });

    it("takes a source as a function, a fetcher and an option with initial value", () => {
        const [params, fetcher, opts] = createResourceParams<number, string>(
            () => "h",
            () => 0,
            { initialValue: 5 },
        );

        expect(params()).toEqual("h");
        expect(fetcher("h", { value: undefined, refetching: false })).toBe(0);
        expect(opts.initialValue).toBe(5);
    });

    it("takes a source as a raw value, a fetcher and an empty option", () => {
        const [params, fetcher, opts] = createResourceParams<number, string>("h", () => 0, {});

        expect(params()).toEqual("h");
        expect(fetcher("h", { value: undefined, refetching: false })).toBe(0);
        expect(opts.initialValue).toBeUndefined();
    });

    it("takes a source as a raw value, a fetcher and an option with initial value", () => {
        const [params, fetcher, opts] = createResourceParams<number, string>("h", () => 0, {
            initialValue: 5,
        });

        expect(params()).toEqual("h");
        expect(fetcher("h", { value: undefined, refetching: false })).toBe(0);
        expect(opts.initialValue).toBe(5);
    });
});
