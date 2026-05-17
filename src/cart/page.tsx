import { createElement } from '@incremental-code/last-act';
import { Signal } from 'signal-polyfill';
import type { PageProps } from '@incremental-code/last-router/server';
import {
    Container,
    Stack,
    Row,
    Heading,
    Text,
    Card,
    Price,
    Button,
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

export default function Cart({ router }: PageProps) {
    const items = cartSignal();
    const total = cartTotalComputed();

    const content = new Signal.Computed(() => {
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
            {lines.map(line => <CartRow line={line} />)}
        </Stack>;
    });

    const summary = new Signal.Computed(() => {
        const cents = total.get();
        if (cents === 0) return null;
        return <Card>
            <Row justify="space-between" align="center">
                <Heading level={3}>Total</Heading>
                <Price cents={cents} size="lg" />
            </Row>
        </Card>;
    });

    return <Container>
        <Stack gap="xl">
            <Nav router={router} />
            <Heading level={1}>Your cart</Heading>
            {content}
            {summary}
        </Stack>
    </Container>;
}

function CartRow({ line }: { line: CartLine }) {
    const { product, quantity } = line;
    return <Card>
        <Row justify="space-between" align="center">
            <Row gap="md" align="center">
                <div attributes={{
                    style: `font-size: 48px; min-width: 64px; text-align: center;`,
                }}>{product.emoji}</div>
                <Stack gap="xs">
                    <Heading level={3}>{product.name}</Heading>
                    <Price cents={product.priceCents} size="sm" />
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
