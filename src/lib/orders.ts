import { orders, newId, type Order, type OrderLine } from './db.js';

/** Flat shipping fee applied to every order, in cents. */
export const SHIPPING_FLAT_CENTS = 500;

export interface PlaceOrderInput {
    userId: string;
    lines: OrderLine[];
    shippingAddressId: string;
    paymentLast4: string;
}

/**
 * Computes subtotal/shipping/total from the snapshotted lines, inserts the
 * order into the in-memory `orders` Map, and returns the inserted record.
 */
export function placeOrder(input: PlaceOrderInput): Order {
    const subtotalCents = input.lines.reduce(
        (sum, line) => sum + line.priceCents * line.quantity,
        0,
    );
    const shippingCents = SHIPPING_FLAT_CENTS;
    const totalCents = subtotalCents + shippingCents;

    const order: Order = {
        id: newId('ord'),
        userId: input.userId,
        placedAt: Date.now(),
        lines: input.lines,
        shippingAddressId: input.shippingAddressId,
        subtotalCents,
        shippingCents,
        totalCents,
        paymentLast4: input.paymentLast4,
    };
    orders.set(order.id, order);
    return order;
}

/** All orders for a user, sorted newest first. */
export function listOrdersForUser(userId: string): Order[] {
    const mine: Order[] = [];
    for (const order of orders.values()) {
        if (order.userId === userId) mine.push(order);
    }
    mine.sort((a, b) => b.placedAt - a.placedAt);
    return mine;
}

export function getOrder(id: string): Order | undefined {
    return orders.get(id);
}
