import type { ApiRequest, ApiResponse } from '@incremental-code/last-router/server';
import { listOrdersForUser } from '../lib/orders.js';
import { requireSession, type PublicUser } from '../lib/session.js';
import type { Order } from '../lib/db.js';

type Query = {
    page?: string;
    sort?: string;
};

export interface OrderRow {
    id: string;
    placedAt: number;
    totalCents: number;
    lineCount: number;
    /** e.g. "🍞 Bread + 2 more" — first product, then any others as a count. */
    summary: string;
}

interface Body {
    user: PublicUser;
    rows: OrderRow[];
    total: number;
    page: number;
    pageSize: number;
    sort: { columnId: string; direction: 'asc' | 'desc' };
    head: { title: string };
}

const PAGE_SIZE = 10;
const SORTABLE_COLUMNS = new Set(['id', 'placedAt', 'totalCents', 'lineCount']);
const DEFAULT_SORT = { columnId: 'placedAt', direction: 'desc' as const };

/**
 * Past orders list. Protected. Supports `?page=` (1-indexed) and
 * `?sort=columnId:direction`. Any unknown / malformed column falls back to the
 * default (placedAt desc) — we never 400 on bad query strings, since they're
 * always built from the UI's signals and a stale URL shouldn't break the page.
 */
export default async function (
    req: ApiRequest<{}, Query>,
    res: ApiResponse,
): Promise<Body> {
    const { user } = requireSession(req, res);

    const page = parsePage(req.query.page);
    const sort = parseSort(req.query.sort);

    const orders = listOrdersForUser(user.id);   // newest first by default
    const sorted = applySort(orders, sort);

    const start = (page - 1) * PAGE_SIZE;
    const pageOrders = sorted.slice(start, start + PAGE_SIZE);
    const rows = pageOrders.map(toRow);

    return {
        user: { id: user.id, email: user.email },
        rows,
        total: orders.length,
        page,
        pageSize: PAGE_SIZE,
        sort,
        head: { title: 'Orders · last-commerce' },
    };
}

function parsePage(raw: string | undefined): number {
    if (!raw) return 1;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1) return 1;
    return n;
}

function parseSort(raw: string | undefined): { columnId: string; direction: 'asc' | 'desc' } {
    if (!raw) return DEFAULT_SORT;
    const idx = raw.indexOf(':');
    if (idx < 0) return DEFAULT_SORT;
    const columnId = raw.slice(0, idx);
    const direction = raw.slice(idx + 1);
    if (!SORTABLE_COLUMNS.has(columnId)) return DEFAULT_SORT;
    if (direction !== 'asc' && direction !== 'desc') return DEFAULT_SORT;
    return { columnId, direction };
}

function lineCount(order: Order): number {
    return order.lines.reduce((sum, line) => sum + line.quantity, 0);
}

function applySort(
    orders: Order[],
    sort: { columnId: string; direction: 'asc' | 'desc' },
): Order[] {
    // `listOrdersForUser` already returns placedAt desc — skip the resort when
    // that's also what was requested to keep allocations / churn minimal.
    if (sort.columnId === 'placedAt' && sort.direction === 'desc') return orders;

    const sign = sort.direction === 'asc' ? 1 : -1;
    const copy = orders.slice();
    copy.sort((a, b) => {
        switch (sort.columnId) {
            case 'id':
                return a.id < b.id ? -sign : a.id > b.id ? sign : 0;
            case 'placedAt':
                return (a.placedAt - b.placedAt) * sign;
            case 'totalCents':
                return (a.totalCents - b.totalCents) * sign;
            case 'lineCount':
                return (lineCount(a) - lineCount(b)) * sign;
            default:
                return 0;
        }
    });
    return copy;
}

function toRow(order: Order): OrderRow {
    const first = order.lines[0];
    const remaining = order.lines.length - 1;
    const summary = first
        ? remaining > 0
            ? `${first.emoji} ${first.name} + ${remaining} more`
            : `${first.emoji} ${first.name}`
        : '(empty order)';
    return {
        id: order.id,
        placedAt: order.placedAt,
        totalCents: order.totalCents,
        lineCount: lineCount(order),
        summary,
    };
}
