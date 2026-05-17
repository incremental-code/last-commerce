import { createElement } from '@incremental-code/last-act';
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
import { Nav } from '../../lib/Nav.js';
import type { Product } from '../../lib/catalog.js';
import { addToCart } from '../../lib/cart-store.js';
import { read } from '../../lib/body.js';

interface DetailBody {
    product: Product | null;
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
                        <Price cents={product.priceCents} size="lg" />
                    </Stack>
                    <Text>{product.description}</Text>
                    <Row gap="sm">
                        <Button onClick={() => addToCart(product)}>Add to cart</Button>
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
