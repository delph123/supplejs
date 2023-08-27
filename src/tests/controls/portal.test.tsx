/* Inspiration from https://github.com/solidjs/solid/blob/main/packages/solid/web/test/portal.spec.tsx */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRef, createSignal, h, Portal, Show } from "../../core";
import { render, screen } from "../utils";

describe("<Portal /> component", () => {
    let portalContainer: HTMLDivElement;

    beforeEach(() => {
        portalContainer = document.body.appendChild(
            document.createElement("div"),
        );
    });

    afterEach(() => {
        portalContainer.parentNode?.removeChild(portalContainer);
    });

    it("creates a portal to another div in the document", () => {
        const { unmount, container } = render(() => (
            <Portal mount={portalContainer}>
                <h1 class="portal">Hello</h1>
            </Portal>
        ));

        expect(container).toBeEmptyDOMElement();
        expect((portalContainer!.firstChild as HTMLDivElement).innerHTML).toBe(
            '<h1 class="portal">Hello</h1>',
        );

        unmount();
        expect(portalContainer).toBeEmptyDOMElement();
    });

    it("creates a portal to another div not attached to the document", () => {
        document.body.removeChild(portalContainer);
        const { unmount, container } = render(() => (
            <Portal mount={portalContainer}>
                <h1 class="portal">Hello</h1>
            </Portal>
        ));

        expect(container).toBeEmptyDOMElement();
        expect((portalContainer!.firstChild as HTMLDivElement).innerHTML).toBe(
            '<h1 class="portal">Hello</h1>',
        );

        unmount();
        expect(portalContainer).toBeEmptyDOMElement();
    });

    it("creates element in the header without additional <div>", () => {
        const [s, set] = createSignal("A Meaningful Page Title");
        const [visible, setVisible] = createSignal(true);

        const { container, unmount } = render(() => (
            <Show when={visible()}>
                <Portal mount={document.head}>
                    <title>{s}</title>
                </Portal>
            </Show>
        ));

        expect(container).toBeEmptyDOMElement();
        expect(document.head.innerHTML).toBe(
            "<title>A Meaningful Page Title</title>",
        );

        set("A New Better Page Title");
        expect(document.head.innerHTML).toBe(
            "<title>A New Better Page Title</title>",
        );

        setVisible(false);
        expect(document.head).toBeEmptyDOMElement();
        setVisible(true);
        expect(document.head.innerHTML).toBe(
            "<title>A New Better Page Title</title>",
        );

        unmount();
        expect(document.head).toBeEmptyDOMElement();
    });

    it("accepts ref at Portal level assigned to the container div", () => {
        const checkElem = createRef<HTMLDivElement>();
        const testElem = createRef<HTMLDivElement>();

        render(() => (
            <Portal ref={checkElem}>
                <div ref={testElem} />
            </Portal>
        ));

        expect(testElem.current).toBe(checkElem.current.firstChild);
    });

    it("dispatches events inside the portal", () => {
        const testElem = createRef<HTMLDivElement>();
        let clicked = false;

        render(() => (
            <Portal mount={portalContainer}>
                <div
                    ref={testElem}
                    onClick={() => {
                        clicked = true;
                    }}
                />
            </Portal>
        ));

        expect(clicked).toBe(false);
        testElem.current.click();
        expect(clicked).toBe(true);
    });

    it("accepts multiple children", () => {
        render(() => (
            <Portal mount={portalContainer}>
                <p>first</p>
                <p>second</p>
                <p>third</p>
            </Portal>
        ));

        expect(portalContainer.innerHTML).toContain("<p>first</p>");
        expect(portalContainer.innerHTML).toContain("<p>second</p>");
        expect(portalContainer.innerHTML).toContain("<p>third</p>");
    });

    it("accepts a direct reactive child", () => {
        const div = createRef<HTMLDivElement>();
        const [count, setCount] = createSignal(0);

        render(() => <Portal ref={div}>{count}</Portal>);

        expect(div.current.innerHTML).toBe("0");
        setCount(count() + 1);
        expect(div.current.innerHTML).toBe("1");
        setCount(count() + 1);
        expect(div.current.innerHTML).toBe("2");
    });

    it("accepts no child", () => {
        const div = createRef<HTMLDivElement>();
        render(() => <Portal ref={div}></Portal>);
        expect(div.current).toBeEmptyDOMElement();
    });

    it("mounts to document body by default", () => {
        document.body.removeChild(portalContainer);
        const [visible, setVisible] = createSignal(false);

        render(
            () => (
                <main>
                    <Show when={visible()}>
                        <Portal>
                            <h1>hello</h1>
                        </Portal>
                    </Show>
                </main>
            ),
            { container: document.body },
        );

        expect(document.body.children.length).toBe(1);
        setVisible(true);
        expect(document.body.children.length).toBe(2);
        expect(document.body).toContainElement(screen.getByRole("heading"));
    });

    it("reacts to change of root element", () => {
        const [portalId, setPortalId] = createSignal("");

        render(() => (
            <main>
                <section>
                    <Show when={() => portalId() !== ""}>
                        <Portal
                            mount={() => document.getElementById(portalId())!}
                        >
                            <h1>hello</h1>
                        </Portal>
                    </Show>
                </section>
                <section id="one"></section>
                <section id="two"></section>
            </main>
        ));

        const mainSection = screen.getByRole("main")
            .firstElementChild as HTMLElement;
        const firstSection = mainSection?.nextElementSibling as HTMLElement;
        const secondSection = firstSection?.nextElementSibling as HTMLElement;

        expect(mainSection).toBeEmptyDOMElement();
        expect(firstSection).toBeEmptyDOMElement();
        expect(secondSection).toBeEmptyDOMElement();

        setPortalId("one");
        expect(mainSection).toBeEmptyDOMElement();
        expect(firstSection).toContainElement(screen.getByText("hello"));
        expect(secondSection).toBeEmptyDOMElement();

        setPortalId("two");
        expect(mainSection).toBeEmptyDOMElement();
        expect(firstSection).toBeEmptyDOMElement();
        expect(secondSection).toContainElement(screen.getByText("hello"));

        setPortalId("");
        expect(mainSection).toBeEmptyDOMElement();
        expect(firstSection).toBeEmptyDOMElement();
        expect(secondSection).toBeEmptyDOMElement();
        expect(screen.queryByText("hello")).not.toBeInTheDocument();
    });

    it("renders in shadow root", () => {
        const div = createRef<HTMLDivElement>();
        const [visible, setVisible] = createSignal(true);
        const [paragraph, setParagraph] = createSignal("something");

        render(() => (
            <main>
                <Show when={visible}>
                    <Portal useShadow={true} ref={div} mount={portalContainer}>
                        <h1>hello</h1>
                        <p>{paragraph}</p>
                    </Portal>
                </Show>
            </main>
        ));

        expect(screen.getByRole("main")).toBeEmptyDOMElement();
        expect(portalContainer).not.toBeEmptyDOMElement();

        expect(div.current.shadowRoot).not.toBeNull();
        expect(div.current.shadowRoot?.innerHTML).toEqual(
            "<h1>hello</h1><p>something</p>",
        );

        setParagraph("world!");
        expect(div.current.shadowRoot?.innerHTML).toEqual(
            "<h1>hello</h1><p>world!</p>",
        );

        setVisible(false);
        expect(screen.getByRole("main")).toBeEmptyDOMElement();
        expect(portalContainer).toBeEmptyDOMElement();
        expect(div.current).not.toBeInTheDocument();
    });
});
