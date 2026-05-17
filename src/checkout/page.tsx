import { createElement, signal, computed } from '@incremental-code/last-act';
import type { PageProps } from '@incremental-code/last-router/server';
import {
    Container,
    Stack,
    Row,
    Card,
    Heading,
    Text,
    Button,
    Input,
    Field,
    Radio,
    NumberInput,
    Show,
    Price,
    useForm,
    required,
    custom,
    tokens,
} from '@incremental-code/last-ui';
import { Nav } from '../lib/Nav.js';
import { read } from '../lib/body.js';
import type { PublicUser } from '../lib/session.js';
import type { Address } from '../lib/db.js';
import type { CartLine } from '../lib/cart-store.js';
import { isValidCardNumber } from '../lib/luhn.js';

interface CheckoutBody {
    user: PublicUser;
    addresses: Address[];
    cartLines: CartLine[];
    subtotalCents: number;
    shippingCents: number;
    totalCents: number;
    shippingFlatCents: number;
    error: string | null;
    placedOrderId: string | null;
}

const NEW_ADDRESS_OPTION = '__new__';

export default function Checkout({ router, body }: PageProps<{}, CheckoutBody>) {
    const user = read(body.user);
    const addresses = read(body.addresses);
    const cartLines = read(body.cartLines);
    const subtotalCents = read(body.subtotalCents);
    const shippingCents = read(body.shippingCents);
    const totalCents = read(body.totalCents);
    const placedOrderId = read(body.placedOrderId);
    const error = read(body.error);

    // Success view (after a successful place-order POST).
    if (placedOrderId) {
        return <Container>
            <Stack gap="xl">
                <Nav router={router} user={user} />
                <SuccessCard
                    orderId={placedOrderId}
                    lines={cartLines}
                    subtotalCents={subtotalCents}
                    shippingCents={shippingCents}
                    totalCents={totalCents}
                    router={router}
                />
            </Stack>
        </Container>;
    }

    // Empty cart view.
    if (cartLines.length === 0) {
        return <Container>
            <Stack gap="xl">
                <Nav router={router} user={user} />
                <Heading level={1}>Checkout</Heading>
                <Card>
                    <Stack gap="md" align="center">
                        <Text muted>Your cart is empty.</Text>
                        <a href="/" attributes={{
                            style: `color: ${tokens.color.accent}; text-decoration: none; font-size: ${tokens.font.md};`,
                        }}>Continue shopping</a>
                    </Stack>
                </Card>
            </Stack>
        </Container>;
    }

    return <Container>
        <Stack gap="xl">
            <Nav router={router} user={user} />
            <Heading level={1}>Checkout</Heading>
            <CheckoutForm
                user={user}
                addresses={addresses}
                cartLines={cartLines}
                subtotalCents={subtotalCents}
                shippingCents={shippingCents}
                totalCents={totalCents}
                serverError={error}
            />
        </Stack>
    </Container>;
}

interface SuccessCardProps {
    orderId: string;
    lines: CartLine[];
    subtotalCents: number;
    shippingCents: number;
    totalCents: number;
    router: { push(p: string): void };
}

function SuccessCard({ orderId, lines, subtotalCents, shippingCents, totalCents, router }: SuccessCardProps) {
    return <Card>
        <Stack gap="lg">
            <Stack gap="sm" align="center">
                <div attributes={{
                    style: `font-size: 64px; line-height: 1;`,
                }}>{'✅'}</div>
                <Heading level={2}>Order #{orderId} placed</Heading>
                <Text muted>Thanks — your order is on its way.</Text>
            </Stack>
            <Stack gap="sm">
                {lines.map(line => <Row key={line.product.id} justify="space-between" align="center">
                    <Text>{line.product.emoji} {line.product.name} × {String(line.quantity)}</Text>
                    <Price cents={line.product.priceCents * line.quantity} size="sm" />
                </Row>)}
            </Stack>
            <SummaryTotals
                subtotalCents={subtotalCents}
                shippingCents={shippingCents}
                totalCents={totalCents}
            />
            <Button onClick={() => router.push('/')}>Back to shop</Button>
        </Stack>
    </Card>;
}

interface SummaryTotalsProps {
    subtotalCents: number;
    shippingCents: number;
    totalCents: number;
}

function SummaryTotals({ subtotalCents, shippingCents, totalCents }: SummaryTotalsProps) {
    const rowStyle = `border-top: 1px solid ${tokens.color.border}; padding-top: ${tokens.space.sm};`;
    return <Stack gap="xs">
        <Row justify="space-between" align="center">
            <Text muted>Subtotal</Text>
            <Price cents={subtotalCents} size="sm" />
        </Row>
        <Row justify="space-between" align="center">
            <Text muted>Shipping</Text>
            <Price cents={shippingCents} size="sm" />
        </Row>
        <div attributes={{ style: rowStyle }}>
            <Row justify="space-between" align="center">
                <Heading level={3}>Total</Heading>
                <Price cents={totalCents} size="lg" />
            </Row>
        </div>
    </Stack>;
}

