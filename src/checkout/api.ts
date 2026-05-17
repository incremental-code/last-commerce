import '../lib/seed.js';   // ensure demo user exists
import type { ApiRequest, ApiResponse } from '@incremental-code/last-router/server';
import { requireSession, type PublicUser } from '../lib/session.js';
import { cartSignal, getCart, cartTotalCents, type CartLine } from '../lib/cart-store.js';
import {
    listAddressesForUser,
    getAddress,
    ownedBy,
    createAddress,
    type NewAddress,
} from '../lib/addresses.js';
import type { Address, OrderLine } from '../lib/db.js';
import { isValidCardNumber, last4 } from '../lib/luhn.js';
import { placeOrder, SHIPPING_FLAT_CENTS } from '../lib/orders.js';

type In = {
    _action?: string;
    shippingAddressId?: string;
    // Inline new-address fields (only read when shippingAddressId === '__new__').
    newName?: string;
    newLine1?: string;
    newLine2?: string;
    newCity?: string;
    newRegion?: string;
    newPostcode?: string;
    newCountry?: string;
    // Payment fields.
    cardNumber?: string;
    cardName?: string;
    cardExpMonth?: string;
    cardExpYear?: string;
    cardCvc?: string;
};

interface Body {
    user: PublicUser;
    addresses: Address[];
    cartLines: CartLine[];
    subtotalCents: number;
    shippingCents: number;
    totalCents: number;
    shippingFlatCents: number;
    error: string | null;
    placedOrderId: string | null;
    head: { title: string };
}

function checkoutHead(placedOrderId: string | null): { title: string } {
    return {
        title: placedOrderId
            ? 'Order placed · last-commerce'
            : 'Checkout · last-commerce',
    };
}

/** Build the GET-style body snapshot (used as base for POST responses too). */
function buildBody(user: PublicUser, error: string | null, placedOrderId: string | null): Body {
    const cartLines = getCart();
    const subtotalCents = cartTotalCents();
    const hasItems = cartLines.length > 0;
    const shippingCents = hasItems ? SHIPPING_FLAT_CENTS : 0;
    return {
        user,
        addresses: listAddressesForUser(user.id),
        cartLines,
        subtotalCents,
        shippingCents,
        totalCents: subtotalCents + shippingCents,
        shippingFlatCents: SHIPPING_FLAT_CENTS,
        error,
        placedOrderId,
        head: checkoutHead(placedOrderId),
    };
}

/** Trim a field from req.body, returning '' for missing/non-string values. */
function field(input: In, key: keyof In): string {
    const v = input[key];
    return typeof v === 'string' ? v.trim() : '';
}

export default async function (
    req: ApiRequest<{}, {}, In>,
    res: ApiResponse,
): Promise<Body> {
    const { user } = requireSession(req, res);
    const publicUser: PublicUser = { id: user.id, email: user.email };

    if (req.method !== 'POST' || req.body?._action !== 'place') {
        return buildBody(publicUser, null, null);
    }

    // Re-read cart server-side; never trust client-submitted lines.
    const cartLines = getCart();
    if (cartLines.length === 0) {
        return buildBody(publicUser, 'Your cart is empty', null);
    }

    const input = req.body ?? {};
    const shippingAddressId = field(input, 'shippingAddressId');
    if (!shippingAddressId) {
        return buildBody(publicUser, 'Please choose a shipping address', null);
    }

    // Resolve / create the shipping address.
    let resolvedAddressId: string;
    if (shippingAddressId === '__new__') {
        const newAddress: NewAddress = {
            name: field(input, 'newName'),
            line1: field(input, 'newLine1'),
            line2: field(input, 'newLine2') || undefined,
            city: field(input, 'newCity'),
            region: field(input, 'newRegion'),
            postcode: field(input, 'newPostcode'),
            country: field(input, 'newCountry'),
        };
        if (!newAddress.name) return buildBody(publicUser, 'Recipient name is required', null);
        if (!newAddress.line1) return buildBody(publicUser, 'Street address is required', null);
        if (!newAddress.city) return buildBody(publicUser, 'City is required', null);
        if (!newAddress.region) return buildBody(publicUser, 'Region/state is required', null);
        if (!newAddress.postcode) return buildBody(publicUser, 'Postcode is required', null);
        if (!newAddress.country) return buildBody(publicUser, 'Country is required', null);
        const created = createAddress(user.id, newAddress);
        resolvedAddressId = created.id;
    } else {
        const existing = getAddress(shippingAddressId);
        if (!ownedBy(existing, user.id)) {
            return buildBody(publicUser, 'Selected address is not available', null);
        }
        resolvedAddressId = existing!.id;
    }

    // Payment validation.
    const cardNumber = field(input, 'cardNumber');
    const cardName = field(input, 'cardName');
    const cardExpMonth = field(input, 'cardExpMonth');
    const cardExpYear = field(input, 'cardExpYear');
    const cardCvc = field(input, 'cardCvc');

    if (!cardName) return buildBody(publicUser, 'Cardholder name is required', null);
    if (!isValidCardNumber(cardNumber)) {
        return buildBody(publicUser, 'Enter a valid card number', null);
    }

    const month = Number(cardExpMonth);
    const year = Number(cardExpYear);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        return buildBody(publicUser, 'Enter a valid expiry month', null);
    }
    if (!Number.isInteger(year) || year < 1970) {
        return buildBody(publicUser, 'Enter a valid expiry year', null);
    }
    // Expiry "valid through end of the given month" — compare to last instant of that month.
    const expiryEnd = new Date(year, month, 1).getTime();   // first ms of the month AFTER expiry
    if (expiryEnd <= Date.now()) {
        return buildBody(publicUser, 'Card has expired', null);
    }

    if (!/^\d{3,4}$/.test(cardCvc)) {
        return buildBody(publicUser, 'Enter a valid CVC', null);
    }

    // Snapshot cart into order lines.
    const orderLines: OrderLine[] = cartLines.map(line => ({
        productId: line.product.id,
        name: line.product.name,
        priceCents: line.product.priceCents,
        quantity: line.quantity,
        emoji: line.product.emoji,
    }));

    const order = placeOrder({
        userId: user.id,
        lines: orderLines,
        shippingAddressId: resolvedAddressId,
        paymentLast4: last4(cardNumber),
    });

    // Clear the server cart so the success view doesn't see stale items.
    cartSignal().set([]);

    // Return the body with placedOrderId set so the same render shows the
    // success view inline (no redirect — URL stays /checkout).
    return {
        user: publicUser,
        addresses: listAddressesForUser(user.id),
        cartLines: orderLines.map(l => ({
            // Reconstruct a CartLine-shaped snapshot from the order line so the
            // success view can render the same Product-ish fields.
            product: {
                id: l.productId,
                name: l.name,
                description: '',
                priceCents: l.priceCents,
                emoji: l.emoji,
            },
            quantity: l.quantity,
        })),
        subtotalCents: order.subtotalCents,
        shippingCents: order.shippingCents,
        totalCents: order.totalCents,
        shippingFlatCents: SHIPPING_FLAT_CENTS,
        error: null,
        placedOrderId: order.id,
        head: checkoutHead(order.id),
    };
}
