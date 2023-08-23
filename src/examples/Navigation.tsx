import {
    Dynamic,
    For,
    SuppleComponent,
    Show,
    h,
    render,
    useCSS,
    createSignal,
    createEffect,
    toValue,
    ValueOrAccessor,
    SuppleChild,
} from "../core";

import { Todo } from "./todo";
import { GameOn, NestedChildren } from "./fragments";
import { Indexer, Looper, Mapper } from "./iterators";
import { App } from "./js_framework_bench";
import { ReduxSlice } from "./redux";
import RainbowApp from "./RainbowApp";
import {
    ForElseApp,
    SwitchApp,
    TestSwitch,
    TestWhen,
    WhenAppWithSignal,
    LoginApp,
} from "./controls";
import { ChildrenPlayer, DynamicApp } from "./dynamic";
import { Game } from "./square";
import { CounterButton, MyNameIs, NestedEffect, Referencing } from "./effects";
import { AsyncApp, AsyncSwitch, AutoCounter } from "./async_components";
import { MultiApp, GoodBye } from "./components";

function c(
    name: string,
    description: string,
    component: SuppleComponent<never>,
    props?: Record<string, any>,
) {
    return {
        name,
        description,
        component,
        props: props ?? {},
    };
}

const components = [
    c("Counter", "Playing with reactions", CounterButton, { nb: 5 }),
    c("My name is...", "Playing with Signal & Computed", MyNameIs),
    c("Nesting Effects", "Nested effects running in timeout", NestedEffect),
    c("Playing with Refs", "Mounting ref in DOM", Referencing),
    c("Automatic Counter", "A counter incrementing with interval", AutoCounter),
    c("Resource Switch", "A switch to manage resource state", AsyncSwitch),
    c("Dog API", "An asynchronous app using resource to fetch dogs", AsyncApp),
    c("Multi-counter App", "The iconic multi-counter application", MultiApp),
    c("GoodBye", "Swapping Clock & Goodbye components", GoodBye),
    c("GameOn", "Deleting clocks until exiting completely", GameOn, { nb: 5 }),
    c("NestedChildren", "Deeply nested children (in arrays)", NestedChildren),
    c("Indexer", "Playing with indexArray()", Indexer),
    c("Looper", "Playing with <For>", Looper),
    c("Mapper", "Playing with mapArray()", Mapper),
    c("JS Bench", "JS Framework Bench application", App),
    c("Redux Slice", "Implementation of redux-like store", ReduxSlice),
    c("For/Else", "Combining For & Show", ForElseApp),
    c("Number Matcher", "Matching alternating number (13, 14, ...)", SwitchApp),
    c("Switch", "Basic switch tester", TestSwitch),
    c("Show the money", "Testing <Show> with signals", TestWhen),
    c("Two switch buttons", "Show/hide buttons", WhenAppWithSignal),
    c("Login", "Login/Logout with Portal", LoginApp),
    c("Children Player", "Play with children() helper", ChildrenPlayer),
    c("Dynamic", "Play with dynamic & lazy components", DynamicApp),
    // Apps
    c("TODO", "A simple TODO application", Todo),
    c("Rainbow", "A rotating rainbow", RainbowApp),
    c("Tic-Tac-Toe", "The tic-tac-toe game", Game),
];

export default function Navigation() {
    const [path] = createSignal(document.location.pathname.substring(1));
    const componentDescriptor = () =>
        components.find((l) => l.component.name === path());

    createEffect(() => {
        const descriptor = componentDescriptor();
        if (descriptor) {
            const exit = render(() => {
                return (
                    <Dynamic
                        component={() =>
                            descriptor.component as SuppleComponent<{ onexit }>
                        }
                        onexit={() => exit()}
                        {...descriptor.props}
                    />
                );
            }, document.getElementById("app")!);
        }
    });

    createEffect(() => {
        if (!componentDescriptor()) {
            useCSS("./navigation.css");
        }
    });

    return () => (
        <Show when={componentDescriptor} fallback={<Summary />}>
            <a class="home" href="/">
                <i class="arrow left" />
                HOME
            </a>
        </Show>
    );
}

interface LinkProps {
    href: ValueOrAccessor<string>;
    children?: SuppleChild[];
}

function Link({ href, children }: LinkProps) {
    return () => <a href={toValue(href)}>{children}</a>;
}

function Summary() {
    return () => (
        <table>
            <tr>
                <th>Name</th>
                <th>Description</th>
            </tr>
            <For each={() => components}>
                {(el) => (
                    <tr>
                        <td>
                            <Link href={`${el.component.name}`}>{el.name}</Link>
                        </td>
                        <td>{el.description}</td>
                    </tr>
                )}
            </For>
        </table>
    );
}
