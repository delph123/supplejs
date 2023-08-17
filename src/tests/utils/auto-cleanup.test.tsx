import { expect, test } from "vitest";
import { render } from "./testing-renderer";
import { h } from "../../rwr";
import { screen } from "@testing-library/dom";

// Verifies that we have automatic cleanup between tests
test("first", () => {
    render(() => <div>hi</div>);
    const hi = screen.getByText("hi");
    expect(hi).toBeInTheDocument();
});

test("second", () => {
    expect(document.body).toBeEmptyDOMElement();
    const hi = screen.queryByText("hi");
    expect(hi).not.toBeInTheDocument();
});
