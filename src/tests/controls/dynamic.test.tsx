/* Inspiration from https://github.com/solidjs/solid/blob/main/packages/solid/web/test/dynamic.spec.tsx */

import { describe, expect, it, vi } from "vitest";
import { h, Dynamic, createSignal, SuppleComponent, createRef } from "../../core";
import { render, screen } from "../utils";

describe("<Dynamic /> reactivity", () => {
    interface ExampleProps {
        id: () => string;
    }

    const CompA: SuppleComponent<ExampleProps> = (props) => () => <div>Hi {props.id}</div>;
    const CompB: SuppleComponent<ExampleProps> = (props) => () => <span>Yo {props.id}</span>;

    it("toggles between components", () => {
        const [comp, setComp] = createSignal<SuppleComponent<ExampleProps> | string | undefined>();
        const [name, setName] = createSignal("Smith");

        const div = createRef<HTMLDivElement>();

        render(() => (
            <div ref={div}>
                <Dynamic component={comp} id={name} />
            </div>
        ));

        expect(div.current).toBeEmptyDOMElement();

        setComp(() => CompA);
        expect(div.current.innerHTML).toBe("<div>Hi Smith</div>");
        setName("Smithers");
        expect(div.current.innerHTML).toBe("<div>Hi Smithers</div>");

        setComp(() => CompB);
        expect(div.current.innerHTML).toBe("<span>Yo Smithers</span>");

        setComp("h1");
        expect(div.current.innerHTML).toBe(`<h1 id="Smithers"></h1>`);
        setName("Sunny");
        expect(div.current.innerHTML).toBe(`<h1 id="Sunny"></h1>`);
        expect(screen.getByRole("heading")).toBeInTheDocument();

        setComp(undefined);
        expect(screen.queryByRole("heading")).not.toBeInTheDocument();
        expect(div.current).toBeEmptyDOMElement();
    });

    it("only re-renders when component actually changes", () => {
        const [count, setCount] = createSignal(0);

        const Low = vi.fn(() => () => <span>low</span>);
        const High = vi.fn(() => () => <span>high</span>);

        render(() => <Dynamic component={() => (count() > 5 ? High : Low)} />);

        expect(Low).toHaveBeenCalledOnce();
        expect(High).not.toHaveBeenCalled();

        setCount(2);
        setCount(3);
        setCount(4);
        expect(Low).toHaveBeenCalledOnce();
        expect(High).not.toHaveBeenCalled();

        setCount(8);
        setCount(9);
        expect(Low).toHaveBeenCalledOnce();
        expect(High).toHaveBeenCalledOnce();

        setCount(4);
        expect(Low).toHaveBeenCalledTimes(2);
        expect(High).toHaveBeenCalledOnce();
    });
});
