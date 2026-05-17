import '../lib/seed.js';   // ensure demo user exists
import type { ApiRequest, ApiResponse } from '@incremental-code/last-router/server';
import { hashPassword, users, usersByEmail } from '../lib/db.js';
import { createSession } from '../lib/session.js';

type Query = { next?: string };
type In = { email?: string; password?: string };
type Body = { error: string | null };

/**
 * GET returns `{ error: null }` so the page always sees an `error` signal
 * (the form just renders client-side from `useForm`). POST validates
 * credentials, creates a session, and redirects to `?next=` or `/`.
 *
 * On failure we fall through and return the body — the same renderPage
 * pipeline then SSR-renders /signin with `body.error` populated.
 */
export default async function (
    req: ApiRequest<{}, Query, In>,
    res: ApiResponse,
): Promise<Body> {
    if (req.method !== 'POST') {
        return { error: null };
    }

    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
        return { error: 'Invalid email or password' };
    }

    const userId = usersByEmail.get(email);
    const user = userId ? users.get(userId) : undefined;
    if (!user) {
        return { error: 'Invalid email or password' };
    }

    const hashed = hashPassword(password, user.passwordSalt);
    if (hashed !== user.passwordHash) {
        return { error: 'Invalid email or password' };
    }

    createSession(res, user.id);
    const next = isSafeNext(req.query.next) ? req.query.next! : '/';
    res.redirect(next);
}

/** Only allow same-origin path redirects to avoid open-redirect issues. */
function isSafeNext(next: string | undefined): boolean {
    if (!next) return false;
    // Must start with a single "/" and not "//" (which would be protocol-relative).
    return next.startsWith('/') && !next.startsWith('//');
}