interface CheckoutFormProps {
    user: PublicUser;
    addresses: Address[];
    cartLines: CartLine[];
    subtotalCents: number;
    shippingCents: number;
    totalCents: number;
    serverError: string | null;
}

function CheckoutForm({
    user,
    addresses,
    cartLines,
    subtotalCents,
    shippingCents,
    totalCents,
    serverError,
}: CheckoutFormProps) {
    // Default the selection to the user's first address, falling back to "new".
    const initialSelection = addresses.length > 0 ? addresses[0]!.id : NEW_ADDRESS_OPTION;
    const selectedAddress = signal(initialSelection);

    const form = useForm({
        cardNumber: {
            initial: '',
            validate: [
                required('Card number is required'),
                custom<string>(isValidCardNumber, 'Enter a valid card number'),
            ],
        },
        cardName: { initial: '', validate: [required('Cardholder name is required')] },
        cardExpMonth: {
            initial: 1,
            validate: [
                custom<number>(v => Number.isInteger(v) && v >= 1 && v <= 12, 'Month must be 1-12'),
            ],
        },
        cardExpYear: {
            initial: new Date().getFullYear(),
            validate: [
                custom<number>(v => Number.isInteger(v) && v >= new Date().getFullYear(), 'Enter a valid year'),
            ],
        },
        cardCvc: {
            initial: '',
            validate: [
                required('CVC is required'),
                custom<string>(v => /^\d{3,4}$/.test(v), 'CVC must be 3-4 digits'),
            ],
        },
    });

    const onSubmit = (event: SubmitEvent) => {
        let valid = false;
        form.submit(async () => { valid = true; });
        if (!valid) event.preventDefault();
    };

    const showNewAddress = computed(() => selectedAddress.get() === NEW_ADDRESS_OPTION);

    return <form
        onsubmit={onSubmit}
        attributes={{ method: 'post', action: '/checkout' }}
    >
        <Stack gap="lg">
            <input attributes={{ type: 'hidden', name: '_action', value: 'place' }} />

            {serverError
                ? <Card>
                    <div attributes={{
                        style: `color: ${tokens.color.danger}; font-size: ${tokens.font.sm};`,
                    }}>{serverError}</div>
                </Card>
                : null}

            <ContactSection user={user} />
            <ShippingSection
                addresses={addresses}
                selected={selectedAddress}
                showNewAddress={showNewAddress}
            />
            <PaymentSection form={form} />
            <ReviewSection
                cartLines={cartLines}
                subtotalCents={subtotalCents}
                shippingCents={shippingCents}
                totalCents={totalCents}
            />
        </Stack>
    </form>;
}

function ContactSection({ user }: { user: PublicUser }) {
    return <Card>
        <Stack gap="sm">
            <Heading level={2}>Contact</Heading>
            <Text>{user.email}</Text>
        </Stack>
    </Card>;
}

interface ShippingSectionProps {
    addresses: Address[];
    selected: ReturnType<typeof signal<string>>;
    showNewAddress: ReturnType<typeof computed<boolean>>;
}

function ShippingSection({ addresses, selected, showNewAddress }: ShippingSectionProps) {
    return <Card>
        <Stack gap="md">
            <Heading level={2}>Shipping address</Heading>
            <Stack gap="sm">
                {addresses.map(address => <Radio
                    key={address.id}
                    name="shippingAddressId"
                    value={selected}
                    option={address.id}
                    label={<AddressPreview address={address} />}
                />)}
                <Radio
                    name="shippingAddressId"
                    value={selected}
                    option={NEW_ADDRESS_OPTION}
                    label={<Text>Use a new address</Text>}
                />
            </Stack>
            <Show when={showNewAddress}>
                <NewAddressFields />
            </Show>
        </Stack>
    </Card>;
}

function AddressPreview({ address }: { address: Address }) {
    const lines: string[] = [
        address.name,
        address.line1,
        address.line2 ?? '',
        `${address.city}, ${address.region} ${address.postcode}`,
        address.country,
    ].filter(Boolean);
    return <span attributes={{
        style: `color: ${tokens.color.text}; font-size: ${tokens.font.sm};`,
    }}>{lines.join(' · ')}</span>;
}

