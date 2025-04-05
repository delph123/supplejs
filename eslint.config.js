import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import testingLibrary from "eslint-plugin-testing-library";
import jestDom from "eslint-plugin-jest-dom";

export default tseslint.config(
    {
        // config with just ignores is the replacement for `.eslintignore`
        ignores: ["build/**", "dist/**", "coverage/**", "doc/**"],
    },
    {
        extends: [eslint.configs.recommended, tseslint.configs.strict, tseslint.configs.stylistic],

        languageOptions: {
            globals: {
                ...globals.browser,
            },

            parser: tseslint.parser,

            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },

        rules: {
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/consistent-type-definitions": "off",
            "@typescript-eslint/consistent-indexed-object-style": "off",

            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    varsIgnorePattern: "^(h|Fragment)$",
                    argsIgnorePattern: "^_",
                },
            ],
        },
    },
    {
        files: ["scripts/**"],

        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
    {
        files: ["**/?(*.)+(spec|test).[jt]s?(x)"],

        extends: [testingLibrary.configs["flat/dom"], jestDom.configs["flat/recommended"]],

        rules: {
            "testing-library/no-node-access": "off",
        },
    },
    {
        files: ["**/*.js"],
        extends: [tseslint.configs.disableTypeChecked],
    },
);
