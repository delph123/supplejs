/* Inspiration from https://github.com/solidjs/solid/blob/main/packages/solid/web/test/dynamic.spec.tsx */

import { describe, expect, it } from "vitest";
import {
    h,
    Dynamic,
    createSignal,
    SuppleComponent,
    createRef,
} from "../../core";
import { render, screen } from "../utils";

describe("<Dynamic /> reactivity", () => {
    interface ExampleProps {
        id: () => string;
    }

    const CompA: SuppleComponent<ExampleProps> = (props) => () => (
        <div>Hi {props.id}</div>
    );
    const CompB: SuppleComponent<ExampleProps> = (props) => () => (
        <span>Yo {props.id}</span>
    );

    it("toggles between components", () => {
        const [comp, setComp] = createSignal<
            SuppleComponent<ExampleProps> | string | undefined
        >();
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
});
