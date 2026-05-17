export interface Product {
    id: string;
    name: string;
    description: string;
    priceCents: number;
    emoji: string;
}

export const products: Product[] = [
    {
        id: 'mug',
        name: 'Stoneware Mug',
        description: 'A heavy mug for serious mornings.',
        priceCents: 1800,
        emoji: '☕',
    },
    {
        id: 'notebook',
        name: 'Linen Notebook',
        description: 'Lay-flat binding, 120 pages of cream paper.',
        priceCents: 2400,
        emoji: '\u{1F4D3}',
    },
    {
        id: 'pencil',
        name: 'Cedar Pencil Pack',
        description: 'A dozen sharpened cedar pencils.',
        priceCents: 900,
        emoji: '✏️',
    },
    {
        id: 'lamp',
        name: 'Brass Reading Lamp',
        description: 'Adjustable arm, warm tungsten bulb.',
        priceCents: 12500,
        emoji: '\u{1F4A1}',
    },
    {
        id: 'plant',
        name: 'Snake Plant',
        description: 'Low-maintenance, low-light tolerant.',
        priceCents: 3200,
        emoji: '\u{1FAB4}',
    },
    {
        id: 'kettle',
        name: 'Pour-Over Kettle',
        description: 'Gooseneck spout for precise pours.',
        priceCents: 6800,
        emoji: '\u{1FAD6}',
    },
];

export function getProduct(id: string): Product | undefined {
    return products.find(p => p.id === id);
}
