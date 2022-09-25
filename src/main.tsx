import { h, render } from "./rwr";
import { AsyncApp, MyNameIs, NestedEffect } from "./examples/async_components";
import { MultiApp } from "./examples/components";
import { Counter, Todo } from "./examples/todo";

import "./style.css";

render(() => <MultiApp />, document.getElementById("app")!);
