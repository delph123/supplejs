import { describe, expect, it } from "vitest";
import { toArray } from "../../core";

describe("toArray", () => {
    it("converts nullish value to empty array", () => {
        expect(toArray(undefined)).toEqual([]);
        expect(toArray(null)).toEqual([]);
    });

    it("returns an array as is", () => {
        expect(toArray([])).toEqual([]);
        const a = [4, { e: 5 }, () => 4];
        expect(toArray(a)).toBe(a);
    });

    it("converts non-array values to an array with single element", () => {
        let a;
        expect(toArray(1.2)).toEqual([1.2]);
        expect(toArray("f")).toEqual(["f"]);
        expect(toArray(false)).toEqual([false]);
        a = { m: 4 };
        expect(toArray(a)).toEqual([a]);
        a = () => "x";
        expect(toArray(a)).toEqual([a]);
        a = Symbol("l");
        expect(toArray(a)).toEqual([a]);
    });
});
