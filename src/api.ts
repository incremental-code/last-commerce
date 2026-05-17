import './lib/seed.js';   // top-level side effect: ensures demo user exists
import type { ApiRequest } from '@incremental-code/last-router/server';
import { products } from './lib/catalog.js';
import type { Product } from './lib/catalog.js';
import { readPublicUser, type PublicUser } from './lib/session.js';

export default function (req: ApiRequest): { products: Product[]; user: PublicUser | null } {
    return { products, user: readPublicUser(req) };
}
