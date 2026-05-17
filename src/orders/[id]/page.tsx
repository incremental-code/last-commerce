import { createElement } from '@incremental-code/last-act';
import type { PageProps } from '@incremental-code/last-router/server';
import {
    Container,
    Stack,
    Row,
    Heading,
    Text,
    Card,
    Button,
    Price,
    tokens,
} from '@incremental-code/last-ui';
import { Nav } from '../../lib/Nav.js';
import { read } from '../../lib/body.js';
import type { Order, Address } from '../../lib/db.js';
import type { PublicUser } from '../../lib/session.js';

interface DetailBody {
    user: PublicUser;
    order: Order | null;
    address: Address | null;
}

/**
 * Order detail — shows meta, shipping address, line items and totals. The
 * "not found" branch handles both genuinely-missing orders and orders that
 * belong to someone else (the api returns `order: null` in both cases — we
 * never want to leak existence).
 */
export default function OrderDetailPage({ router, body }: PageProps<{ id: string }, DetailBody>) {
    const user = read(body.user);
    const order = read(body.order);
    const address = read(body.address);

    if (!order) {
        return <Container>
            <Stack gap="xl">
                <Nav router={router} user={user} />
                <Card>
                    <Stack gap="md" align="center">
                        <Heading level={2}>Order not found</Heading>
                        <Text muted>This order doesn't exist or isn't on your account.</Text>
                        <Button onClick={() => router.push('/orders')}>Back to orders</Button>
                    </Stack>
                </Card>
            </Stack>
        </Container>;
    }

    return <Container>
        <Stack gap="xl">
            <Nav router={router} user={user} />
            <Stack gap="lg">
                <Stack gap="xs">
                    <Heading level={1}>
                        Order <code attributes={{
                            style: `font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: ${tokens.font.lg};`,
                        }}>{order.id}</code>
                    </Heading>
                    <MetaRow order={order} />
                </Stack>
                <Row gap="lg" align="start">
                    <Stack gap="lg">
                        <ShippingCard address={address} />
                        <LineItemsCard order={order} />
                    </Stack>
                    <TotalsCard order={order} />
                </Row>
                <Row gap="sm">
                    <Button variant="secondary" onClick={() => router.push('/orders')}>Back to orders</Button>
                </Row>
            </Stack>
        </Stack>
    </Container>;
}

function MetaRow({ order }: { order: Order }) {
    const placed = new Date(order.placedAt).toLocaleString();
    return <Row gap="md" align="center">
        <Text muted size="sm">Placed {placed}</Text>
        <Text muted size="sm">·</Text>
        <Text muted size="sm">Payment •••• {order.paymentLast4}</Text>
    </Row>;
}

function ShippingCard({ address }: { address: Address | null }) {
    return <Card>
        <Stack gap="sm">
            <Heading level={3}>Shipping address</Heading>
            {address
                ? <Stack gap="xs">
                    <Text>{address.name}</Text>
                    <Text muted size="sm">{address.line1}</Text>
                    {address.line2 !== undefined
                        ? <Text muted size="sm">{address.line2}</Text>
                        : null}
                    <Text muted size="sm">{address.city}, {address.region} {address.postcode}</Text>
                    <Text muted size="sm">{address.country}</Text>
                </Stack>
                : <Text muted size="sm">Address no longer on file</Text>}
        </Stack>
    </Card>;
}

function LineItemsCard({ order }: { order: Order }) {
    // A plain native table — no pagination / sort needed for snapshotted
    // order lines. Borders + padding hand-tuned to match the `<Table>`
    // component's visual weight.
    const cellStyle = `padding: ${tokens.space.sm} ${tokens.space.md}; border-bottom: 1px solid ${tokens.color.border}; vertical-align: middle;`;
    const headerStyle = `padding: ${tokens.space.sm} ${tokens.space.md}; border-bottom: 1px solid ${tokens.color.border}; text-align: left; font-size: ${tokens.font.sm}; color: ${tokens.color.muted}; font-weight: 600;`;
    const headerRightStyle = headerStyle + ' text-align: right;';
    const cellRightStyle = cellStyle + ' text-align: right;';

    return <Card>
        <Stack gap="sm">
            <Heading level={3}>Items</Heading>
            <table attributes={{ style: `width: 100%; border-collapse: collapse; font-family: ${tokens.font.family};` }}>
                <thead>
                    <tr>
                        <th attributes={{ style: headerStyle }}>Item</th>
                        <th attributes={{ style: headerRightStyle }}>Qty</th>
                        <th attributes={{ style: headerRightStyle }}>Line total</th>
                    </tr>
                </thead>
                <tbody>
                    {order.lines.map(line => <tr key={line.productId}>
                        <td attributes={{ style: cellStyle }}>
                            <Row gap="sm" align="center">
                                <span attributes={{ style: `font-size: 24px;` }}>{line.emoji}</span>
                                <Text>{line.name}</Text>
                            </Row>
                        </td>
                        <td attributes={{ style: cellRightStyle }}>{String(line.quantity)}</td>
                        <td attributes={{ style: cellRightStyle }}>
                            <Price cents={line.priceCents * line.quantity} size="sm" />
                        </td>
                    </tr>)}
                </tbody>
            </table>
        </Stack>
    </Card>;
}

function TotalsCard({ order }: { order: Order }) {
    const totalRowStyle = `border-top: 1px solid ${tokens.color.border}; padding-top: ${tokens.space.sm};`;
    return <Card>
        <Stack gap="sm">
            <Heading level={3}>Totals</Heading>
            <Row justify="space-between" align="center">
                <Text muted>Subtotal</Text>
                <Price cents={order.subtotalCents} size="sm" />
            </Row>
            <Row justify="space-between" align="center">
                <Text muted>Shipping</Text>
                <Price cents={order.shippingCents} size="sm" />
            </Row>
            <div attributes={{ style: totalRowStyle }}>
                <Row justify="space-between" align="center">
                    <Heading level={3}>Total</Heading>
                    <Price cents={order.totalCents} size="lg" />
                </Row>
            </div>
        </Stack>
    </Card>;
}
