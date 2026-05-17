import { createElement, signal, effect } from '@incremental-code/last-act';
import type { PageProps } from '@incremental-code/last-router/server';
import {
    Container,
    Stack,
    Heading,
    Text,
    Card,
    Button,
    Table,
    tokens,
    type SortState,
    type TableColumn,
} from '@incremental-code/last-ui';
import { Nav } from '../lib/Nav.js';
import { read } from '../lib/body.js';
import type { PublicUser } from '../lib/session.js';
import type { OrderRow } from './api.js';

interface OrdersBody {
    user: PublicUser;
    rows: OrderRow[];
    total: number;
    page: number;
    pageSize: number;
    sort: { columnId: string; direction: 'asc' | 'desc' };
}

/**
 * Past orders — paginated `<Table>` with server-side pagination + sort. The
 * `<Table>` writes new values into `page` / `sort` signals; we mirror those
 * back into the URL so the api re-runs and the body refreshes.
 *
 * Two effects coordinate to keep the URL and the body in sync without
 * looping:
 *  - URL-writer: watches the local `page`/`sort` signals and pushes a new URL
 *    whenever the user clicks a header or pager button.
 *  - Body-reader: watches the body's `page`/`sort` signals (which change on
 *    back/forward nav or when the api returns a corrected value) and writes
 *    the new values into the local signals.
 *
 * Both effects use a `mounted` guard to skip the initial run — otherwise the
 * URL-writer would `router.push` on first render, and the body-reader would
 * write a redundant value into the local signals that would re-fire the
 * URL-writer.
 */
export default function OrdersPage({ router, body }: PageProps<{}, OrdersBody>) {
    const user = read(body.user);
    const initialSort = read(body.sort);
    const initialPage = read(body.page);

    const page = signal(initialPage);
    const sort = signal<SortState | null>(initialSort);

    // ---- URL-writer effect ----
    // `effect` runs once eagerly on registration. We use a flag to skip that
    // initial fire (otherwise the very first render would `router.push` and
    // throw a Redirect server-side). The `typeof window` gate is a second
    // belt-and-braces guard: `router.push` server-side throws — we never want
    // that to happen for a same-state push triggered by the body-reader
    // effect below.
    let mountedWriter = false;
    effect(() => {
        const p = page.get();
        const s = sort.get();
        if (!mountedWriter) {
            mountedWriter = true;
            return;
        }
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams();
        if (p !== 1) params.set('page', String(p));
        if (s && !(s.columnId === 'placedAt' && s.direction === 'desc')) {
            params.set('sort', `${s.columnId}:${s.direction}`);
        }
        const qs = params.toString();
        const next = '/orders' + (qs ? '?' + qs : '');
        router.push(next);
    });

    // ---- Body-reader effect ----
    // When the body's `page`/`sort` change (e.g. back/forward nav, or the api
    // corrected an out-of-range page), mirror the value back into our local
    // signals. Guard against same-value writes to avoid re-triggering the
    // URL-writer effect above into a loop.
    let mountedReader = false;
    effect(() => {
        const bodyPage = body.page.get();
        const bodySort = body.sort.get();
        if (!mountedReader) {
            mountedReader = true;
            return;
        }
        if (page.get() !== bodyPage) page.set(bodyPage);
        const current = sort.get();
        if (!sameSort(current, bodySort)) sort.set(bodySort);
    });

    const columns = makeColumns();
    const rowsSignal = body.rows;
    const totalSignal = body.total;

    return <Container>
        <Stack gap="xl">
            <Nav router={router} user={user} />
            <Heading level={1}>Past orders</Heading>
            {read(body.total) === 0
                ? <Card>
                    <Stack gap="md" align="center">
                        <Text muted>You haven't placed any orders yet.</Text>
                        <Button onClick={() => { window.location.href = '/'; }}>Start shopping</Button>
                    </Stack>
                </Card>
                : <Table<OrderRow>
                    columns={columns}
                    rows={rowsSignal}
                    total={totalSignal}
                    page={page}
                    pageSize={read(body.pageSize)}
                    sort={sort}
                    rowKey={(row) => row.id}
                    onRowClick={(row) => router.push('/orders/' + row.id)}
                />}
        </Stack>
    </Container>;
}

function sameSort(a: SortState | null, b: { columnId: string; direction: 'asc' | 'desc' } | null): boolean {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    return a.columnId === b.columnId && a.direction === b.direction;
}

function makeColumns(): TableColumn<OrderRow>[] {
    return [
        {
            id: 'id',
            header: 'Order',
            sortable: true,
            cell: (row) => {
                const short = row.id.length > 8 ? '…' + row.id.slice(-8) : row.id;
                return createElement('span', {
                    attributes: {
                        style: `font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: ${tokens.font.sm}; color: ${tokens.color.text};`,
                    },
                }, short);
            },
        },
        {
            id: 'placedAt',
            header: 'Placed',
            sortable: true,
            cell: (row) => new Date(row.placedAt).toLocaleString(),
        },
        {
            id: 'lineCount',
            header: 'Items',
            sortable: true,
            align: 'right',
            cell: (row) => `${row.lineCount} item${row.lineCount === 1 ? '' : 's'}`,
        },
        {
            id: 'totalCents',
            header: 'Total',
            sortable: true,
            align: 'right',
            cell: (row) => '$' + (row.totalCents / 100).toFixed(2),
        },
        {
            id: 'summary',
            header: 'Summary',
            cell: (row) => row.summary.length > 60
                ? row.summary.slice(0, 57) + '…'
                : row.summary,
        },
    ];
}
