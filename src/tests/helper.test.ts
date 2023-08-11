import { expect, describe, it } from "vitest";
import { flatten } from "../rwr";

describe("Flatten", () => {
    it("Flatten empty array", () => {
        expect(flatten([])).toEqual([]);
    });
});
