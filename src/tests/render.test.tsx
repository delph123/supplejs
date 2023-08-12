import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/dom";
import { h, render } from "../rwr";

describe("render", () => {
    it("Renders a string", () => {
        const container = document.body;
        render(() => "Hello world!", container);
        expect(container).toHaveTextContent("Hello world!");
    });

    it("Renders an h1 tag", () => {
        render(() => <h1>Main Title</h1>);
        const main = screen.getByRole("heading");
        expect(main).toBeVisible();
        expect(main).toHaveTextContent("Main Title");
    });
});
