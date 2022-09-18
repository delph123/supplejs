import { AsyncApp, MyNameIs, RecursiveEffect } from "./async_components";
import { MultiApp } from "./components";
import { render } from "./rwr";

import "./style.css";

render(RecursiveEffect(), document.getElementById("app")!);
