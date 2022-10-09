import { h, render } from "./rwr";
import { MyNameIs, NestedEffect } from "./examples/effects";
import { AsyncApp, AutoCounter } from "./examples/async_components";
import { MultiApp, GoodBye } from "./examples/components";
import { Todo } from "./examples/todo";
import { GameOn, NestedChildren } from "./examples/fragments";
import { Indexer, Mapper } from "./examples/iterators";

// import "./style.css";

const exit = render(
    () => <NestedEffect nb={5} onexit={() => exit()} />,
    document.getElementById("app")!
);