function NewAddressFields() {
    // Plain client-side signals — the server is the authoritative validator
    // for the inline-new-address path, so we don't gate this with useForm.
    const newName = signal('');
    const newLine1 = signal('');
    const newLine2 = signal('');
    const newCity = signal('');
    const newRegion = signal('');
    const newPostcode = signal('');
    const newCountry = signal('');

    return <Stack gap="sm">
        <Field label="Recipient name" htmlFor="new-name" required>
            <Input id="new-name" name="newName" value={newName} placeholder="Full name" />
        </Field>
        <Field label="Address line 1" htmlFor="new-line1" required>
            <Input id="new-line1" name="newLine1" value={newLine1} placeholder="Street address" />
        </Field>
        <Field label="Address line 2" htmlFor="new-line2">
            <Input id="new-line2" name="newLine2" value={newLine2} placeholder="Apt, suite, etc. (optional)" />
        </Field>
        <Row gap="sm">
            <Field label="City" htmlFor="new-city" required>
                <Input id="new-city" name="newCity" value={newCity} />
            </Field>
            <Field label="Region/State" htmlFor="new-region" required>
                <Input id="new-region" name="newRegion" value={newRegion} />
            </Field>
        </Row>
        <Row gap="sm">
            <Field label="Postcode" htmlFor="new-postcode" required>
                <Input id="new-postcode" name="newPostcode" value={newPostcode} />
            </Field>
            <Field label="Country" htmlFor="new-country" required>
                <Input id="new-country" name="newCountry" value={newCountry} />
            </Field>
        </Row>
    </Stack>;
}

interface PaymentSectionProps {
    form: ReturnType<typeof useForm<{
        cardNumber: { initial: string; validate: any[] };
        cardName: { initial: string; validate: any[] };
        cardExpMonth: { initial: number; validate: any[] };
        cardExpYear: { initial: number; validate: any[] };
        cardCvc: { initial: string; validate: any[] };
    }>>;
}

function PaymentSection({ form }: PaymentSectionProps) {
    return <Card>
        <Stack gap="md">
            <Heading level={2}>Payment</Heading>
            <Field label="Card number" htmlFor="card-number" required error={form.fields.cardNumber.error}>
                <Input
                    id="card-number"
                    name="cardNumber"
                    value={form.fields.cardNumber.value}
                    error={form.fields.cardNumber.error}
                    placeholder="4242 4242 4242 4242"
                />
            </Field>
            <Field label="Cardholder name" htmlFor="card-name" required error={form.fields.cardName.error}>
                <Input
                    id="card-name"
                    name="cardName"
                    value={form.fields.cardName.value}
                    error={form.fields.cardName.error}
                    placeholder="Name on card"
                />
            </Field>
            <Row gap="sm">
                <Field label="Exp. month" htmlFor="card-exp-month" required error={form.fields.cardExpMonth.error}>
                    <NumberInput
                        id="card-exp-month"
                        name="cardExpMonth"
                        value={form.fields.cardExpMonth.value}
                        error={form.fields.cardExpMonth.error}
                        min={1}
                        max={12}
                    />
                </Field>
                <Field label="Exp. year" htmlFor="card-exp-year" required error={form.fields.cardExpYear.error}>
                    <NumberInput
                        id="card-exp-year"
                        name="cardExpYear"
                        value={form.fields.cardExpYear.value}
                        error={form.fields.cardExpYear.error}
                        min={new Date().getFullYear()}
                    />
                </Field>
                <Field label="CVC" htmlFor="card-cvc" required error={form.fields.cardCvc.error}>
                    <Input
                        id="card-cvc"
                        name="cardCvc"
                        value={form.fields.cardCvc.value}
                        error={form.fields.cardCvc.error}
                        placeholder="123"
                    />
                </Field>
            </Row>
        </Stack>
    </Card>;
}

interface ReviewSectionProps {
    cartLines: CartLine[];
    subtotalCents: number;
    shippingCents: number;
    totalCents: number;
}

function ReviewSection({ cartLines, subtotalCents, shippingCents, totalCents }: ReviewSectionProps) {
    return <Card>
        <Stack gap="md">
            <Heading level={2}>Review</Heading>
            <Stack gap="sm">
                {cartLines.map(line => <Row key={line.product.id} justify="space-between" align="center">
                    <Row gap="sm" align="center">
                        <span attributes={{ style: `font-size: 24px;` }}>{line.product.emoji}</span>
                        <Text>{line.product.name} × {String(line.quantity)}</Text>
                    </Row>
                    <Price cents={line.product.priceCents * line.quantity} size="sm" />
                </Row>)}
            </Stack>
            <SummaryTotals
                subtotalCents={subtotalCents}
                shippingCents={shippingCents}
                totalCents={totalCents}
            />
            <Button type="submit">Place order</Button>
        </Stack>
    </Card>;
}
