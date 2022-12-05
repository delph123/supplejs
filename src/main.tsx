import { h, render } from "./rwr";
import {
    CounterButton,
    MyNameIs,
    NestedEffect,
    Referencing,
} from "./examples/effects";
import { AsyncApp, AutoCounter } from "./examples/async_components";
import { MultiApp, GoodBye } from "./examples/components";
import { Todo } from "./examples/todo";
import { GameOn, NestedChildren } from "./examples/fragments";
import { Indexer, Mapper } from "./examples/iterators";
import { App } from "./examples/js_framework_bench";
import { ReduxSlice } from "./examples/redux";

// import "./style.css";

const exit = render(
    () => <ReduxSlice nb={5} onexit={() => exit()} />,
    document.getElementById("app")!
);
