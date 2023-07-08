import { h, Fragment, Show, createSignal, untrack } from "../rwr";

export function TestWhen() {
    const [content, setContent] = createSignal<any>();
    setTimeout(() => setContent("Now you can show"), 2000);
    setTimeout(() => setContent("Too late to show"), 4000);
    return () => (
        <p>
            <Show
                when={content}
                fallback={<font color="blue">Will soon show</font>}
            >
                {(v) => (
                    <span>
                        <font color="blue">{v}</font>
                    </span>
                )}
            </Show>{" "}
            me the money!
            <br />
            <Show
                when={false}
                fallback={<font color="magenta">Direct to fallback.</font>}
            >
                <p style="color: magenta;">
                    Error - This shouldn't be displayed
                </p>
            </Show>
            <br />
            <Show
                when={() => content() == null}
                fallback={<font color="green">HIDDEN NOW</font>}
            >
                Will disappear in{" "}
                <span style="font-weight: bold; color: green;">2 seconds</span>!
            </Show>
            <Show
                when={true}
                fallback={<div>Error - This should not be displayed</div>}
            >
                <div>Before</div>
                {content}
                {" me the money"}
                <div>After</div>
            </Show>
        </p>
    );
}
