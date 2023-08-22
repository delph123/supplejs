import { expect, describe, it } from "vitest";
import { flatten } from "../../core";

describe("Flatten", () => {
    it("Flatten empty array", () => {
        expect(flatten([])).toEqual([]);
    });

    it("Flatten multi-level empty array", () => {
        expect(flatten([[], [[], []], [[[]]]])).toEqual([]);
    });

    it("Flatten array with single depth", () => {
        expect(flatten([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
    });

    it("Flatten array with depth 2", () => {
        expect(
            flatten([
                [1, 2],
                [3, 4],
            ]),
        ).toEqual([1, 2, 3, 4]);
    });

    it("Flatten array with depth 3", () => {
        expect(flatten([[[1, 2]], [[3], [4]]])).toEqual([1, 2, 3, 4]);
    });

    it("Flatten array with mixed depth", () => {
        expect(flatten([1, [2, [3, [4]]], [[5], 6, 7, [[[8]], 9]]])).toEqual([
            1, 2, 3, 4, 5, 6, 7, 8, 9,
        ]);
    });

    it("Flatten array with empty arrays", () => {
        expect(flatten([[1, [2]], [[]], [[3], [], [[4]]]])).toEqual([
            1, 2, 3, 4,
        ]);
    });
});
