/** Nested type */
export type Nested<T> = T[] | Nested<T>[];

/**
 * Flatten childrens (developers may return an array containing nested arrays
 * and expect them to be flatten out in the rendering phase).
 */
export function flatten<T>(nestedChildren: Nested<T>) {
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

enum LOG_LEVEL {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    LOG = 3,
    DEBUG = 4,
}

const DEFAULT_LOG_LEVELS = {
    dom: LOG_LEVEL.INFO,
};

function logMessage(level: LOG_LEVEL, maxLogLevel: LOG_LEVEL) {
    return (...args) => {
        if (level <= maxLogLevel) {
            console[LOG_LEVEL[level].toLowerCase()](...args);
        }
    };
}

export function createLogger(scope: keyof typeof DEFAULT_LOG_LEVELS) {
    const logLevel = DEFAULT_LOG_LEVELS[scope];
    return {
        error: logMessage(LOG_LEVEL.ERROR, logLevel),
        warn: logMessage(LOG_LEVEL.WARN, logLevel),
        info: logMessage(LOG_LEVEL.INFO, logLevel),
        log: logMessage(LOG_LEVEL.LOG, logLevel),
        debug: logMessage(LOG_LEVEL.DEBUG, logLevel),
    };
}
