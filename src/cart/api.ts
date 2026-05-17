import type { ApiRequest } from '@incremental-code/last-router/server';
import { getCart, cartTotalCents } from '../lib/cart-store.js';
import type { CartLine } from '../lib/cart-store.js';
import { readPublicUser, type PublicUser } from '../lib/session.js';
import { streamStocks } from '../lib/inventory.js';

type Body = {
    items: CartLine[];
    totalCents: number;
    stocks: Record<string, number>;
    user: PublicUser | null;
    head: { title: string };
};

export default async function* (req: ApiRequest): AsyncGenerator<Partial<Body>> {
    const user = readPublicUser(req);
    let first = true;
    for await (const stocks of streamStocks()) {
        if (first) {
            yield {
                items: getCart(),
                totalCents: cartTotalCents(),
                stocks,
                user,
                head: { title: 'Cart · last-commerce' },
            };
            first = false;
        } else {
            yield { stocks };
        }
    }
}
