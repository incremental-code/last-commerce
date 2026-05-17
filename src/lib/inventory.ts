import { products } from './catalog.js';

const stocks = new Map<string, number>();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function seed(): void {
    if (stocks.size > 0) return;
    for (const p of products) {
        stocks.set(p.id, 5 + Math.floor(Math.random() * 25));
    }
}

function tick(): void {
    if (stocks.size === 0) return;
    let changed = false;
    for (const [id, current] of stocks) {
        if (Math.random() < 0.5) {
            const delta = Math.random() < 0.5 ? -1 : 1;
            stocks.set(id, Math.max(0, current + delta));
            changed = true;
        }
    }
    if (changed) {
        for (const fn of [...listeners]) fn();
    }
}

function ensureRunning(): void {
    seed();
    if (timer) return;
    timer = setInterval(tick, 1000);
}

export function getStocks(): Record<string, number> {
    ensureRunning();
    return Object.fromEntries(stocks);
}

export function getStock(id: string): number {
    ensureRunning();
    return stocks.get(id) ?? 0;
}

/**
 * Async generator that yields the full stock map once, then yields the new
 * map every time inventory changes. Cleans up its listener on iterator
 * return / throw, so callers (and last-router's SSR drain) can close it.
 */
export async function* streamStocks(): AsyncGenerator<Record<string, number>> {
    ensureRunning();
    yield getStocks();

    let resolve: (() => void) | null = null;
    const listener = () => {
        const r = resolve;
        resolve = null;
        if (r) r();
    };

    try {
        while (true) {
            await new Promise<void>(r => {
                resolve = r;
                listeners.add(listener);
            });
            listeners.delete(listener);
            yield getStocks();
        }
    } finally {
        listeners.delete(listener);
    }
}
