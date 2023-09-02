import { vi } from "vitest";
import { ValueOrAccessor, h, onCleanup } from "../../core";

export default function MockComponent({ children, ...props }) {
    return () => <div {...props}>{children}</div>;
}

export function createMockComponent<T>(data: ValueOrAccessor<T>) {
    const mountSpy = vi.fn();
    const cleanupSpy = vi.fn();
    const Cmp = () => {
        mountSpy();
        onCleanup(cleanupSpy);
        return () => <h1>{data}</h1>;
    };
    return [Cmp, mountSpy, cleanupSpy] as const;
}
