import { h, render } from "./rwr";
import {
    CounterButton,
    MyNameIs,
    NestedEffect,
    Referencing,
} from "./examples/effects";
import {
    AsyncApp,
    AsyncSwitch,
    AutoCounter,
} from "./examples/async_components";
import { MultiApp, GoodBye } from "./examples/components";
import { Todo } from "./examples/todo";
import { GameOn, NestedChildren } from "./examples/fragments";
import { Indexer, Looper, Mapper } from "./examples/iterators";
import { App } from "./examples/js_framework_bench";
import { ReduxSlice } from "./examples/redux";
import RainbowApp from "./examples/RainbowApp";
import {
    ForElseApp,
    SwitchApp,
    TestSwitch,
    TestWhen,
    WhenAppWithSignal,
    LoginApp,
} from "./examples/controls";
import { ChildrenPlayer, DynamicApp } from "./examples/dynamic";

// import "./style.css";

const exit = render(
    // () => <ReduxSlice nb={5} onexit={() => exit()} />,
    () => <AsyncSwitch nb={5} onexit={() => exit()} />,
    document.getElementById("app")!,
);
