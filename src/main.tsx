import { h, render } from "./rwr";
import { CounterButton, MyNameIs, NestedEffect } from "./examples/effects";
import { AsyncApp, AutoCounter } from "./examples/async_components";
import { MultiApp, GoodBye } from "./examples/components";
import { Todo } from "./examples/todo";
import { GameOn, NestedChildren } from "./examples/fragments";
import { Indexer, Mapper } from "./examples/iterators";

// import "./style.css";

const exit = render(
    () => <CounterButton nb={5} onexit={() => exit()} />,
    document.getElementById("app")!
);
