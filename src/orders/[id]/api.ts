import type { ApiRequest, ApiResponse } from '@incremental-code/last-router/server';
import { getOrder } from '../../lib/orders.js';
import { getAddress } from '../../lib/addresses.js';
import { requireSession, type PublicUser } from '../../lib/session.js';
import type { Order, Address } from '../../lib/db.js';

type Params = { id: string };
interface Body {
    user: PublicUser;
    order: Order | null;
    address: Address | null;
    head: { title: string };
}

/**
 * Order detail. Protected. Returns `order: null` (not a 404) when the order
 * doesn't exist or isn't owned by the session user, so the page can render
 * its own "not found" view inside the standard chrome. We never leak that
 * the order exists for a different user — the body is identical in both
 * cases.
 *
 * The shipping address may legitimately be missing (the user deleted it after
 * placing the order); `address: null` is expected.
 */
export default async function (
    req: ApiRequest<Params>,
    res: ApiResponse,
): Promise<Body> {
    const { user } = requireSession(req, res);
    const publicUser: PublicUser = { id: user.id, email: user.email };

    const order = getOrder(req.params.id);
    if (!order || order.userId !== user.id) {
        return {
            user: publicUser,
            order: null,
            address: null,
            head: { title: 'Order not found · last-commerce' },
        };
    }

    const address = getAddress(order.shippingAddressId) ?? null;
    return {
        user: publicUser,
        order,
        address,
        head: { title: `Order ${order.id} · last-commerce` },
    };
}
