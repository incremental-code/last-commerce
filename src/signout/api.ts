import type { ApiRequest, ApiResponse } from '@incremental-code/last-router/server';
import { destroySession } from '../lib/session.js';

/**
 * POST /signout — clears the session cookie and redirects to /.
 * GET is treated as a no-op redirect (no destructive action on a verb that
 * may be triggered by prefetchers / accidental navigation).
 */
export default async function (req: ApiRequest, res: ApiResponse): Promise<never> {
    if (req.method === 'POST') {
        destroySession(req, res);
    }
    res.redirect('/');
}
