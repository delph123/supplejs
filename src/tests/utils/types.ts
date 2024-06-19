import { queries } from "@testing-library/dom";
import type { Queries, BoundFunctions, prettyFormat } from "@testing-library/dom";
import { SuppleChildren, SuppleComponent, TrackingContext } from "../../core";

export interface Ref {
    container?: HTMLElement;
    dispose: () => void;
}

export interface Options {
    container?: HTMLElement;
    baseElement?: HTMLElement;
    queries?: Queries & typeof queries;
    wrapper?: SuppleComponent<{ children: SuppleChildren }>;
}

export type DebugFn = (
    baseElement?: HTMLElement | HTMLElement[],
    maxLength?: number,
    options?: prettyFormat.OptionsReceived,
) => void;

export type Result = BoundFunctions<typeof queries> & {
    asFragment: () => string;
    container: HTMLElement;
    baseElement: HTMLElement;
    debug: DebugFn;
    unmount: () => void;
};

export type RenderHookOptions<A extends any[]> =
    | {
          initialProps?: A;
          wrapper?: SuppleComponent<{ children: SuppleChildren }>;
      }
    | A;

export type RenderHookResult<R> = {
    result: R;
    owner: TrackingContext | null;
    cleanup: () => void;
};
