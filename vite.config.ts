/// <reference types="vite/client" />
/// <reference types="vitest" />

import { defineConfig } from "vite";

export default defineConfig({
    base: "/supplejs/",
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
