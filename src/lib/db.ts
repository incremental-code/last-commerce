import { randomBytes, createHash } from 'node:crypto';

export interface User {
    id: string;
    email: string;
    passwordHash: string;   // sha256(salt + password), hex
    passwordSalt: string;   // 16 random bytes, hex
    createdAt: number;
}

export interface Session {
    id: string;             // opaque random token, 32 bytes hex
    userId: string;
    createdAt: number;
    lastSeenAt: number;
}

export interface Address {
    id: string;
    userId: string;
    label?: string;         // e.g. "Home"
    name: string;
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postcode: string;
    country: string;
}

export interface OrderLine {
    productId: string;
    name: string;           // snapshot of product name at order time
    priceCents: number;     // snapshot
    quantity: number;
    emoji: string;          // snapshot
}

export interface Order {
    id: string;
    userId: string;
    placedAt: number;
    lines: OrderLine[];
    shippingAddressId: string;
    subtotalCents: number;
    shippingCents: number;
    totalCents: number;
    paymentLast4: string;   // never store full PAN, just last 4
}

// Top-level state. Plain Maps so apis can read/write without ceremony; pages
// only ever see the results via api responses, so no signals are needed here.
// Note: this module never auto-seeds. See `seed.ts` for the demo user.
export const users = new Map<string, User>();
export const usersByEmail = new Map<string, string>();   // email -> userId
export const sessions = new Map<string, Session>();
export const addresses = new Map<string, Address>();
export const orders = new Map<string, Order>();

/** Returns `${prefix}_<16 hex chars>`. */
export function newId(prefix: string): string {
    return `${prefix}_${randomBytes(8).toString('hex')}`;
}

/** 16 random bytes, hex-encoded (32 chars). */
export function newSalt(): string {
    return randomBytes(16).toString('hex');
}

/** sha256(salt + password), hex. Salt is expected to be hex from `newSalt`. */
export function hashPassword(password: string, salt: string): string {
    return createHash('sha256').update(salt + password).digest('hex');
}
