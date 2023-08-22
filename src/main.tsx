import { h, render } from "./core";
import Navigation from "./examples/Navigation";

import "./main.css";

render(() => <Navigation />, document.getElementById("nav")!);
