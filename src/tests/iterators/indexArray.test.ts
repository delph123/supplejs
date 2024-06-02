import { Mock, describe, expect, it, vi } from "vitest";
import { createComputed, createMemo, createSignal, getOwner, indexArray, onCleanup } from "../../core";
import { renderHook } from "../utils";

const [A, B, C, D] = [{ key: "a" }, { key: "b" }, { key: "c" }, { key: "d" }];
const [E, F, G, H] = [{ key: "e" }, { key: "f" }, { key: "g" }, { key: "h" }];

function renderIndexArray<T, U>(
    iterator: () => Iterable<T>,
    mapFn: (v: () => T, i: number) => U,
    equals?: (prev: T, next: T) => boolean,
) {
    return renderHook(indexArray<T, U>, [iterator, mapFn, equals]);
}

describe("indexArray", () => {
    it("maps an array", () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const mapper = vi.fn((n, _) => n + 1);
        const { result } = renderIndexArray(
            () => [1, 2, 3],
            (v, i) => mapper(v(), i),
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
        const { result: res1 } = renderIndexArray(
            () => values,
            (n) => n() + 1,
        );
        expect(res1()).toEqual([2, 3, 4]);

        function* gen() {
            for (const v of values) {
                yield v;
            }
        }
        const { result: res2 } = renderIndexArray(gen, (n) => n() + 1);
        expect(res2()).toEqual([2, 3, 4]);
    });

    it("does not trigger with +/-0 or NaN", () => {
        const [rd, wt] = createSignal<any>([null, +0, -0, "4", [1, 2], NaN]);
        const mapper = vi.fn((v) => v?.toString());

        renderIndexArray(rd, (v) => {
            return createMemo(() => mapper(v()))();
        });
        mapper.mockClear();
        wt([undefined, -0, 0, 4, "1,2", NaN]);

        expect(mapper).toHaveBeenCalledTimes(3);
        expect(mapper.mock.calls).toEqual([[undefined], [4], ["1,2"]]);
    });

    it("accepts a custom equality operation", () => {
        type Values = { key?: string; k?: string; [o: string]: any }[];
        const [rd, wt] = createSignal<Values>([A, B, C]);
        const mapper = vi.fn((v) => v.key ?? v.k);

        renderIndexArray(
            rd,
            (v) => createMemo(() => mapper(v()))(),
            (a, b) => (a.key ?? a.k) === (b.key ?? b.k),
        );
        mapper.mockClear();
        wt([{ k: "a", f: 33 }, { k: "b" }, { key: "c", h: "x" }, { k: "d" }]);

        expect(mapper.mock.calls).toEqual([[{ k: "d" }]]);
    });

    it("does not track mapping function", () => {
        const [rd, wt] = createSignal<any>(1);
        const spy = vi.fn();

        renderHook(() => {
            const res = indexArray(
                () => [rd],
                (signal) => {
                    expect(getOwner()?.active).not.toBeTruthy();
                    spy(signal()());
                },
            );

            createComputed(() => spy(res()));
        });

        spy.mockReset();
        wt(2);

        expect(spy).not.toHaveBeenCalled();
    });

    it("accepts functions argument which return a function", () => {
        const [rd, wt] = createSignal([() => 1, () => 2]);
        const spy = vi.fn();
        renderIndexArray(rd, (v) => createMemo(() => spy(v()()))());

        expect(spy.mock.calls).toEqual([[1], [2]]);

        spy.mockReset();

        wt([() => 4, () => 5]);
        expect(spy.mock.calls).toEqual([[4], [5]]);
    });
});

describe("Reactivity", () => {
    function prepare() {
        const computed = vi.fn();
        const cleanup = vi.fn();
        const memo = vi.fn();

        const [list, setList] = createSignal([A, B, C, D]);

        const { result } = renderHook(() => {
            const res = indexArray(list, (v, i) => {
                createComputed((first) => {
                    computed(v(), i, first);
                    return false;
                }, true);
                onCleanup(() => cleanup(v(), i));
                return [v()];
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

        setList([D, A, C, B]);
        setList([D, A, C, B]);
        setList([C, D, E, F, G, H]); // changed
        setList([C, D, E, F]); // changed
        setList([C, D, E, F, G, H]); // changed
        setList([C, D, E, F, G, H]);
        setList([D, E, H, F, C, G]);

        // only change of size are accounted
        expect(memo).toHaveBeenCalledTimes(3);
        expect(computed).toHaveBeenCalledTimes(16);
        expect(cleanup).toHaveBeenCalledTimes(2);
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
            [E, 1, false],
            [F, 2, false],
            [B, 3, true],
            [G, 4, true],
            [C, 5, true],
        ]);
        expect(cleanup).not.toHaveBeenCalled();
        expect(memo).toHaveBeenCalledOnce();
        expect(res()).toEqual([[A], [B], [C], [B], [G], [C]]);
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
            [D, 3],
            [E, 4],
            [F, 5],
        ]);
        expect(memo).toHaveBeenCalledOnce();
        expect(res()).toEqual([[A], [B], [C]]);
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
        expect(memo).not.toHaveBeenCalled();
        expect(res()).toEqual([[A], [B], [C], [D]]);
    });

    it("shuffles & adds elements", () => {
        const [computed, cleanup, memo, res, setList] = prepare();
        reset(computed, cleanup, memo);

        setList([H, B, F, A, C, E]);

        expect(computed.mock.calls).toEqual([
            [H, 0, false],
            [F, 2, false],
            [A, 3, false],
            [C, 4, true],
            [E, 5, true],
        ]);
        expect(cleanup).not.toHaveBeenCalled();
        expect(memo).toHaveBeenCalledOnce();
        expect(res()).toEqual([[A], [B], [C], [D], [C], [E]]);
    });
});
