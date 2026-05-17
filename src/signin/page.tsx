import { createElement } from '@incremental-code/last-act';
import type { PageProps } from '@incremental-code/last-router/server';
import {
    Container,
    Stack,
    Card,
    Heading,
    Text,
    Button,
    Input,
    Field,
    Show,
    Alert,
    useForm,
    required,
    email,
    minLength,
    tokens,
} from '@incremental-code/last-ui';

interface SigninBody {
    error: string | null;
}

/**
 * Sign-in form. Submission goes through the browser as a native
 * `application/x-www-form-urlencoded` POST so the server can set the
 * session cookie and 302-redirect — no client fetch required.
 *
 * We still wire `useForm` for inline validation feedback. The form's
 * `onsubmit` calls `form.submit(noop)` first; if any field is invalid the
 * submit handler marks fields touched (showing errors) and we
 * `preventDefault()` to block the native POST.
 */
export default function SignIn({ body }: PageProps<{}, SigninBody>) {
    const form = useForm({
        email: { initial: '', validate: [required('Email is required'), email()] },
        password: { initial: '', validate: [required('Password is required'), minLength(1)] },
    });

    const onSubmit = (event: SubmitEvent) => {
        // Trigger validation; the no-op handler runs only when all fields are valid.
        // If invalid, submit() marks every field touched (revealing errors) and
        // returns without invoking the callback — so we cancel the native POST.
        let valid = false;
        form.submit(async () => { valid = true; });
        if (!valid) event.preventDefault();
    };

    return <Container>
        <Stack gap="xl">
            <Card>
                <form
                    onsubmit={onSubmit}
                    attributes={{ method: 'post', action: '/signin' }}
                >
                    <Stack gap="lg">
                        <Heading level={1}>Sign in</Heading>
                        <Show when={body.error}>
                            {message => <Alert variant="error">{message}</Alert>}
                        </Show>
                        <Field label="Email" htmlFor="signin-email" required error={form.fields.email.error}>
                            <Input
                                id="signin-email"
                                name="email"
                                type="email"
                                value={form.fields.email.value}
                                error={form.fields.email.error}
                                placeholder="you@example.com"
                            />
                        </Field>
                        <Field label="Password" htmlFor="signin-password" required error={form.fields.password.error}>
                            <Input
                                id="signin-password"
                                name="password"
                                type="password"
                                value={form.fields.password.value}
                                error={form.fields.password.error}
                                placeholder="Your password"
                            />
                        </Field>
                        <Button type="submit">Sign in</Button>
                        <Text muted size="sm">
                            Need an account? <a href="/signup" attributes={{
                                style: `color: ${tokens.color.accent}; text-decoration: none;`,
                            }}>Sign up</a>
                        </Text>
                    </Stack>
                </form>
            </Card>
        </Stack>
    </Container>;
}
