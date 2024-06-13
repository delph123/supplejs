import { Mock, describe, expect, it, vi } from "vitest";
import { createComputed, createSignal, getOwner, mapArray, onCleanup } from "../../core";
import { renderHook } from "../utils";

const [A, B, C, D] = [{ key: "a" }, { key: "b" }, { key: "c" }, { key: "d" }];
const [E, F, G, H] = [{ key: "e" }, { key: "f" }, { key: "g" }, { key: "h" }];

function renderMapArray<T, U>(
    iterator: () => Iterable<T>,
    mapFn: (v: T, i: () => number) => U,
    equals?: (prev: T, next: T) => boolean,
) {
    return renderHook(mapArray<T, U>, [iterator, mapFn, equals]);
}

describe("mapArray", () => {
    it("maps an array", () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const mapper = vi.fn((n, _) => n + 1);
        const { result } = renderMapArray(
            () => [1, 2, 3],
            (v, i) => mapper(v, i()),
        );

        expect(mapper).toHaveBeenCalledTimes(3);
        expect(mapper.mock.calls).toEqual([
            [1, 0],
            [2, 1],
            [3, 2],
        ]);
        expect(result()).toEqual([2, 3, 4]);
    });

    it("accepts an iterable", () => {
        const values = new Set([1, 2, 3]);
        const { result: res1 } = renderMapArray(
            () => values,
            (n) => n + 1,
        );
        expect(res1()).toEqual([2, 3, 4]);

        function* gen() {
            for (const v of values) {
                yield v;
            }
        }
        const { result: res2 } = renderMapArray(gen, (n) => n + 1);
        expect(res2()).toEqual([2, 3, 4]);
    });

    it("does not trigger with +/-0 or NaN", () => {
        const [rd, wt] = createSignal<any>([null, +0, -0, "4", [1, 2], NaN]);
        const mapper = vi.fn((v) => v?.toString());

        const { result } = renderMapArray(rd, (v) => mapper(v));
        mapper.mockClear();
        wt([undefined, -0, 0, 4, "1,2", NaN]);

        expect(mapper).toHaveBeenCalledTimes(3);
        expect(mapper.mock.calls).toEqual([[undefined], [4], ["1,2"]]);
        expect(result()).toEqual([undefined, "0", "0", "4", "1,2", "NaN"]);
    });

    it("accepts a custom equality operation", () => {
        type Values = { key?: string; k?: string; [o: string]: any }[];
        const [rd, wt] = createSignal<Values>([A, B, C]);
        const mapper = vi.fn((v) => v.key ?? v.k);

        const { result } = renderMapArray(
            rd,
            (v) => mapper(v),
            (a, b) => (a.key ?? a.k) === (b.key ?? b.k),
        );
        mapper.mockClear();
        wt([{ k: "a", f: 33 }, { k: "c" }, { key: "b", h: "x" }, { k: "d" }]);

        expect(mapper.mock.calls).toEqual([[{ k: "d" }]]);
        expect(result().join()).toEqual("a,c,b,d");
    });

    it("does not track mapping function", () => {
        const [rd, wt] = createSignal(1);
        const spy = vi.fn();

        renderHook(() => {
            const res = mapArray(
                () => [rd],
                (signal) => {
                    expect(getOwner()?.active).not.toBeTruthy();
                    spy(signal());
                },
            );

            createComputed(() => spy(res()));
        });

        spy.mockReset();
        wt(2);

        expect(spy).not.toHaveBeenCalled();
    });
});

