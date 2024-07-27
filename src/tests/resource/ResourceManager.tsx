import { screen } from "supplejs-testing-library";
import {
    Accessor,
    createResource,
    ErrorBoundary,
    FetcherParameter,
    h,
    Match,
    ResourceFetcher,
    Switch,
} from "../../core";

export interface ResourceManagerProps {
    readonly source: Accessor<FetcherParameter<number>>;
    readonly fetcher: ResourceFetcher<number, string>;
}

export function ResourceManager({ source, fetcher }: ResourceManagerProps) {
    const [data, { refetch, mutate }] = createResource(source, fetcher);
    return (
        <main>
            <button onClick={() => refetch(Number(source()) + 1)}>Refetch</button>
            <button onClick={() => mutate("mutated!")}>Mutate</button>
            <div data-testid="state">{() => data.state}</div>
            <div data-testid="loading">{() => data.loading.toString()}</div>
            <div data-testid="error">{() => (data.error != null ? data.error.message : "none")}</div>
            <div data-testid="latest">{() => data.latest ?? "-"}</div>
            <div data-testid="data">
                <ErrorBoundary fallback="error">{() => data() ?? "-"}</ErrorBoundary>
            </div>
            <div data-testid="global">
                <Switch fallback={<p style="color: blue;">Unresolved.</p>}>
                    <Match when={() => data.loading}>
                        <p style="color: orange;">Loading...</p>
                    </Match>
                    <Match when={() => data.error}>
                        <p style="color: red;">{() => data.error.message}</p>
                    </Match>
                    <Match when={data}>
                        <p style="color: black;">{data}</p>
                    </Match>
                </Switch>
            </div>
        </main>
    );
}

export function resourceManagerContent() {
    const state = screen.getByTestId("state").textContent!;
    const loading = screen.getByTestId("loading").textContent === "true";
    const error =
        screen.getByTestId("error").textContent !== "none"
            ? screen.getByTestId("error").textContent!
            : undefined;
    const latest =
        screen.getByTestId("latest").textContent !== "-"
            ? screen.getByTestId("latest").textContent!
            : undefined;
    const data =
        screen.getByTestId("data").textContent !== "-" ? screen.getByTestId("data").textContent! : undefined;
    const global = screen.getByTestId("global");
    const color = (global.firstChild as HTMLParagraphElement).style.color;
    const content = (global.firstChild as HTMLParagraphElement).textContent!;

    return {
        state,
        loading,
        error,
        latest,
        data,
        color,
        content,
    };
}
