import { z } from 'zod';
// Only reviewed local assets can enter scene content. Provenance travels with every reference:
// each photograph is openly licensed (Wikimedia Commons or Pexels) and credited where it is shown.
// The photographs tell the story's beats; only the last one is of Hargeisa itself.
export const AssetIdSchema = z.enum(['market-aerial', 'market-crowd', 'packed-shop', 'parcel-handover', 'cash-handover', 'market-street']);
export type AssetId = z.infer<typeof AssetIdSchema>;
export const licenceUrls = {
  'CC0 1.0': 'https://creativecommons.org/publicdomain/zero/1.0/',
  'Pexels License': 'https://www.pexels.com/license/',
} as const;
export const AssetSchema = z.strictObject({
  src: z.string().regex(/^\.\/explore\/[a-z0-9-]+\.(jpg|webp)$/),
  width: z.number().int().positive().max(2000), height: z.number().int().positive().max(2000),
  alt: z.string().min(10).max(300), caption: z.string().min(10).max(300),
  // The photo's own page, where its author, licence and description can be checked.
  sourceUrl: z.string().regex(/^https:\/\/(commons\.wikimedia\.org\/wiki\/File:|www\.pexels\.com\/photo\/)\S+$/),
  source: z.enum(['Wikimedia Commons', 'Pexels']),
  creator: z.string().min(2).max(120),
  licence: z.enum(['CC0 1.0', 'Pexels License']),
  changes: z.string().min(5).max(80), // what was done to the original
  role: z.string().min(5).max(300),
});
export type Asset = z.infer<typeof AssetSchema>;
const pexels = { source: 'Pexels', licence: 'Pexels License' } as const;
export const exploreAssets: Record<AssetId, Asset> = {
  'market-aerial': AssetSchema.parse({
    ...pexels, src: './explore/market-aerial.webp', width: 1440, height: 1800,
    sourceUrl: 'https://www.pexels.com/photo/aerial-view-of-busy-market-street-in-enugu-nigeria-31853996/',
    creator: 'Chukwuemeka Joel', changes: 'Cropped and resized',
    alt: 'A busy market street seen from directly above: yellow minibuses in a line, colourful umbrellas over stalls, and shoppers between them',
    caption: 'One street, many trades: minibuses, stalls and shoppers share the road. Enugu, Nigeria.',
    role: 'Hero: a city where trade already moves along every street — the network a marketplace would connect.',
  }),
  'market-crowd': AssetSchema.parse({
    ...pexels, src: './explore/market-crowd.webp', width: 840, height: 1120,
    sourceUrl: 'https://www.pexels.com/photo/bustling-african-market-street-scene-28468236/',
    creator: 'Al-amin Muhammad', changes: 'Resized',
    alt: 'A crowded market street at eye level: shoppers walking between stalls, a vendor pushing a cart of shoes, an umbrella in the foreground',
    caption: 'Buyers, sellers and carts at street level: the people every handover depends on.',
    role: 'Context: begin with people, not technology; the participants on the plan are already here.',
  }),
  'packed-shop': AssetSchema.parse({
    ...pexels, src: './explore/packed-shop.webp', width: 960, height: 960,
    sourceUrl: 'https://www.pexels.com/photo/small-shop-interior-with-local-shopkeeper-30848031/',
    creator: 'Kalz Michael', changes: 'Cropped and resized',
    alt: 'A shopkeeper standing in a small shop packed to the ceiling with sacks, packets and goods hanging from a line',
    caption: 'Everything is here somewhere. From outside, nobody can tell what is in stock.',
    role: 'Problem: stock exists, but it is invisible until you arrive — the gap behind “Can I find what I need?”.',
  }),
  'parcel-handover': AssetSchema.parse({
    ...pexels, src: './explore/parcel-handover.webp', width: 1100, height: 1100,
    sourceUrl: 'https://www.pexels.com/photo/man-delivering-box-to-woman-12725460/',
    creator: 'Roman Odintsov', changes: 'Cropped and resized',
    alt: 'Two pairs of hands passing a cardboard box between a courier in a green jacket and a customer at a doorway',
    caption: 'The handover: the moment an order changes hands, and responsibility with it.',
    role: 'Problem: the instant a parcel passes between people is where a missing item or delay needs an owner.',
  }),
  'cash-handover': AssetSchema.parse({
    ...pexels, src: './explore/cash-handover.webp', width: 1100, height: 1100,
    sourceUrl: 'https://www.pexels.com/photo/a-person-handing-money-to-a-person-10400717/',
    creator: 'cottonbro studio', changes: 'Cropped and resized',
    alt: 'Close-up of one hand passing a folded bundle of banknotes into another',
    caption: 'Then the money changes hands. The total price is what a customer actually decides on.',
    role: 'Problem: the parcel and the payment are two handovers; the cost question is the second one.',
  }),
  'market-street': AssetSchema.parse({
    source: 'Wikimedia Commons', licence: 'CC0 1.0', src: './explore/hargeisa-fruit-market.webp', width: 900, height: 1125,
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:HG_0272.jpg',
    creator: 'O. Mustafin', changes: 'Cropped, resized, sign text blurred',
    alt: 'A man seated beside a handcart piled with citrus fruit, next to a stand of shoes, on a street of shops in Hargeisa',
    caption: 'Back in Hargeisa: carts and shops on one street. The first conversation can start here. October 2021.',
    role: 'Action: the next step returns to the real city — one retailer, one conversation about real orders.',
  }),
};
