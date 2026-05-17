import { createElement } from '@incremental-code/last-act';
import type { Router } from '@incremental-code/last-router/server';
import {
    Row,
    NavLink,
    Badge,
    Avatar,
    MenuDropdown,
    tokens,
} from '@incremental-code/last-ui';
import { cartCountComputed } from './cart-store.js';
import type { PublicUser } from './session.js';

export type { PublicUser } from './session.js';

export interface NavProps {
    router: Router;
    /** Signed-in user, or null when anonymous. */
    user: PublicUser | null;
}

export function Nav({ router, user }: NavProps) {
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
                {user
                    ? <AccountMenu user={user} />
                    : <a href="/signin" attributes={{
                        style: `color: ${tokens.color.text}; text-decoration: none; font-size: ${tokens.font.md};`,
                    }}>Sign in</a>}
            </Row>
        </Row>
        {/*
         * Hidden form so the dropdown's "Sign out" item can submit a POST to
         * /signout without any client-side fetch wiring. The menu item just
         * calls form.submit().
         */}
        {user
            ? <form
                id="signout-form"
                attributes={{
                    method: 'post',
                    action: '/signout',
                    style: 'display:none;',
                }}
            />
            : null}
    </div>;
}

function AccountMenu({ user }: { user: PublicUser }) {
    return <MenuDropdown
        placement="bottom-end"
        trigger={<Avatar name={user.email} size="sm" />}
        items={[
            {
                id: 'email',
                label: user.email,
                disabled: true,
            },
            {
                id: 'signout',
                label: 'Sign out',
                onSelect: () => {
                    const form = document.getElementById('signout-form');
                    if (form instanceof HTMLFormElement) form.submit();
                },
            },
        ]}
    />;
}
