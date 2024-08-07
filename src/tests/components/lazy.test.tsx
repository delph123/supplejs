import { describe, expect, it, vi } from "vitest";
import { render, screen, waitForElementToBeRemoved } from "supplejs-testing-library";
import { ErrorBoundary, Show, createSignal, h, lazy } from "../../core";

describe("lazy() with import()", () => {
    it("displays 'Loading component...' while loading", () => {
        const LazyMockComponent = lazy(() => import("../mocks/mock_component.tsx"));
        render(() => <LazyMockComponent />);
        expect(screen.getByText("Loading component...")).toBeInTheDocument();
    });

    it("loads component in place of loading indicator", async () => {
        const LazyMockComponent = lazy(() => import("../mocks/mock_component.tsx"));
        render(() => <LazyMockComponent>Hello world!</LazyMockComponent>);
        expect(screen.getByText("Loading component...")).toBeInTheDocument();
        const text = await screen.findByText("Hello world!");
        expect(text).toBeInTheDocument();
        expect(screen.queryByText("Loading component...")).not.toBeInTheDocument();
    });

    it("preloads component", async () => {
        const LazyMockComponent = lazy(() => import("../mocks/mock_component.tsx"));
        await LazyMockComponent.preload();
        render(() => <LazyMockComponent>Hello world!</LazyMockComponent>);
        expect(screen.getByText("Hello world!")).toBeInTheDocument();
        expect(screen.queryByText("Loading component...")).not.toBeInTheDocument();
    });

    it("calls preload only once", async () => {
        const spy = vi.fn(() => import("../mocks/mock_component.tsx"));
        const LazyMockComponent = lazy(spy);
        LazyMockComponent.preload();
        expect(spy).toHaveBeenCalledOnce();
        await LazyMockComponent.preload();
        await LazyMockComponent.preload();
        expect(spy).toHaveBeenCalledOnce();
        render(() => <LazyMockComponent>Hello world!</LazyMockComponent>);
        expect(spy).toHaveBeenCalledOnce();
        expect(screen.getByText("Hello world!")).toBeInTheDocument();
        expect(screen.queryByText("Loading component...")).not.toBeInTheDocument();
    });

    it("returns the same Promise", async () => {
        const spy = vi.fn(() => import("../mocks/mock_component.tsx"));
        const LazyMockComponent = lazy(spy);
        const a = LazyMockComponent.preload();
        const b = LazyMockComponent.preload();
        expect(b).toBe(a);
        await a;
        const c = LazyMockComponent.preload();
        expect(c).toBe(a);
    });

    it("catches loading error and rejects promise", async () => {
        const path = "../error/does/not/exist.tsx";
        const spy = vi.fn();
        const LazyErrorComponent = lazy(() => import(path));
        LazyErrorComponent.preload().catch(spy);
        render(() => <LazyErrorComponent />);
        await expect(LazyErrorComponent.preload()).rejects.toBeInstanceOf(Error);
        expect(spy).toHaveBeenCalled();
    });

    it("catches loading error and trigger <ErrorBoundary />", async () => {
        const path = "../error/does/not/exist.tsx";
        const LazyErrorComponent = lazy(() => import(path));
        render(() => (
            <main>
                <ErrorBoundary fallback="could not load component">
                    <LazyErrorComponent />
                </ErrorBoundary>
            </main>
        ));
        await expect(LazyErrorComponent.preload()).rejects.toBeInstanceOf(Error);
        expect(screen.getByRole("main")).toHaveTextContent("could not load component");
    });

    it("only starts loading when component is visible", async () => {
        let resolver;
        const [visible, setVisible] = createSignal(false);
        const Cmp = vi.fn(() => () => <h1>Hello</h1>);
        const loader = vi.fn(() => {
            return new Promise<{ default: typeof Cmp }>((resolve) => {
                resolver = resolve;
            });
        });
        const LazyCmp = lazy(loader);

        render(() => {
            return (
                <Show when={visible} fallback="waiting">
                    <LazyCmp />
                </Show>
            );
        });

        expect(screen.getByText("waiting")).toBeInTheDocument();
        expect(loader).not.toHaveBeenCalled();
        expect(Cmp).not.toHaveBeenCalled();

        setVisible(true);

        expect(screen.queryByText("waiting")).not.toBeInTheDocument();
        expect(loader).toHaveBeenCalled();
        expect(Cmp).not.toHaveBeenCalled();

        resolver!({ default: Cmp });
        await waitForElementToBeRemoved(() => screen.queryByText("Loading component..."));

        expect(screen.getByText("Hello")).toBeInTheDocument();
        expect(loader).toHaveBeenCalled();
        expect(Cmp).toHaveBeenCalled();
    });
});
