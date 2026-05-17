import type { ApiRequest, ApiResponse } from '@incremental-code/last-router/server';
import {
    createAddress,
    deleteAddress,
    getAddress,
    listAddressesForUser,
    ownedBy,
    updateAddress,
    type NewAddress,
} from '../../lib/addresses.js';
import type { Address } from '../../lib/db.js';
import { requireSession, readPublicUser, type PublicUser } from '../../lib/session.js';

type In = {
    _action?: string;
    id?: string;
    label?: string;
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    region?: string;
    postcode?: string;
    country?: string;
};

type Body = {
    user: PublicUser;
    addresses: Address[];
    error: string | null;
    head: { title: string };
};

const HEAD = { title: 'Addresses · last-commerce' };

/**
 * Address book — GET lists addresses, POST dispatches on `_action`
 * (`create` | `update` | `delete`). On any successful mutation we redirect
 * back to `/account/addresses` so a refresh doesn't re-submit the form.
 *
 * `requireSession` 302s to /signin when there's no session, so we only need
 * to assert ownership for update/delete (never trust a client-supplied id).
 */
export default async function (
    req: ApiRequest<{}, {}, In>,
    res: ApiResponse,
): Promise<Body> {
    const { user } = requireSession(req, res);

    if (req.method === 'POST') {
        const action = typeof req.body?._action === 'string' ? req.body._action : '';

        if (action === 'delete') {
            const id = typeof req.body?.id === 'string' ? req.body.id : '';
            const existing = id ? getAddress(id) : undefined;
            if (!ownedBy(existing, user.id)) {
                return errorBody(user, 'Address not found');
            }
            deleteAddress(id);
            res.redirect('/account/addresses');
        }

        if (action === 'create' || action === 'update') {
            const parsed = parseAddressInput(req.body ?? {});
            if (typeof parsed === 'string') {
                return errorBody(user, parsed);
            }

            if (action === 'create') {
                createAddress(user.id, parsed);
                res.redirect('/account/addresses');
            }

            // update
            const id = typeof req.body?.id === 'string' ? req.body.id : '';
            const existing = id ? getAddress(id) : undefined;
            if (!ownedBy(existing, user.id)) {
                return errorBody(user, 'Address not found');
            }
            updateAddress(id, parsed);
            res.redirect('/account/addresses');
        }

        return errorBody(user, 'Unknown action');
    }

    const publicUser = readPublicUser(req)!;   // requireSession already passed
    return {
        user: publicUser,
        addresses: listAddressesForUser(user.id),
        error: null,
        head: HEAD,
    };
}

function errorBody(user: { id: string; email: string }, error: string): Body {
    return {
        user: { id: user.id, email: user.email },
        addresses: listAddressesForUser(user.id),
        error,
        head: HEAD,
    };
}

/** Returns a NewAddress on success, or an error string on validation failure. */
function parseAddressInput(input: In): NewAddress | string {
    const name = str(input.name);
    const line1 = str(input.line1);
    const city = str(input.city);
    const region = str(input.region);
    const postcode = str(input.postcode);
    const country = str(input.country);

    if (!name || !line1 || !city || !region || !postcode || !country) {
        return 'Please fill in all required fields';
    }
    if (postcode.length > 20) {
        return 'Postcode is too long';
    }
    return {
        label: optionalStr(input.label),
        name,
        line1,
        line2: optionalStr(input.line2),
        city,
        region,
        postcode,
        country,
    };
}

function str(v: unknown): string {
    return typeof v === 'string' ? v.trim() : '';
}

function optionalStr(v: unknown): string | undefined {
    if (typeof v !== 'string') return undefined;
    const t = v.trim();
    return t ? t : undefined;
}
