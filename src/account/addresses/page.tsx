import { createElement, signal, computed } from '@incremental-code/last-act';
import type { PageProps } from '@incremental-code/last-router/server';
import {
    Container,
    Stack,
    Row,
    Heading,
    Text,
    Card,
    Button,
    Input,
    Field,
    Show,
    Alert,
    useForm,
    required,
    maxLength,
} from '@incremental-code/last-ui';
import { Nav } from '../../lib/Nav.js';
import { read } from '../../lib/body.js';
import type { Address } from '../../lib/db.js';
import type { PublicUser } from '../../lib/session.js';

interface AddressesBody {
    user: PublicUser;
    addresses: Address[];
    error: string | null;
}

/**
 * Address book — lists saved shipping addresses with inline create/edit forms
 * and per-card delete. All mutations go through native POSTs to
 * `/account/addresses` (handled by api.ts), which redirects back here on
 * success so refreshing the page never resubmits.
 *
 * Add and edit are toggled by client-side signals. We don't put `?edit=<id>`
 * in the URL because the api never needs to know — the form carries the id in
 * a hidden input.
 */
export default function AddressesPage({ router, body }: PageProps<{}, AddressesBody>) {
    const user = read(body.user);

    const addOpen = signal(false);
    const editingId = signal<string | null>(null);

    const openAdd = () => {
        editingId.set(null);
        addOpen.set(true);
    };
    const closeAdd = () => addOpen.set(false);
    const openEdit = (id: string) => {
        addOpen.set(false);
        editingId.set(id);
    };
    const closeEdit = () => editingId.set(null);

    const list = computed(() => {
        const items = read(body.addresses);
        const editing = editingId.get();

        if (items.length === 0 && !addOpen.get()) {
            return <Card>
                <Stack gap="md" align="center">
                    <Text muted>You have no saved addresses yet.</Text>
                    <Button onClick={openAdd}>Add address</Button>
                </Stack>
            </Card>;
        }

        return <Stack gap="md">
            {items.map(address => editing === address.id
                ? <AddressForm
                    key={'edit-' + address.id}
                    mode="update"
                    address={address}
                    onCancel={closeEdit}
                />
                : <AddressTile address={address} onEdit={() => openEdit(address.id)} />)}
        </Stack>;
    });

    const addForm = computed(() =>
        addOpen.get()
            ? <AddressForm mode="create" onCancel={closeAdd} />
            : null);

    const addButton = computed(() => {
        // Hide the "Add" button while the add form is open or while editing —
        // otherwise users can stack multiple forms and get confused.
        if (addOpen.get() || editingId.get() !== null) return null;
        const items = read(body.addresses);
        if (items.length === 0) return null;   // empty state already shows its own button
        return <Row justify="end">
            <Button onClick={openAdd}>Add address</Button>
        </Row>;
    });

    const errorBanner = (
        <Show when={body.error}>
            {message => <Alert variant="error">{message}</Alert>}
        </Show>
    );

    return <Container>
        <Stack gap="xl">
            <Nav router={router} user={user} />
            <Stack gap="sm">
                <Heading level={1}>Your addresses</Heading>
                <Text muted>Saved shipping addresses for faster checkout.</Text>
            </Stack>
            {errorBanner}
            {addButton}
            {addForm}
            {list}
        </Stack>
    </Container>;
}

interface AddressTileProps {
    address: Address;
    onEdit: () => void;
}

function AddressTile({ address, onEdit }: AddressTileProps) {
    return <Card>
        <Row justify="space-between" align="start">
            <Stack gap="xs">
                {address.label !== undefined
                    ? <Heading level={3}>{address.label}</Heading>
                    : null}
                <Text>{address.name}</Text>
                <Text muted size="sm">{address.line1}</Text>
                {address.line2 !== undefined
                    ? <Text muted size="sm">{address.line2}</Text>
                    : null}
                <Text muted size="sm">{address.city}, {address.region} {address.postcode}</Text>
                <Text muted size="sm">{address.country}</Text>
            </Stack>
            <Stack gap="sm">
                <Button variant="secondary" onClick={onEdit}>Edit</Button>
                {/*
                 * Inline form per card so the Delete button does a real POST
                 * with the address id. Keeps server as the source of truth
                 * (no fetch wiring needed) and survives a JS-disabled browser.
                 */}
                <form attributes={{ method: 'post', action: '/account/addresses' }}>
                    <input attributes={{ type: 'hidden', name: '_action', value: 'delete' }} />
                    <input attributes={{ type: 'hidden', name: 'id', value: address.id }} />
                    <Button type="submit" variant="danger">Delete</Button>
                </form>
            </Stack>
        </Row>
    </Card>;
}

