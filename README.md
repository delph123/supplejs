# SuppleJS

[![NPM version](https://img.shields.io/npm/v/supplejs?logo=npm)](https://www.npmjs.com/package/supplejs)
[![GitHub License](https://img.shields.io/github/license/delph123/supplejs)](https://github.com/delph123/supplejs/blob/main/LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/delph123/supplejs/test_and_coverage.yml?branch=main&logo=github)](https://github.com/delph123/supplejs/actions/workflows/test_and_coverage.yml)
[![codecov](https://codecov.io/gh/delph123/supplejs/graph/badge.svg?token=AJNU0N5YI7)](https://codecov.io/gh/delph123/supplejs)

SuppleJS is a toy project to re-implement [SolidJS](https://github.com/solidjs/solid) from scratch. The goal is not to make something better or more performant than the SolidJS implementation, but to discover new coding patterns and ideas by building a modern JavaScript library from the ground up and playing around with the [fine-grained reactivity model](https://dev.to/ryansolid/a-hands-on-introduction-to-fine-grained-reactivity-3ndf) of SolidJS.

SuppleJS is a JavaScript framework to build web user interfaces. It shares with [React](https://react.dev/) (which inspired Solid), [SolidJS](https://www.solidjs.com/) and [Vue.js](https://vuejs.org/) the same principles of a component-based, declarative and reactive programming model. The unique feature of SolidJS (and therefore SuppleJS), in comparison with React, is that it relies on a powerful fine-grained reactive system which allows it to recompute and re-render only the part of the screen that actually changed in a very efficient way (without resorting to virtual DOM diffing).

SuppleJS aims at reproducing most of the SolidJS API, with a different implementation. The main difference is that there is no compiler in SuppleJS, therefore all of your code is used as is by the framework. As a corollary, it is necessary for the developers to not call reactive primitive inside JSX, so as to let SuppleJS unwrap the value of these functions inside the reactive system. For example, this code for SolidJS `<p>{count()}</p>` should be replaced by `<p>{count}</p>`
so that the reactivity is not lost and SuppleJS can make sure to re-render only the paragraph's content when the count changes.

## Example

```jsx
/*
 * @jsxImportSource supplejs
 */
import { render, createSignal } from "supplejs";

function Counter() {
    // Create a signal with read/write segregation
    const [count, setCount] = createSignal(0);

    // Component in SuppleJS are ephemeral. They will be called only once and
    // must return a "rendering" function that will be called each time the
    // component needs to be re-rendered.
    return () => (
        // This button will actually never re-render since the signal is not
        // called here but in a nested context (created by the JSX expression
        // {count}). The expression refers to a function that will be unwrapped
        // by Supple's reactive system in a nested context automatically, so
        // that only count value needs to be changed in the DOM when the button
        // is clicked.
        <button
            onClick={
                // The onClick handler uses the signal writer to update
                // the signal and notify all its dependencies automatically
                () => setCount((c) => c + 1)
            }
        >
            Count = {count}
        </button>
    );
}

// The render function takes an effect (a function) so that JSX can be
// safely wrapped in a reactive root before it is evaluated
render(() => <Counter />, document.getElementById("app"));
```

This minimalist example implement the iconic "counter button" component with SuppleJS. You can note the following things:

-   Unlike in SolidJS, one must return a function instead of JSX directly from a component
-   The signal shall not be called to avoid re-rendering the full button and only mutate the count value in the DOM when it is changed
-   When working with JSX markup, `jsxImportSource` must be set in TypeScript config to `supplejs` to import primitives necessary for supplejs and typing of JSX

This all is due to not having a compiler, and to the design of SuppleJS. However, besides that, the same API is used as SolidJS. For example for `createSignal`, `render` and other reactive primitives like `createMemo`, `createResource`, `createEffect`, `onCleanup`, `createRoot`, `getOwner`, and so on. SuppleJS also provides same control flow components as Solid: `<Show>`, `<Switch>`/`<Match>`, `<For>`, `<Index>`, `<Portal>`, etc.

As SuppleJS provides the same API and design as Solid, you can have a look at the [Github repository](https://github.com/solidjs/solid) and the [API documentation](https://www.solidjs.com/docs/latest/api) to get a glimpse of what's inside SuppleJS and what are its key features. Bear in mind though that SuppleJS is only about the front-end rendering part and has no Server Side Rendering engine.

## How to use?

You can get started with a simple app by running the commands below in your terminal. The project uses [pnpm](https://pnpm.io/fr/) package manager and [vite](https://vitejs.dev/) developer tooling.

```sh
> pnpm dlx degit delph123/supplejs-templates/ts-vitest example-app
> cd example-app
> pnpm install  # or npm install or yarn install
```

Once all dependencies are downloaded and installed, you can run a local server with fast refresh with:

```sh
> pnpm run dev  # or yarn or npm
```

Other scripts includes:

```sh
> pnpm test                     # launch all test suites
> pnpm coverage                 # launch all tests with coverage analysis
> pnpm build && pnpm preview    # build supple & run a preview server
> pnpm lint                     # launch eslint
```

**Note:** Even though SuppleJS is working mostly fine and have a good ecosystem, it is still just a educational project. As such, it should not be used for production-grade development!

## Contributing

As SuppleJS is just a toy project, I probably won't be accepting pull requests or contributions.

However, do feel free to fork the project to use it for you own education or to do whatever you feel like to do with it.

If you find issues or have feedbacks to do, don't hesitate to create an issue.

I'm using supplejs & supplejs-testing-library package names in [npm](https://www.npmjs.com/). If feel you need this library name and have good reasons not to use another, file an issue to reach out to me!
