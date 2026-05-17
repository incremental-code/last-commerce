import type { ApiContext } from '@incremental-code/last-router/server';
import { getProduct } from '../../lib/catalog.js';
import type { Product } from '../../lib/catalog.js';

type Params = { id: string };

export default function ({ params }: ApiContext<Params>): { product: Product | null } {
    const product = getProduct(params.id);
    return { product: product ?? null };
}
