import { getCart, cartTotalCents } from '../lib/cart-store.js';
import type { CartLine } from '../lib/cart-store.js';
import { streamStocks } from '../lib/inventory.js';

type Body = { items: CartLine[]; totalCents: number; stocks: Record<string, number> };

export default async function* (): AsyncGenerator<Partial<Body>> {
    let first = true;
    for await (const stocks of streamStocks()) {
        if (first) {
            yield { items: getCart(), totalCents: cartTotalCents(), stocks };
            first = false;
        } else {
            yield { stocks };
        }
    }
}
