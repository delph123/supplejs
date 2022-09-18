import { AsyncApp, MyNameIs, NestedEffect } from "./async_components";
import { MultiApp } from "./components";
import { render } from "./rwr";

import "./style.css";

render(NestedEffect(), document.getElementById("app")!);
