import { describe, expect, it } from "vitest";
import { sameValueZero, shallowArrayEqual } from "../../rwr";

describe("sameValueZero", () => {
    it("compares equal same values", () => {
        expect(sameValueZero(undefined, undefined)).toBe(true);
        expect(sameValueZero(null, null)).toBe(true);
        expect(sameValueZero(true, true)).toBe(true);
        expect(sameValueZero(false, false)).toBe(true);
        expect(sameValueZero(0, 0)).toBe(true);
        expect(sameValueZero(7, 7)).toBe(true);
        expect(sameValueZero(0n, 0n)).toBe(true);
        expect(sameValueZero(13n, 13n)).toBe(true);
        expect(sameValueZero("", "")).toBe(true);
        expect(sameValueZero("role", "role")).toBe(true);
    });

    it("compares equal +0 & -0", () => {
        expect(sameValueZero(-0, +0)).toBe(true);
        expect(sameValueZero(0, -0)).toBe(true);
    });

    it("compares equal NaN", () => {
        expect(sameValueZero(NaN, Number.NaN)).toBe(true);
    });

    it("compares equal same object", () => {
        const OBJECTS = [{ a: "r" }, [23], () => true, Symbol("toto")];
        for (const obj of OBJECTS) {
            expect(sameValueZero(obj, obj)).toBe(true);
        }
    });

    it("compares not equal distinct values", () => {
        expect(sameValueZero(undefined, null)).toBe(false);
        expect(sameValueZero(true, false)).toBe(false);
        expect(sameValueZero<any>(false, 0)).toBe(false);
        expect(sameValueZero<any>("1", 1)).toBe(false);
        expect(sameValueZero<any>([2, 1], "2,1")).toBe(false);
        expect(sameValueZero(0n, 13n)).toBe(false);
        expect(sameValueZero("role", "rol")).toBe(false);
    });

    it("compares not equal distinct object", () => {
        expect(sameValueZero({ a: "r" }, { a: "r" })).toBe(false);
        expect(sameValueZero([23], [23])).toBe(false);
        expect(
            sameValueZero(
                () => true,
                () => true,
            ),
        ).toBe(false);
        expect(sameValueZero(Symbol("toto"), Symbol("toto"))).toBe(false);
    });
});

describe("shallowArrayEqual", () => {
    const ARRAYS = [
        [],
        [1, 2, 3],
        [{ x: "a" }, () => 0, ["r", Symbol.for("h")]],
    ];

    it("compares equal identical array objects", () => {
        for (const array of ARRAYS) {
            expect(shallowArrayEqual<any>(array, array)).toBe(true);
        }
    });

    it("compares equal empty array", () => {
        expect(shallowArrayEqual([], [])).toBe(true);
    });

    it("compares equal similar arrays", () => {
        for (const array of ARRAYS) {
            expect(shallowArrayEqual<any>(array, array.slice())).toBe(true);
        }
    });

    it("compares equal values -0 & +0 inside array", () => {
        expect(shallowArrayEqual([+0], [-0])).toBe(true);
        expect(shallowArrayEqual([-0, "f"], [0, "f"])).toBe(true);
    });

    it("compares equal NaN values inside array", () => {
        expect(shallowArrayEqual([NaN], [Number.NaN])).toBe(true);
        expect(shallowArrayEqual([NaN, "f"], [NaN, "f"])).toBe(true);
    });

    it("compares not equal distinct arrays", () => {
        expect(shallowArrayEqual([1, 2, 4], [1, 2, 3])).toBe(false);
        expect(
            shallowArrayEqual<any>(
                ["1", true, Symbol.for("h")],
                [1, true, Symbol.for("h")],
            ),
        ).toBe(false);
        expect(
            shallowArrayEqual<any>([...ARRAYS[2], false], [...ARRAYS[2], 0]),
        ).toBe(false);
        expect(
            shallowArrayEqual<any>(
                [{ a: 3 }, ...ARRAYS[2]],
                [{ a: 3 }, ...ARRAYS[2]],
            ),
        ).toBe(false);
    });

    it("compares not equal arrays of different length", () => {
        expect(shallowArrayEqual([1, 2, 4], [1, 2])).toBe(false);
        expect(
            shallowArrayEqual<any>(
                [true, Symbol.for("h")],
                [1, true, Symbol.for("h")],
            ),
        ).toBe(false);
        expect(shallowArrayEqual<any>([], ARRAYS[2])).toBe(false);
    });
});
