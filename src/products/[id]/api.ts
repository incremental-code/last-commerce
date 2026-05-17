import type { ApiRequest } from '@incremental-code/last-router/server';
import { getProduct } from '../../lib/catalog.js';
import type { Product } from '../../lib/catalog.js';
import { readPublicUser, type PublicUser } from '../../lib/session.js';
import { streamStocks } from '../../lib/inventory.js';

type Params = { id: string };
type Body = {
    product: Product | null;
    stock: number;
    user: PublicUser | null;
    head: { title: string };
};

export default async function* (req: ApiRequest<Params>): AsyncGenerator<Partial<Body>> {
    const product = getProduct(req.params.id) ?? null;
    const user = readPublicUser(req);
    let first = true;
    let last = -1;

    for await (const stocks of streamStocks()) {
        const stock = stocks[req.params.id] ?? 0;
        if (first) {
            const title = product ? `${product.name} · last-commerce` : 'Product · last-commerce';
            yield { product, stock, user, head: { title } };
            first = false;
            last = stock;
        } else if (stock !== last) {
            yield { stock };
            last = stock;
        }
    }
}
