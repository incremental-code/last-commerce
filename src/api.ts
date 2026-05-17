import './lib/seed.js';   // top-level side effect: ensures demo user exists
import { products } from './lib/catalog.js';
import type { Product } from './lib/catalog.js';

export default function (): { products: Product[] } {
    return { products };
}
