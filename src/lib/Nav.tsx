import { createElement } from '@incremental-code/last-act';
import type { Router } from '@incremental-code/last-router/server';
import { Row, NavLink, Badge, tokens } from '@incremental-code/last-ui';
import { cartCountComputed } from './cart-store.js';

export interface NavProps {
    router: Router;
}

export function Nav({ router }: NavProps) {
    const count = cartCountComputed();
    return <div attributes={{
        style: `border-bottom: 1px solid ${tokens.color.border}; padding-bottom: ${tokens.space.md};`,
    }}>
        <Row justify="space-between" align="center">
            <Row gap="md" align="center">
                <a href="/" attributes={{
                    style: `font-weight: 700; font-size: ${tokens.font.lg}; text-decoration: none; color: ${tokens.color.text};`,
                }}>last-commerce</a>
                <NavLink href="/" active={router.path === '/'}>Shop</NavLink>
            </Row>
            <Row gap="sm" align="center">
                <NavLink href="/cart" active={router.path === '/cart'}>Cart</NavLink>
                <Badge variant="accent">{count}</Badge>
            </Row>
        </Row>
    </div>;
}
