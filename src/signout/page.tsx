import { createElement } from '@incremental-code/last-act';
import type { PageProps } from '@incremental-code/last-router/server';
import { Container, Stack, Text } from '@incremental-code/last-ui';

/**
 * Placeholder page so `scanRoutes` registers the `/signout` route — the api
 * handler always redirects before this ever renders. Required because the
 * router only picks up folders that contain a `page.js`.
 */
export default function SignOut(_props: PageProps) {
    return <Container>
        <Stack gap="md">
            <Text muted>Signing out…</Text>
        </Stack>
    </Container>;
}
