/// <reference types="vite/client" />
/// <reference types="vitest" />

import { defineConfig } from "vite";

export default defineConfig({
    test: {
        setupFiles: ["src/tests/setup/vitest-setup.ts"],
        environment: "jsdom",
    },
});
