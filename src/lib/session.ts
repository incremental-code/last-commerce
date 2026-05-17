import { randomBytes } from 'node:crypto';
import type { ApiRequest, ApiResponse } from '@incremental-code/last-router/server';
import { sessions, users, type Session, type User } from './db.js';

export const SESSION_COOKIE = 'sid';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;   // 30 days

function cookieOptions(maxAge: number) {
    return {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        maxAge,
    };
}

/** Reads a session from req.cookies, refreshes lastSeenAt, returns the session and user, or null. */
export function readSession(req: ApiRequest): { session: Session; user: User } | null {
    const sid = req.cookies[SESSION_COOKIE];
    if (!sid) return null;
    const session = sessions.get(sid);
    if (!session) return null;
    const user = users.get(session.userId);
    if (!user) {
        // Orphaned session — clean it up.
        sessions.delete(sid);
        return null;
    }
    session.lastSeenAt = Date.now();
    return { session, user };
}

/**
 * Same as readSession, but redirects to /signin?next=<current path> when there
 * is no session. `res.redirect` throws, so this function never returns null.
 */
export function requireSession(req: ApiRequest, res: ApiResponse): { session: Session; user: User } {
    const found = readSession(req);
    if (found) return found;
    res.redirect('/signin?next=' + encodeURIComponent(req.path));
}

/** Creates a new session for the given user, sets the cookie, returns the session. */
export function createSession(res: ApiResponse, userId: string): Session {
    const now = Date.now();
    const session: Session = {
        id: randomBytes(32).toString('hex'),
        userId,
        createdAt: now,
        lastSeenAt: now,
    };
    sessions.set(session.id, session);
    res.setCookie(SESSION_COOKIE, session.id, cookieOptions(SESSION_MAX_AGE_SECONDS));
    return session;
}

/** Destroys the current session (if any) and clears the cookie. */
export function destroySession(req: ApiRequest, res: ApiResponse): void {
    const sid = req.cookies[SESSION_COOKIE];
    if (sid) sessions.delete(sid);
    res.setCookie(SESSION_COOKIE, '', cookieOptions(0));
}
