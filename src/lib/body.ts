/**
 * Read a body value that may be a plain value (server / SSR) or a
 * Signal.State wrapping the value (client hydration / navigation).
 *
 * last-router serves the api result as plain JS server-side, then wraps each
 * top-level body field in Signal.State on the client so streamed yields can
 * update reactively. Pages that iterate or destructure body values need the
 * underlying value either way.
 */
export function read<T>(value: T | { get(): T }): T {
    if (value && typeof value === 'object' && typeof (value as { get?: unknown }).get === 'function') {
        return (value as { get(): T }).get();
    }
    return value as T;
}
