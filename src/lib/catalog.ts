export interface Product {
    id: string;
    name: string;
    description: string;
    priceCents: number;
    emoji: string;
}

export const products: Product[] = [
    // kitchen
    {
        id: 'mug',
        name: 'Stoneware Mug',
        description: 'A heavy mug for serious mornings.',
        priceCents: 1800,
        emoji: '☕',
    },
    {
        id: 'kettle',
        name: 'Pour-Over Kettle',
        description: 'Gooseneck spout for precise pours.',
        priceCents: 6800,
        emoji: '\u{1FAD6}',
    },
    {
        id: 'french-press',
        name: 'French Press',
        description: 'Thick-walled glass, stainless plunger.',
        priceCents: 4200,
        emoji: '\u{1FAD7}',
    },
    {
        id: 'chef-knife',
        name: 'Carbon Chef Knife',
        description: 'Hand-forged, eight inches of edge.',
        priceCents: 13500,
        emoji: '\u{1F52A}',
    },
    {
        id: 'cutting-board',
        name: 'Maple Cutting Board',
        description: 'End-grain block, kind to your blade.',
        priceCents: 5400,
        emoji: '\u{1FAB5}',
    },
    {
        id: 'spice-set',
        name: 'Whole Spice Set',
        description: 'Twelve aromatics in amber jars.',
        priceCents: 4800,
        emoji: '\u{1F9C2}',
    },
    {
        id: 'tea-tin',
        name: 'Loose-Leaf Tea Tin',
        description: 'Single-origin oolong, 100g.',
        priceCents: 2200,
        emoji: '\u{1F375}',
    },

    // desk
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
        id: 'fountain-pen',
        name: 'Brass Fountain Pen',
        description: 'Medium nib, refillable cartridge.',
        priceCents: 8600,
        emoji: '\u{1F58B}',
    },
    {
        id: 'desk-mat',
        name: 'Wool Desk Mat',
        description: 'Dense felt, charcoal grey, large.',
        priceCents: 4900,
        emoji: '\u{1F9F6}',
    },
    {
        id: 'paperclip-jar',
        name: 'Brass Paperclip Jar',
        description: 'Heavy little dish with 100 clips.',
        priceCents: 1500,
        emoji: '\u{1F4CE}',
    },
    {
        id: 'index-cards',
        name: 'Ruled Index Cards',
        description: 'A stack of 200, for thinking on paper.',
        priceCents: 700,
        emoji: '\u{1F5C2}',
    },

    // lighting
    {
        id: 'lamp',
        name: 'Brass Reading Lamp',
        description: 'Adjustable arm, warm tungsten bulb.',
        priceCents: 12500,
        emoji: '\u{1F4A1}',
    },
    {
        id: 'candle',
        name: 'Beeswax Candle',
        description: 'Hand-poured, 40-hour burn.',
        priceCents: 2100,
        emoji: '\u{1F56F}',
    },
    {
        id: 'string-lights',
        name: 'Linen String Lights',
        description: 'Twenty warm LEDs on a fabric cord.',
        priceCents: 3400,
        emoji: '\u{1F4A1}',
    },
    {
        id: 'lantern',
        name: 'Camp Lantern',
        description: 'Rechargeable, dimmable, packs flat.',
        priceCents: 5800,
        emoji: '\u{1F3EE}',
    },

    // plants
    {
        id: 'plant',
        name: 'Snake Plant',
        description: 'Low-maintenance, low-light tolerant.',
        priceCents: 3200,
        emoji: '\u{1FAB4}',
    },
    {
        id: 'monstera',
        name: 'Monstera Deliciosa',
        description: 'Split leaves, big personality.',
        priceCents: 4800,
        emoji: '\u{1F33F}',
    },
    {
        id: 'cactus',
        name: 'Pot of Cacti',
        description: 'Three varieties in a terracotta pot.',
        priceCents: 1900,
        emoji: '\u{1F335}',
    },
    {
        id: 'watering-can',
        name: 'Copper Watering Can',
        description: 'Long-spout, two-litre, ages beautifully.',
        priceCents: 4600,
        emoji: '\u{1F6BF}',
    },

    // books
    {
        id: 'cookbook',
        name: 'Weeknight Cookbook',
        description: 'Sixty recipes you will actually make.',
        priceCents: 3200,
        emoji: '\u{1F4D6}',
    },
    {
        id: 'novel',
        name: 'Short Story Collection',
        description: 'Twelve quiet stories, one slim volume.',
        priceCents: 1800,
        emoji: '\u{1F4DA}',
    },
    {
        id: 'sketchbook',
        name: 'Hardcover Sketchbook',
        description: 'A4, 180gsm, sewn binding.',
        priceCents: 2700,
        emoji: '\u{1F4D2}',
    },

    // gear
    {
        id: 'tote',
        name: 'Canvas Tote',
        description: 'Heavyweight cotton, leather straps.',
        priceCents: 3800,
        emoji: '\u{1F45C}',
    },
    {
        id: 'water-bottle',
        name: 'Insulated Water Bottle',
        description: 'Stainless steel, 750ml, cold all day.',
        priceCents: 3600,
        emoji: '\u{1F37C}',
    },
    {
        id: 'wool-socks',
        name: 'Merino Wool Socks',
        description: 'Two pairs, mid-weight, charcoal.',
        priceCents: 2400,
        emoji: '\u{1F9E6}',
    },
    {
        id: 'beanie',
        name: 'Knit Beanie',
        description: 'Rib-knit lambswool, one size.',
        priceCents: 2800,
        emoji: '\u{1F9E2}',
    },
    {
        id: 'umbrella',
        name: 'Compact Umbrella',
        description: 'Wind-resistant, fits in any bag.',
        priceCents: 3300,
        emoji: '☂️',
    },
    {
        id: 'pocket-knife',
        name: 'Pocket Knife',
        description: 'Slip-joint, walnut scales, three inches.',
        priceCents: 4400,
        emoji: '\u{1F52A}',
    },
];

export function getProduct(id: string): Product | undefined {
    return products.find(p => p.id === id);
}
