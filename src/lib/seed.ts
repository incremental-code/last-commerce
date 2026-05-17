/**
 * Seeds the in-memory db with development fixtures. `db.ts` itself does NOT
 * auto-seed — importing this module is what populates the demo user. Importing
 * it more than once is safe; Node caches module evaluation and each helper is
 * idempotent.
 */

import { hashPassword, newId, newSalt, users, usersByEmail, type User } from './db.js';

export const DEMO_EMAIL = 'demo@last.dev';
export const DEMO_PASSWORD = 'demo';

/** Ensures the demo user exists. Returns the user. Safe to call repeatedly. */
export function ensureDemoUser(): User {
    const existingId = usersByEmail.get(DEMO_EMAIL);
    if (existingId) {
        const existing = users.get(existingId);
        if (existing) return existing;
    }
    const salt = newSalt();
    const user: User = {
        id: newId('usr'),
        email: DEMO_EMAIL,
        passwordHash: hashPassword(DEMO_PASSWORD, salt),
        passwordSalt: salt,
        createdAt: Date.now(),
    };
    users.set(user.id, user);
    usersByEmail.set(user.email, user.id);
    return user;
}

/** Runs every seed helper once. Idempotent. */
export function seed(): void {
    ensureDemoUser();
}

// Top-level side effect: importing this module seeds the db.
seed();