describe("Reactivity", () => {
    function prepare() {
        const computed = vi.fn();
        const cleanup = vi.fn();
        const memo = vi.fn();

        const [list, setList] = createSignal([A, B, C, D]);

        const { result } = renderHook(() => {
            const res = mapArray(list, (v, i) => {
                createComputed((first) => {
                    computed(v, i(), first);
                    return false;
                }, true);
                onCleanup(() => cleanup(v, i()));
                return [v];
            });

            createComputed(() => memo(res()));

            return res;
        });

        return [computed, cleanup, memo, result, setList] as const;
    }

    function reset(...args: Mock[]) {
        [...args].forEach((mock) => mock.mockReset());
    }

    it("maps all signal elements initially", () => {
        const [computed, cleanup, memo, res] = prepare();

        expect(computed.mock.calls).toEqual([
            [A, 0, true],
            [B, 1, true],
            [C, 2, true],
            [D, 3, true],
        ]);
        expect(cleanup).not.toHaveBeenCalled();
        expect(memo).toBeCalledTimes(1);
        expect(res()).toEqual([[A], [B], [C], [D]]);
    });

    it("does nothing when array is not changed", () => {
        const [computed, cleanup, memo, res, setList] = prepare();
        reset(computed, cleanup, memo);

        setList([A, B, C, D]);

        expect(computed).not.toHaveBeenCalled();
        expect(cleanup).not.toHaveBeenCalled();
        expect(memo).not.toHaveBeenCalled();
        expect(res()).toEqual([[A], [B], [C], [D]]);

        setList([D, A, C, B]); // changed
        setList([D, A, C, B]);
        setList([C, D, E, F, G, H]); // changed
        setList([C, D, E, F, G]); // changed
        setList([C, D, E, F, G, H]); // changed
        setList([C, D, E, F, G, H]);
        setList([D, E, H, F, C, G]); // changed

        expect(memo).toHaveBeenCalledTimes(5);
    });

    it("adds two elements at the end", () => {
        const [computed, cleanup, memo, res, setList] = prepare();
        reset(computed, cleanup, memo);

        setList([A, B, C, D, E, F]);

        expect(computed.mock.calls).toEqual([
            [E, 4, true],
            [F, 5, true],
        ]);
        expect(cleanup).not.toHaveBeenCalled();
        expect(memo).toHaveBeenCalledOnce();
        expect(res()).toEqual([[A], [B], [C], [D], [E], [F]]);
    });

    it("adds three elements in the middle", () => {
        const [computed, cleanup, memo, res, setList] = prepare();
        setList([A, B, C, D, E, F]);
        setList([A, B, C]);
        reset(computed, cleanup, memo);

        setList([A, E, F, B, G, C]);

        expect(computed.mock.calls).toEqual([
            [E, 1, true],
            [F, 2, true],
            [B, 3, false], // change of index
            [G, 4, true],
            [C, 5, false], // change of index
        ]);
        expect(cleanup).not.toHaveBeenCalled();
        expect(memo).toHaveBeenCalledOnce();
        expect(res()).toEqual([[A], [E], [F], [B], [G], [C]]);
    });

    it("removes two final elements", () => {
        const [computed, cleanup, memo, res, setList] = prepare();
        reset(computed, cleanup, memo);

        setList([A, B]);

        expect(computed).not.toHaveBeenCalled();
        expect(cleanup.mock.calls).toEqual([
            [C, 2],
            [D, 3],
        ]);
        expect(memo).toHaveBeenCalledOnce();
        expect(res()).toEqual([[A], [B]]);
    });

    it("removes three elements in the middle", () => {
        const [computed, cleanup, memo, res, setList] = prepare();
        setList([A, B, C, D, E, F]);
        reset(computed, cleanup, memo);

        setList([A, D, F]);

        expect(computed.mock.calls).toEqual([
            [D, 1, false], // change of index
            [F, 2, false], // change of index
        ]);
        expect(cleanup.mock.calls).toEqual([
            [B, 1],
            [C, 2],
            [E, 4],
        ]);
        expect(memo).toHaveBeenCalledOnce();
        expect(res()).toEqual([[A], [D], [F]]);
    });

    it("shuffles elements", () => {
        const [computed, cleanup, memo, res, setList] = prepare();
        reset(computed, cleanup, memo);

        setList([B, D, C, A]);

        expect(computed.mock.calls).toEqual([
            [B, 0, false], // change of index
            [D, 1, false], // change of index
            [A, 3, false], // change of index
        ]);
        expect(cleanup).not.toHaveBeenCalled();
        expect(memo).toHaveBeenCalledOnce();
        expect(res()).toEqual([[B], [D], [C], [A]]);
    });

    it("shuffles, adds & removes elements", () => {
        const [computed, cleanup, memo, res, setList] = prepare();
        reset(computed, cleanup, memo);

        setList([H, B, F, A, C, E]);

        expect(computed.mock.calls).toEqual([
            [H, 0, true],
            [F, 2, true],
            [A, 3, false], // change of index
            [C, 4, false], // change of index
            [E, 5, true],
        ]);
        expect(cleanup.mock.calls).toEqual([[D, 3]]);
        expect(memo).toHaveBeenCalledOnce();
        expect(res()).toEqual([[H], [B], [F], [A], [C], [E]]);
    });

    it("adds existing element twice", () => {
        const [computed, cleanup, memo, res, setList] = prepare();
        reset(computed, cleanup, memo);

        setList([A, B, A, D, E, E, C]);

        expect(computed.mock.calls).toEqual([
            [A, 2, true],
            [E, 4, true],
            [E, 5, true],
            [C, 6, false], // change of index
        ]);
        expect(cleanup).not.toHaveBeenCalled();
        expect(memo).toHaveBeenCalledOnce();
        expect(res()).toEqual([[A], [B], [A], [D], [E], [E], [C]]);
    });

    it("removes second twin element only", () => {
        const [computed, cleanup, memo, res, setList] = prepare();
        setList([A, B, B, A, C]);
        reset(computed, cleanup, memo);

        setList([B, A, C]);

        expect(computed.mock.calls).toEqual([
            [B, 0, false], // change of index
            [A, 1, false], // change of index
            [C, 2, false], // change of index
        ]);
        expect(cleanup.mock.calls).toEqual([
            [B, 2],
            [A, 3],
        ]);
        expect(res()).toEqual([[B], [A], [C]]);
    });

    it("removes all twin elements", () => {
        const [computed, cleanup, memo, res, setList] = prepare();
        setList([A, B, B, A, C]);
        reset(computed, cleanup, memo);

        setList([]);

        expect(computed).not.toHaveBeenCalled();
        expect(cleanup.mock.calls).toEqual([
            [A, 0],
            [B, 1],
            [B, 2],
            [A, 3],
            [C, 4],
        ]);
        expect(res()).toEqual([]);
    });
});
