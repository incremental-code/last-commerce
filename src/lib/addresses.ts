import { addresses, newId, type Address } from './db.js';

/**
 * Shape callers pass when creating / updating an address — no `id` (we
 * generate it) and no `userId` (set from the session at the call site, never
 * accepted from input).
 */
export type NewAddress = Omit<Address, 'id' | 'userId'>;

/**
 * Returns addresses owned by the user. Sort by label asc (undefined labels
 * last), then by id for stability across reads.
 */
export function listAddressesForUser(userId: string): Address[] {
    const owned: Address[] = [];
    for (const address of addresses.values()) {
        if (address.userId === userId) owned.push(address);
    }
    owned.sort((a, b) => {
        if (a.label === undefined && b.label === undefined) {
            return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
        }
        if (a.label === undefined) return 1;
        if (b.label === undefined) return -1;
        if (a.label < b.label) return -1;
        if (a.label > b.label) return 1;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
    return owned;
}

export function getAddress(id: string): Address | undefined {
    return addresses.get(id);
}

/**
 * Returns true iff the address exists and belongs to the given user. Callers
 * MUST use this as the auth check before any edit/delete — we never trust an
 * id from the client to imply ownership.
 */
export function ownedBy(address: Address | undefined, userId: string): boolean {
    return !!address && address.userId === userId;
}

export function createAddress(userId: string, input: NewAddress): Address {
    const address: Address = {
        id: newId('adr'),
        userId,
        ...normalize(input),
    };
    addresses.set(address.id, address);
    return address;
}

export function updateAddress(id: string, patch: Partial<NewAddress>): Address | undefined {
    const existing = addresses.get(id);
    if (!existing) return undefined;
    const normalized = normalizePatch(patch);
    const next: Address = { ...existing, ...normalized };
    // `normalizePatch` returns `label: undefined` / `line2: undefined` explicitly
    // when those fields were provided but empty. Spread copies those through so
    // the previous value is overwritten — not silently retained.
    addresses.set(id, next);
    return next;
}

export function deleteAddress(id: string): boolean {
    return addresses.delete(id);
}

/** Trim every string field; drop empty optional `label` / `line2` to undefined. */
function normalize(input: NewAddress): NewAddress {
    const label = input.label === undefined ? undefined : input.label.trim();
    const line2 = input.line2 === undefined ? undefined : input.line2.trim();
    return {
        label: label ? label : undefined,
        name: input.name.trim(),
        line1: input.line1.trim(),
        line2: line2 ? line2 : undefined,
        city: input.city.trim(),
        region: input.region.trim(),
        postcode: input.postcode.trim(),
        country: input.country.trim(),
    };
}

/**
 * Like `normalize` but only touches fields actually present on the patch. For
 * `label` and `line2` an explicitly-provided empty string becomes `undefined`
 * so callers can clear those fields.
 */
function normalizePatch(patch: Partial<NewAddress>): Partial<NewAddress> {
    const out: Partial<NewAddress> = {};
    if ('label' in patch) {
        const v = patch.label === undefined ? undefined : patch.label.trim();
        out.label = v ? v : undefined;
    }
    if ('name' in patch && patch.name !== undefined) out.name = patch.name.trim();
    if ('line1' in patch && patch.line1 !== undefined) out.line1 = patch.line1.trim();
    if ('line2' in patch) {
        const v = patch.line2 === undefined ? undefined : patch.line2.trim();
        out.line2 = v ? v : undefined;
    }
    if ('city' in patch && patch.city !== undefined) out.city = patch.city.trim();
    if ('region' in patch && patch.region !== undefined) out.region = patch.region.trim();
    if ('postcode' in patch && patch.postcode !== undefined) out.postcode = patch.postcode.trim();
    if ('country' in patch && patch.country !== undefined) out.country = patch.country.trim();
    return out;
}
