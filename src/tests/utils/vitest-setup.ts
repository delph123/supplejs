import { afterEach } from "vitest";
import "vitest-dom/extend-expect";
import { cleanup } from "./testing-renderer";

afterEach(() => cleanup());
