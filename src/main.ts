import { AsyncApp, MyNameIs, NestedEffect } from "./examples/async_components";
import { MultiApp } from "./examples/components";
import { render } from "./rwr";
import { Counter, Todo } from "./examples/todo";

import "./style.css";

render(Counter(), document.getElementById("app")!);