interface AddressFormProps {
    mode: 'create' | 'update';
    address?: Address;
    onCancel: () => void;
}

function AddressForm({ mode, address, onCancel }: AddressFormProps) {
    const form = useForm({
        label: { initial: address?.label ?? '' },
        name: { initial: address?.name ?? '', validate: [required('Name is required')] },
        line1: { initial: address?.line1 ?? '', validate: [required('Address line 1 is required')] },
        line2: { initial: address?.line2 ?? '' },
        city: { initial: address?.city ?? '', validate: [required('City is required')] },
        region: { initial: address?.region ?? '', validate: [required('State / region is required')] },
        postcode: {
            initial: address?.postcode ?? '',
            validate: [required('Postcode is required'), maxLength(20, 'Postcode is too long')],
        },
        country: {
            initial: address?.country ?? (mode === 'create' ? 'US' : ''),
            validate: [required('Country is required')],
        },
    });

    const onSubmit = (event: SubmitEvent) => {
        let valid = false;
        form.submit(async () => { valid = true; });
        if (!valid) event.preventDefault();
    };

    const heading = mode === 'create' ? 'Add address' : 'Edit address';
    const submitLabel = mode === 'create' ? 'Save address' : 'Update address';

    return <Card>
        <form
            onsubmit={onSubmit}
            attributes={{ method: 'post', action: '/account/addresses' }}
        >
            <Stack gap="lg">
                <Heading level={2}>{heading}</Heading>
                <input attributes={{ type: 'hidden', name: '_action', value: mode }} />
                {mode === 'update' && address
                    ? <input attributes={{ type: 'hidden', name: 'id', value: address.id }} />
                    : null}

                <Field label="Label (optional)" htmlFor="addr-label" error={form.fields.label.error}>
                    <Input
                        id="addr-label"
                        name="label"
                        value={form.fields.label.value}
                        error={form.fields.label.error}
                        placeholder="Home, Work, etc."
                    />
                </Field>
                <Field label="Full name" htmlFor="addr-name" required error={form.fields.name.error}>
                    <Input
                        id="addr-name"
                        name="name"
                        value={form.fields.name.value}
                        error={form.fields.name.error}
                    />
                </Field>
                <Field label="Address line 1" htmlFor="addr-line1" required error={form.fields.line1.error}>
                    <Input
                        id="addr-line1"
                        name="line1"
                        value={form.fields.line1.value}
                        error={form.fields.line1.error}
                    />
                </Field>
                <Field label="Address line 2 (optional)" htmlFor="addr-line2" error={form.fields.line2.error}>
                    <Input
                        id="addr-line2"
                        name="line2"
                        value={form.fields.line2.value}
                        error={form.fields.line2.error}
                    />
                </Field>
                <Row gap="md">
                    <Field label="City" htmlFor="addr-city" required error={form.fields.city.error}>
                        <Input
                            id="addr-city"
                            name="city"
                            value={form.fields.city.value}
                            error={form.fields.city.error}
                        />
                    </Field>
                    <Field label="State / region" htmlFor="addr-region" required error={form.fields.region.error}>
                        <Input
                            id="addr-region"
                            name="region"
                            value={form.fields.region.value}
                            error={form.fields.region.error}
                        />
                    </Field>
                </Row>
                <Row gap="md">
                    <Field label="Postcode" htmlFor="addr-postcode" required error={form.fields.postcode.error}>
                        <Input
                            id="addr-postcode"
                            name="postcode"
                            value={form.fields.postcode.value}
                            error={form.fields.postcode.error}
                        />
                    </Field>
                    <Field label="Country" htmlFor="addr-country" required error={form.fields.country.error}>
                        <Input
                            id="addr-country"
                            name="country"
                            value={form.fields.country.value}
                            error={form.fields.country.error}
                        />
                    </Field>
                </Row>
                <Row gap="sm">
                    <Button type="submit">{submitLabel}</Button>
                    <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                </Row>
            </Stack>
        </form>
    </Card>;
}
