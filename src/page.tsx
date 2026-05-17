import { createElement } from '@incremental-code/last-act';
import type { PageProps } from '@incremental-code/last-router/server';
import {
    Container,
    Grid,
    Heading,
    Stack,
    Card,
    Text,
    Price,
    Button,
    tokens,
} from '@incremental-code/last-ui';
import { Nav } from './lib/Nav.js';
import type { Product } from './lib/catalog.js';
import type { PublicUser } from './lib/session.js';
import { addToCart } from './lib/cart-store.js';
import { read } from './lib/body.js';

interface HomeBody {
    products: Product[];
    user: PublicUser | null;
}

export default function Home({ router, body }: PageProps<{}, HomeBody>) {
    const products = read(body.products);
    const user = read(body.user);
    return <Container>
        <Stack gap="xl">
            <Nav router={router} user={user} />
            <Stack gap="sm">
                <Heading level={1}>Goods for the desk</Heading>
                <Text muted>A tiny storefront built on last-server, last-ui, and a signal-backed cart.</Text>
            </Stack>
            <Grid minColumnWidth="240px" gap="lg">
                {products.map(product => <ProductTile product={product} router={router} />)}
            </Grid>
        </Stack>
    </Container>;
}

function ProductTile({ product, router }: { product: Product; router: { push(p: string): void } }) {
    return <Card>
        <Stack gap="md">
            <div attributes={{
                style: `font-size: 72px; text-align: center; padding: ${tokens.space.md} 0;`,
            }}>{product.emoji}</div>
            <Stack gap="xs">
                <Heading level={3}>{product.name}</Heading>
                <Text muted size="sm">{product.description}</Text>
            </Stack>
            <Price cents={product.priceCents} size="lg" />
            <Stack gap="sm">
                <Button variant="secondary" onClick={() => router.push('/products/' + product.id)}>
                    View details
                </Button>
                <Button onClick={() => addToCart(product)}>Add to cart</Button>
            </Stack>
        </Stack>
    </Card>;
}
