import '../lib/seed.js';   // ensure demo user / db tables are initialized
import type { ApiRequest, ApiResponse } from '@incremental-code/last-router/server';
import {
    hashPassword,
    newId,
    newSalt,
    users,
    usersByEmail,
    type User,
} from '../lib/db.js';
import { createSession } from '../lib/session.js';

type In = { email?: string; password?: string; confirmPassword?: string };
type Body = { error: string | null };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function (
    req: ApiRequest<{}, {}, In>,
    res: ApiResponse,
): Promise<Body> {
    if (req.method !== 'POST') {
        return { error: null };
    }

    const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const email = rawEmail.toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const confirm = typeof req.body?.confirmPassword === 'string' ? req.body.confirmPassword : '';

    if (!email || !EMAIL_RE.test(email)) {
        return { error: 'Enter a valid email address' };
    }
    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters' };
    }
    if (password !== confirm) {
        return { error: 'Passwords do not match' };
    }
    if (usersByEmail.has(email)) {
        return { error: 'An account with that email already exists' };
    }

    const salt = newSalt();
    const user: User = {
        id: newId('usr'),
        email,
        passwordHash: hashPassword(password, salt),
        passwordSalt: salt,
        createdAt: Date.now(),
    };
    users.set(user.id, user);
    usersByEmail.set(user.email, user.id);

    createSession(res, user.id);
    res.redirect('/');
}
