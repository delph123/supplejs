/// <reference types="vite/client" />
/// <reference types="vitest" />

import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const rootdir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    // Github pages are exposed in a subpath named same as the repo
    base: "/supplejs/",
    // Setup jest, jest-dom & v8 for unit tests and coverage
    test: {
        setupFiles: ["./src/tests/utils/vitest-setup.ts"],
        environment: "jsdom",
        coverage: {
            provider: "v8",
            include: ["./src/core/**"],
            exclude: ["./src/core/chain.ts", "./src/core/store.ts"],
        },
    },
    // By default, Vitest considers all packages from node_modules as external.
    // As external modules will not be transformed by the Vite's pipeline, we
    // need to set this option to make sure SuppleJS Testing Library will be
    // transformed since it imports `SuppleJS` module.
    // https://vitejs.dev/guide/ssr.html#ssr-externals
    ssr: {
        noExternal: ["supplejs-testing-library"],
    },
    resolve: {
        // Alias SuppleJS to `src/core` so that the same SuppleJS module is
        // imported by both unit tests & supplejs-testing-library.
        alias: {
            supplejs: resolve(rootdir, "./src/core"),
        },
    },
});
