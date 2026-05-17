import type { ApiRequest, ApiResponse } from '@incremental-code/last-router/server';
import { destroySession } from '../lib/session.js';

type Body = { head: { title: string } };

/**
 * POST /signout — clears the session cookie and redirects to /.
 * GET is treated as a no-op redirect (no destructive action on a verb that
 * may be triggered by prefetchers / accidental navigation).
 *
 * `res.redirect` throws synchronously, so the `head`-carrying body below is
 * never actually rendered — it exists only to give the route a uniformly
 * typed body alongside the other pages.
 */
export default async function (req: ApiRequest, res: ApiResponse): Promise<Body> {
    if (req.method === 'POST') {
        destroySession(req, res);
    }
    res.redirect('/');
    return { head: { title: 'Signing out · last-commerce' } };
}
