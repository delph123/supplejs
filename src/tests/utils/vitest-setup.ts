import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "./testing-renderer";

afterEach(() => cleanup());
