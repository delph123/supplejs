import { describe, expect, it } from "vitest";
import { render, screen } from "supplejs-testing-library";
import { h } from "../core";

describe("render", () => {
    it("Renders a string", () => {
        const { container } = render(() => "Hello world!");
        expect(container).toHaveTextContent("Hello world!");
    });

    it("Renders an h1 tag", () => {
        render(() => <h1>Main Title</h1>);
        const main = screen.getByRole("heading");
        expect(main).toBeVisible();
        expect(main).toHaveTextContent("Main Title");
    });
});
