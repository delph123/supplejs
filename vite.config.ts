/// <reference types="vite/client" />
/// <reference types="vitest" />

import { defineConfig } from "vite";

export default defineConfig({
    // Github pages are exposed in a subpath named same as the repo
    base: "/supplejs/",
    // Setup jest, jest-dom & v8 for unit tests and coverage
    test: {
        setupFiles: ["src/tests/utils/vitest-setup.ts"],
        environment: "jsdom",
        coverage: {
            provider: "v8",
            include: ["src/core/**"],
            exclude: ["src/core/chain.ts", "src/core/store.ts"],
        },
    },
});
