import {
    Dynamic,
    For,
    SuppleComponent,
    Show,
    h,
    render,
    createSignal,
    createEffect,
    toValue,
    ValueOrAccessor,
    SuppleChildren,
} from "../core";

import { Todo } from "./todo";
import { GameOn } from "./fragments";
import { LooperApp } from "./iterators";
import { App } from "./js_framework_bench";
import { ReduxSlice } from "./redux";
import RainbowApp from "./RainbowApp";
import { ForElseApp, SwitchApp, TestSwitch, LoginApp, WhenAppWithSignal } from "./controls";
import { ChildrenPlayer, DynamicApp } from "./dynamic";
import { Game } from "./square";
import { CounterButton } from "./effects";
import { AsyncApp, AsyncSwitch, AutoCounter } from "./async_components";
import { MultiApp, GoodBye } from "./components";
import { ContextPassingApp, MultiContextApp } from "./context";
import { ErrorManager } from "./errors";
import useCSS from "./useCss";

function section(header: string, rows: ReturnType<typeof row>[]) {
    return { header, rows };
}

function row(
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
    section("To be covered by unit tests", [
        row("Counter", "Playing with reactions", CounterButton, { nb: 5 }),
        row("Resource Switch", "A switch to manage resource state", AsyncSwitch),
        row("Dog API", "An asynchronous app using resource to fetch dogs", AsyncApp),
        row("Multi-counter App", "The iconic multi-counter application", MultiApp),
        row("Redux Slice", "Implementation of redux-like store", ReduxSlice),
        row("Children Player", "Play with children() helper", ChildrenPlayer),
        row("Error Manager", "Component throwing & catching errors", ErrorManager, {
            initialErrno: 7,
        }),
    ]),
    section("Covered by unit tests", [
        // row("Playing with Refs", "Mounting ref in DOM", Referencing), // Unit tested
        // row("Indexer", "Playing with indexArray()", Indexer), // Unit tested
        // row("Mapper", "Playing with mapArray()", Mapper), // Unit tested
        // row("Show the money", "Testing <Show> with signals", TestWhen), // Unit tested
        // row("My name is...", "Playing with Signal & Computed", MyNameIs), // Unit tested
        // row("Nesting Effects", "Nested effects running in timeout", NestedEffect), // Unit tested
        // row("NestedChildren", "Deeply nested children (in arrays)", NestedChildren), // Unit tested
        row("Two switch buttons", "Show/hide buttons", WhenAppWithSignal),
        row("Login", "Login/Logout with Portal", LoginApp),
        row("Automatic Counter", "A counter incrementing with interval", AutoCounter),
        row("GoodBye", "Swapping Clock & Goodbye components", GoodBye),
        row("Dynamic", "Play with dynamic & lazy components", DynamicApp),
        row("Number Matcher", "Matching alternating number (13, 14, ...)", SwitchApp),
        row("Switch", "Basic switch tester", TestSwitch),
        row("For/Else", "Combining For & Show", ForElseApp),
        row("Looper", "Playing with <For>", LooperApp),
        row("GameOn", "Deleting clocks until exiting completely", GameOn, { nb: 5 }),
        row("Context Passing", "Passing context to lower-level components", ContextPassingApp),
        row("Multi Counter", "Multiple contexts", MultiContextApp),
    ]),
    section("Applications", [
        // Apps
        row("TODO", "A simple TODO application", Todo),
        row("JS Bench", "JS Framework Bench application", App),
        row("Rainbow", "A rotating rainbow", RainbowApp),
        row("Tic-Tac-Toe", "The tic-tac-toe game", Game),
    ]),
];

export default function Navigation() {
    const [path] = createSignal(document.location.pathname.substring(1));
    const componentDescriptor = () =>
        components.map((s) => s.rows.find((l) => l.component.name === path())).find((r) => r != null);

    createEffect(() => {
        const descriptor = componentDescriptor();
        if (descriptor) {
            const exit = render(() => {
                return (
                    <Dynamic
                        component={() => descriptor.component as SuppleComponent<{ onexit }>}
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
    children?: SuppleChildren;
}

function Link({ href, children }: LinkProps) {
    return () => <a href={toValue(href)}>{children}</a>;
}

function Summary() {
    return () => (
        <table>
            <thead>
                <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Description</th>
                </tr>
            </thead>

            <For each={() => components}>
                {(el: ReturnType<typeof section>) => (
                    <tbody>
                        <tr>
                            <th scope="rowgroup" colspan="2">
                                {el.header}
                            </th>
                        </tr>
                        <For each={() => el.rows}>
                            {(el: ReturnType<typeof row>) => (
                                <tr>
                                    <td>
                                        <Link href={`${el.component.name}`}>{el.name}</Link>
                                    </td>
                                    <td>{el.description}</td>
                                </tr>
                            )}
                        </For>
                    </tbody>
                )}
            </For>
        </table>
    );
}
