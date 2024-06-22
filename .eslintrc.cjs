module.exports = {
    env: {
        browser: true,
        es2024: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        // "plugin:@typescript-eslint/recommended-type-checked",
        // "plugin:@typescript-eslint/stylistic-type-checked",
    ],
    overrides: [
        {
            env: {
                node: true,
            },
            files: [".eslintrc.{js,cjs}"],
            parserOptions: {
                sourceType: "script",
            },
        },
        {
            files: ["**/?(*.)+(spec|test).[jt]s?(x)"],
            extends: ["plugin:testing-library/dom", "plugin:jest-dom/recommended"],
        },
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: ["./tsconfig.json", "./tsconfig.eslint.json"],
        tsconfigRootDir: __dirname,
    },
    plugins: ["@typescript-eslint", "testing-library", "jest-dom"],
    rules: {
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": [
            "error",
            { varsIgnorePattern: "^(h|Fragment)$", argsIgnorePattern: "^_" },
        ],
    },
};
