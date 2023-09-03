import { Mock, vi } from "vitest";

export type WaitableMock<Args extends any[] = any, R = any> = Mock<Args, R> & {
    waitToHaveBeenCalledTimes: (times: number) => Promise<unknown>;
    waitToHaveBeenCalled: () => Promise<unknown>;
};

export function createWaitableMock<Args extends any[] = any, R = any>() {
    let resolve;
    let times;
    let calledCount = 0;
    const mock = vi.fn() as WaitableMock<Args, R>;

    mock.mockImplementation((() => {
        calledCount += 1;
        if (resolve && calledCount >= times) {
            resolve();
        }
    }) as (...args: Args) => R);

    mock.waitToHaveBeenCalledTimes = (times_) => {
        times = times_;
        if (calledCount >= times) {
            return Promise.resolve();
        } else {
            return new Promise((r) => {
                resolve = r;
            });
        }
    };

    mock.waitToHaveBeenCalled = () => {
        return mock.waitToHaveBeenCalledTimes(1);
    };

    return mock;
}

export function createSideEffectSpy() {
    const spy = vi.fn();
    const beforeActionListeners = new Set<() => void>();
    const afterActionListeners = new Set<() => void>();

    const act = function act<T>(actionWithSideEffect: () => T) {
        beforeActionListeners.forEach((l) => l());
        const r = actionWithSideEffect();
        afterActionListeners.forEach((l) => l());
        return r;
    };

    act.beforeEach = function beforeEachAction(listener: () => void) {
        beforeActionListeners.add(listener);
    };

    act.afterEach = function afterEachAction(listener: () => void) {
        afterActionListeners.add(listener);
    };

    return [spy, act] as const;
}
