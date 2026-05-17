import { getCart, cartTotalCents } from '../lib/cart-store.js';
import type { CartLine } from '../lib/cart-store.js';

export default function (): { items: CartLine[]; totalCents: number } {
    return { items: getCart(), totalCents: cartTotalCents() };
}
