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
    Badge,
    Price,
    Button,
    tokens,
} from '@incremental-code/last-ui';
import { Nav } from '../../lib/Nav.js';
import type { Product } from '../../lib/catalog.js';
import { addToCart } from '../../lib/cart-store.js';
import { read } from '../../lib/body.js';

interface DetailBody {
    product: Product | null;
    stock: number;
}

export default function ProductDetail({ router, body }: PageProps<{ id: string }, DetailBody>) {
    const product = read(body.product);
    if (!product) {
        return <Container>
            <Stack gap="lg">
                <Nav router={router} />
                <Heading level={1}>Product not found</Heading>
                <Button onClick={() => router.push('/')}>Back to shop</Button>
            </Stack>
        </Container>;
    }

    const stockBadge = new Signal.Computed(() => {
        const n = body.stock.get();
        if (n === 0) return <Badge variant="danger">Out of stock</Badge>;
        if (n <= 3) return <Badge variant="danger">Only {String(n)} left</Badge>;
        if (n <= 10) return <Badge variant="accent">{String(n)} in stock</Badge>;
        return <Badge>{String(n)} in stock</Badge>;
    });

    const addDisabled = new Signal.Computed(() => body.stock.get() === 0);
    const addButton = new Signal.Computed(() => (
        <Button onClick={() => addToCart(product)} disabled={addDisabled.get()}>
            {body.stock.get() === 0 ? 'Sold out' : 'Add to cart'}
        </Button>
    ));

    return <Container>
        <Stack gap="xl">
            <Nav router={router} />
            <Row gap="xl" align="start">
                <Card padding="48px">
                    <div attributes={{
                        style: `font-size: 160px; text-align: center; min-width: 240px;`,
                    }}>{product.emoji}</div>
                </Card>
                <Stack gap="lg">
                    <Stack gap="sm">
                        <Heading level={1}>{product.name}</Heading>
                        <Row gap="sm" align="center">
                            <Price cents={product.priceCents} size="lg" />
                            {stockBadge}
                        </Row>
                    </Stack>
                    <Text>{product.description}</Text>
                    <Row gap="sm">
                        {addButton}
                        <Button variant="secondary" onClick={() => router.push('/')}>Back</Button>
                    </Row>
                    <Text muted size="sm">
                        <span attributes={{ style: `color: ${tokens.color.muted};` }}>
                            ID: {product.id}
                        </span>
                    </Text>
                </Stack>
            </Row>
        </Stack>
    </Container>;
}
