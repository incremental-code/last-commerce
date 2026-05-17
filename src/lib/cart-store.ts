import { Signal } from 'signal-polyfill';
import type { Product } from './catalog.js';

export interface CartLine {
    product: Product;
    quantity: number;
}

const cart = new Signal.State<CartLine[]>([]);

export function cartSignal(): Signal.State<CartLine[]> {
    return cart;
}

export function getCart(): CartLine[] {
    return cart.get();
}

export function addToCart(product: Product, quantity = 1): void {
    const current = cart.get();
    const existing = current.find(line => line.product.id === product.id);
    if (existing) {
        cart.set(current.map(line =>
            line.product.id === product.id
                ? { ...line, quantity: line.quantity + quantity }
                : line,
        ));
    } else {
        cart.set([...current, { product, quantity }]);
    }
}

export function setQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    cart.set(cart.get().map(line =>
        line.product.id === productId ? { ...line, quantity } : line,
    ));
}

export function removeFromCart(productId: string): void {
    cart.set(cart.get().filter(line => line.product.id !== productId));
}

export function cartCount(): number {
    return cart.get().reduce((sum, line) => sum + line.quantity, 0);
}

export function cartTotalCents(): number {
    return cart.get().reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0);
}

export function cartCountComputed(): Signal.Computed<number> {
    return new Signal.Computed(() => cartCount());
}

export function cartTotalComputed(): Signal.Computed<number> {
    return new Signal.Computed(() => cartTotalCents());
}
