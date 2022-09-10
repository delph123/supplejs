import { AsyncApp } from "./async_components";
import { render } from "./rwr";

import "./style.css";

render(AsyncApp(), document.getElementById("app")!);
