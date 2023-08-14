import { h, render } from "./rwr";
import Navigation from "./examples/Navigation";

import "./main.css";

render(() => <Navigation />, document.getElementById("nav")!);
