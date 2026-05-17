import { createElement, computed } from '@incremental-code/last-act';
import type { PageProps } from '@incremental-code/last-router/server';
import {
    Container,
    Stack,
    Row,
    Heading,
    Text,
    Card,
    Badge,
    Price,
    Button,
    Show,
    tokens,
} from '@incremental-code/last-ui';
import { Nav } from '../lib/Nav.js';
import {
    cartSignal,
    removeFromCart,
    setQuantity,
    cartTotalComputed,
} from '../lib/cart-store.js';
import type { CartLine } from '../lib/cart-store.js';
import type { PublicUser } from '../lib/session.js';
import { read } from '../lib/body.js';

interface CartBody {
    items: CartLine[];
    totalCents: number;
    stocks: Record<string, number>;
    user: PublicUser | null;
}

export default function Cart({ router, body }: PageProps<{}, CartBody>) {
    const items = cartSignal();
    const total = cartTotalComputed();
    const stocks = body.stocks;
    const user = read(body.user);

    const content = computed(() => {
        const lines = items.get();
        if (lines.length === 0) {
            return <Card>
                <Stack gap="md" align="center">
                    <Text muted>Your cart is empty.</Text>
                    <Button onClick={() => router.push('/')}>Go shopping</Button>
                </Stack>
            </Card>;
        }

        return <Stack gap="md">
            {lines.map(line => <CartRow line={line} stocks={stocks} />)}
        </Stack>;
    });

    const summary = (
        <Show when={total}>
            {cents => <Card>
                <Row justify="space-between" align="center">
                    <Heading level={3}>Total</Heading>
                    <Price cents={cents} size="lg" />
                </Row>
            </Card>}
        </Show>
    );

    return <Container>
        <Stack gap="xl">
            <Nav router={router} user={user} />
            <Heading level={1}>Your cart</Heading>
            {content}
            {summary}
        </Stack>
    </Container>;
}

interface CartRowProps {
    line: CartLine;
    stocks: { get(): Record<string, number> };
}

function CartRow({ line, stocks }: CartRowProps) {
    const { product, quantity } = line;

    const stockBadge = computed(() => {
        const n = stocks.get()[product.id] ?? 0;
        if (n === 0) return <Badge variant="danger">Out of stock</Badge>;
        if (n < quantity) return <Badge variant="danger">Only {String(n)} left</Badge>;
        if (n <= 5) return <Badge variant="accent">{String(n)} in stock</Badge>;
        return <Badge>{String(n)} in stock</Badge>;
    });

    return <Card>
        <Row justify="space-between" align="center">
            <Row gap="md" align="center">
                <div attributes={{
                    style: `font-size: 48px; min-width: 64px; text-align: center;`,
                }}>{product.emoji}</div>
                <Stack gap="xs">
                    <Heading level={3}>{product.name}</Heading>
                    <Row gap="sm" align="center">
                        <Price cents={product.priceCents} size="sm" />
                        {stockBadge}
                    </Row>
                </Stack>
            </Row>
            <Row gap="sm" align="center">
                <Button
                    variant="secondary"
                    onClick={() => setQuantity(product.id, quantity - 1)}
                >-</Button>
                <span attributes={{
                    style: `min-width: 32px; text-align: center; font-weight: 600; color: ${tokens.color.text};`,
                }}>{quantity}</span>
                <Button
                    variant="secondary"
                    onClick={() => setQuantity(product.id, quantity + 1)}
                >+</Button>
                <Button variant="danger" onClick={() => removeFromCart(product.id)}>Remove</Button>
            </Row>
        </Row>
    </Card>;
}
