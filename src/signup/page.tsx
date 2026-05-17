import { createElement } from '@incremental-code/last-act';
import { computed } from '@incremental-code/last-act';
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
    useForm,
    required,
    email,
    minLength,
    tokens,
} from '@incremental-code/last-ui';

interface SignupBody {
    error: string | null;
}

/** Mirror of /signin: native POST, with client-side validation gate. */
export default function SignUp({ body }: PageProps<{}, SignupBody>) {
    const form = useForm({
        email: { initial: '', validate: [required('Email is required'), email()] },
        password: { initial: '', validate: [required('Password is required'), minLength(6)] },
        confirmPassword: { initial: '', validate: [required('Please confirm your password')] },
    });

    // Cross-field validation: confirm must match password. We compute it as a
    // derived error and merge it with the field's own error for display.
    const matchError = computed<string | null>(() => {
        const p = form.fields.password.value.get();
        const c = form.fields.confirmPassword.value.get();
        if (!form.fields.confirmPassword.touched.get()) return null;
        if (!c) return null;
        return p === c ? null : 'Passwords do not match';
    });
    const confirmError = computed<string | null>(() =>
        form.fields.confirmPassword.error.get() ?? matchError.get(),
    );

    const onSubmit = (event: SubmitEvent) => {
        let valid = false;
        form.submit(async () => { valid = true; });
        // Also block submission if the cross-field match check fails.
        if (form.fields.password.value.get() !== form.fields.confirmPassword.value.get()) {
            valid = false;
            form.fields.confirmPassword.touched.set(true);
        }
        if (!valid) event.preventDefault();
    };

    return <Container>
        <Stack gap="xl">
            <Card>
                <form
                    onsubmit={onSubmit}
                    attributes={{ method: 'post', action: '/signup' }}
                >
                    <Stack gap="lg">
                        <Heading level={1}>Create an account</Heading>
                        <Show when={body.error}>
                            {message => <div attributes={{
                                style: `color: ${tokens.color.danger}; font-size: ${tokens.font.sm};`,
                            }}>{message}</div>}
                        </Show>
                        <Field label="Email" htmlFor="signup-email" required error={form.fields.email.error}>
                            <Input
                                id="signup-email"
                                name="email"
                                type="email"
                                value={form.fields.email.value}
                                error={form.fields.email.error}
                                placeholder="you@example.com"
                            />
                        </Field>
                        <Field label="Password" htmlFor="signup-password" required error={form.fields.password.error}>
                            <Input
                                id="signup-password"
                                name="password"
                                type="password"
                                value={form.fields.password.value}
                                error={form.fields.password.error}
                                placeholder="At least 6 characters"
                            />
                        </Field>
                        <Field label="Confirm password" htmlFor="signup-confirm" required error={confirmError}>
                            <Input
                                id="signup-confirm"
                                name="confirmPassword"
                                type="password"
                                value={form.fields.confirmPassword.value}
                                error={confirmError}
                                placeholder="Re-enter your password"
                            />
                        </Field>
                        <Button type="submit">Sign up</Button>
                        <Text muted size="sm">
                            Already have an account? <a href="/signin" attributes={{
                                style: `color: ${tokens.color.accent}; text-decoration: none;`,
                            }}>Sign in</a>
                        </Text>
                    </Stack>
                </form>
            </Card>
        </Stack>
    </Container>;
}
