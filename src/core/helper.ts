import { ValueOrAccessor } from "./types";

/** Nested type */
export type Nested<T> = (T | Nested<T>)[];

/**
 * Flatten children (developers may return an array containing nested arrays
 * and expect them to be flatten out in the rendering phase).
 */
export function flatten<T>(nestedChildren: Nested<T>): T[] {
    const children: T[] = [];
    for (const c of nestedChildren) {
        if (Array.isArray(c)) {
            children.push(...flatten(c));
        } else {
            children.push(c);
        }
    }
    return children;
}

/**
 * Performs a SameValueZero comparison between two values to determine if they
 * are equivalent.
 *
 * The only difference between SameValueZero & === equalities is how they treat
 * NaN. With SameValueZero, NaN are considered equivalent, while they are not
 * with === equality.
 *
 * @see http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero
 *
 * @param value the value to compare
 * @param other the other value to compare
 * @returns true if the two values are equivalent, false otherwise
 */
export function sameValueZero<T>(value: T, other: T): boolean {
    // Uses the fact that NaN is the only value which is not equal to itself
    return value === other || (Number.isNaN(value) && Number.isNaN(other));
}

export function shallowArrayEqual<T>(first: T[], second: T[]): boolean {
    return (
        first === second ||
        (first.length === second.length && first.every((v, i) => sameValueZero(v, second[i])))
    );
}

export function toArray<T>(v: T | T[] | null | undefined): T[] {
    if (v == null) {
        return [];
    } else if (Array.isArray(v)) {
        return v;
    } else {
        return [v];
    }
}

export function toValue<T>(target: ValueOrAccessor<T>): T {
    return typeof target === "function" ? (target as () => T)() : target;
}

export enum LOG_LEVEL {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    LOG = 3,
    DEBUG = 4,
}

const DEFAULT_LOG_LEVELS = {
    dom: LOG_LEVEL.INFO,
    children: LOG_LEVEL.INFO,
    clock: LOG_LEVEL.INFO,
};

function logMessage(level: LOG_LEVEL, maxLogLevel: LOG_LEVEL): (...args: any[]) => void {
    return (...args) => {
        if (level <= maxLogLevel) {
            (console as any)[LOG_LEVEL[level].toLowerCase()](...args);
        }
    };
}

export type Logger = { [P in Lowercase<keyof typeof LOG_LEVEL>]: (...args: any[]) => void };

export function createLogger(scope: keyof typeof DEFAULT_LOG_LEVELS): Logger {
    const logLevel = DEFAULT_LOG_LEVELS[scope];
    return {
        error: logMessage(LOG_LEVEL.ERROR, logLevel),
        warn: logMessage(LOG_LEVEL.WARN, logLevel),
        info: logMessage(LOG_LEVEL.INFO, logLevel),
        log: logMessage(LOG_LEVEL.LOG, logLevel),
        debug: logMessage(LOG_LEVEL.DEBUG, logLevel),
    };
}
