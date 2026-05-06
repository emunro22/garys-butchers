/**
 * Seeds the database with the full Gary's Butchers product catalogue,
 * meat packs, sample promotions and Google reviews.
 *
 * Run with:  npm run db:seed
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from './index';
import { categories, products, promotions, reviews } from './schema';

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// ---------- Categories ----------

const seedCategories = [
  {
    name: 'Beef',
    slug: 'beef',
    description: 'Hand-cut Scottish beef — sirloin, popeseye, rump, roasting joints and lean mince.',
    sortOrder: 1,
  },
  {
    name: 'Pork',
    slug: 'pork',
    description: 'Loin steaks, links, pork olives and traditional cuts from local farms.',
    sortOrder: 2,
  },
  {
    name: 'Chicken',
    slug: 'chicken',
    description: 'Free-range chicken fillets, burgers and prepared cuts.',
    sortOrder: 3,
  },
  {
    name: 'Fish',
    slug: 'fish',
    description: 'Fresh fish from our fishmonger counter — daily catch from the Scottish coast.',
    sortOrder: 4,
  },
  {
    name: 'Sausages & Burgers',
    slug: 'sausages-burgers',
    description: 'Steak burgers, chicken burgers, beef and pork links — made on site.',
    sortOrder: 5,
  },
  {
    name: 'Pies & Bakery',
    slug: 'pies-bakery',
    description: 'Steak pies, scotch pies, family pies and freshly baked potato scones.',
    sortOrder: 6,
  },
  {
    name: 'Breakfast & Sides',
    slug: 'breakfast-sides',
    description: 'Square sausage, sweetcure bacon, black pudding, haggis, fruit pudding and free-range eggs.',
    sortOrder: 7,
  },
  {
    name: 'Meat Packs',
    slug: 'meat-packs',
    description: 'Curated value packs that feed the family for less. Free home delivery on orders over £25.',
    sortOrder: 0,
  },
];

// ---------- Single products ----------

const singleProducts: Array<{
  name: string;
  category: string;
  price: number; // pence
  weight?: string;
  description: string;
  badge?: string;
  featured?: boolean;
}> = [
  // Beef
  {
    name: '7oz Sirloin Steak',
    category: 'beef',
    price: 850,
    weight: '7oz (approx 200g)',
    description: 'Matured for 21 days, well-marbled and hand-cut to order. The classic steakhouse cut.',
    badge: 'Bestseller',
    featured: true,
  },
  {
    name: '7oz Popeseye Steak',
    category: 'beef',
    price: 750,
    weight: '7oz (approx 200g)',
    description: 'Lean, full-flavoured rump cut, aged for tenderness. A Scottish butcher favourite.',
  },
  {
    name: '7oz Rump Steak',
    category: 'beef',
    price: 720,
    weight: '7oz (approx 200g)',
    description: 'Generously cut from the hindquarter — bold flavour and excellent value.',
  },
  {
    name: 'Lean Steak Mince (5% fat)',
    category: 'beef',
    price: 650,
    weight: '1lb (454g)',
    description: 'Coarse-ground from steak trimmings. Perfect for chilli, ragu and lean burgers.',
    featured: true,
  },
  {
    name: 'Lean Diced Beef (5% fat)',
    category: 'beef',
    price: 700,
    weight: '1lb (454g)',
    description: 'Hand-diced from prime cuts. Slow-cooks to spoon-tender for stews and casseroles.',
  },
  {
    name: '2lb Beef Roasting Joint',
    category: 'beef',
    price: 2400,
    weight: '2lb (approx 900g)',
    description: 'Topside or silverside, prepared for the oven and tied by hand. Sunday-lunch ready.',
    featured: true,
  },
  {
    name: 'Beef Olives',
    category: 'beef',
    price: 320,
    weight: 'each',
    description: 'Thinly sliced beef rolled around our house stuffing. A traditional Scottish dish.',
  },

  // Pork
  {
    name: '7oz Pork Loin Steak',
    category: 'pork',
    price: 480,
    weight: '7oz (approx 200g)',
    description: 'Tender loin steak, ready for the grill or pan. Lightly seasoned, pat dry and sear hot.',
  },
  {
    name: 'Pork Loin Links',
    category: 'pork',
    price: 380,
    weight: 'pack of 6',
    description: 'Coarse-ground pork in natural casings, made on site. Mild, peppery, very moreish.',
  },
  {
    name: 'Pork Olives',
    category: 'pork',
    price: 320,
    weight: 'each',
    description: 'Pork escalope rolled around sage-and-onion stuffing. Bake or pan-fry.',
  },

  // Chicken
  {
    name: 'Large Chicken Fillet',
    category: 'chicken',
    price: 380,
    weight: 'each, approx 200g',
    description: 'Plump, free-range fillets — generously sized and trimmed. Endlessly versatile.',
    badge: 'Free range',
    featured: true,
  },
  {
    name: '4oz Chicken Burger',
    category: 'chicken',
    price: 220,
    weight: '4oz patty',
    description: 'Seasoned chicken burgers made fresh in the shop. Grill or fry from frozen.',
  },

  // Fish
  {
    name: 'Scottish Salmon Fillet',
    category: 'fish',
    price: 700,
    weight: 'approx 180g',
    description: 'Skin-on, pin-boned fillet. Delivered fresh from the Scottish coast.',
    featured: true,
  },
  {
    name: 'Smoked Haddock',
    category: 'fish',
    price: 650,
    weight: 'approx 200g',
    description: 'Naturally smoked, undyed haddock. Beautiful in a kedgeree or with a poached egg.',
  },
  {
    name: 'King Prawns (raw, peeled)',
    category: 'fish',
    price: 850,
    weight: '200g',
    description: 'Sweet, plump king prawns. Toss into a stir-fry or thread onto skewers.',
  },
  {
    name: 'Cod Loin',
    category: 'fish',
    price: 750,
    weight: 'approx 180g',
    description: 'Thick, white, flaking cod loin. Bake with butter and lemon — perfection.',
  },

  // Sausages & Burgers
  {
    name: '4oz Steak Burger',
    category: 'sausages-burgers',
    price: 220,
    weight: '4oz patty',
    description: 'Pure beef burger, hand-pressed in the shop. Holds together beautifully on the grill.',
    badge: 'Bestseller',
    featured: true,
  },
  {
    name: '4oz Rump Steak Burger',
    category: 'sausages-burgers',
    price: 280,
    weight: '4oz patty',
    description: 'A step up — coarse-ground rump trim, lightly seasoned, pressed by hand.',
  },
  {
    name: 'Beef Sausage Links',
    category: 'sausages-burgers',
    price: 380,
    weight: 'pack of 6',
    description: 'Made on site to a long-standing recipe. Pleasingly meaty with a soft snap.',
  },

  // Pies & Bakery
  {
    name: 'Individual Steak Pie',
    category: 'pies-bakery',
    price: 320,
    weight: 'each',
    description: 'Tender beef in rich gravy under a flaky lid. A proper pie, made by hand.',
    badge: 'Bestseller',
    featured: true,
  },
  {
    name: 'Large Family Steak Pie',
    category: 'pies-bakery',
    price: 1495,
    weight: 'serves 4–6',
    description: 'Our flagship pie. Slow-braised steak in a deep dish — feeds a family.',
    featured: true,
  },
  {
    name: 'Scotch Pie',
    category: 'pies-bakery',
    price: 220,
    weight: 'each',
    description: 'Hot-water crust, peppery mutton-and-beef filling. Best eaten warm in the hand.',
  },
  {
    name: 'Potato Scones',
    category: 'pies-bakery',
    price: 250,
    weight: 'pack of 6',
    description: 'Soft, griddled tatty scones. The cornerstone of any good Scottish breakfast.',
  },

  // Breakfast & Sides
  {
    name: 'Steak Square Slice',
    category: 'breakfast-sides',
    price: 180,
    weight: 'each',
    description: "Lorne sausage at its best — the way it's meant to be. Made on the premises daily.",
    badge: 'Bestseller',
  },
  {
    name: 'Sweetcure Bacon',
    category: 'breakfast-sides',
    price: 350,
    weight: 'pack of 6 slices',
    description: 'Lightly cured back bacon with a touch of sweetness. Grills crisp without curling.',
    featured: true,
  },
  {
    name: 'Black Pudding',
    category: 'breakfast-sides',
    price: 220,
    weight: '4 slices',
    description: 'Traditional Scottish black pudding. Rich, peppery, perfectly seasoned.',
  },
  {
    name: 'Haggis Slice',
    category: 'breakfast-sides',
    price: 200,
    weight: '2 slices',
    description: 'Sliced haggis ready for the pan. Crisps up gloriously alongside eggs and toast.',
  },
  {
    name: 'Fruit Pudding Slice',
    category: 'breakfast-sides',
    price: 200,
    weight: '2 slices',
    description: 'Sweet, spiced fruit pudding — a sometimes-forgotten breakfast classic.',
  },
  {
    name: '6 Large Free Range Eggs',
    category: 'breakfast-sides',
    price: 280,
    weight: 'half-dozen',
    description: 'Large free-range eggs from a local farm. Bright yolks, beautiful flavour.',
    badge: 'Free range',
  },
  {
    name: 'Full Beef Lorne',
    category: 'breakfast-sides',
    price: 1200,
    weight: 'whole loaf',
    description: 'A whole, uncut beef Lorne sausage loaf. Slice thick, fry slow.',
  },
];

// ---------- Meat packs (transcribed from the in-shop price list) ----------

const meatPacks: Array<{
  name: string;
  price: number;
  contents: string[];
  description: string;
  featured?: boolean;
  badge?: string;
}> = [
  {
    name: 'Small Breakfast Pack',
    price: 1095,
    description:
      "Everything you need for a proper Scottish fry-up — square sausage, sweetcure bacon, black pudding and free-range eggs. Wakes the house up beautifully.",
    contents: [
      '4 Steak Square Slice',
      '4 Slice Sweetcure Bacon',
      '2 Black Pudding',
      '2 slice Haggis or Fruit Pudding',
      '6 Potato Scones',
      '6 Large Free Range Eggs',
    ],
    featured: true,
  },
  {
    name: 'Large Breakfast Pack',
    price: 1395,
    description:
      'For weekend mornings with the whole family. Every breakfast staple, in larger quantities.',
    contents: [
      '6 Steak Square',
      '6 Links, Beef or Pork',
      '6 Slice Sweetcure Bacon',
      '4 Slice Black Pudding',
      '2 Slice Haggis or Fruit Pudding',
      '6 Potato Scones',
      '6 Large Free Range Eggs',
    ],
  },
  {
    name: 'Mid-Week Pack',
    price: 2600,
    description:
      'A solid mid-week pack — pies for one night, steaks the next, mince and diced beef for whatever you fancy.',
    contents: [
      "2 Individual Steak Pie's",
      '2 x 6oz Rump Steaks',
      '2 x 6oz Pork Loin Steaks',
      'Half Pound Steak Mince',
      'Half Pound Diced Beef',
      '4 Steak Square',
      '4 Slice Sweetcure Bacon',
    ],
  },
  {
    name: "Slimmer's Pack",
    price: 4000,
    description:
      'Lean cuts, generous portions. Built around 5%-fat mince and diced beef, sirloin and chicken.',
    contents: [
      '2 7oz Sirloin Steaks',
      "3 Large Chicken Fillet's",
      '1lb Steak Mince (5% fat)',
      '1lb Diced Beef (5% fat)',
      '1lb Links, Beef or Pork',
      '10 Steak Square Slice',
      '3 x 4oz Steak Burgers',
    ],
    badge: 'Lean',
  },
  {
    name: "Manager's Special",
    price: 6000,
    description:
      "The shop favourite — a brilliantly-priced mix of steak, chicken, burgers, pork, mince and diced beef. The pack we sell most of.",
    contents: [
      "8 Large Chicken Fillet's",
      '4 x 7oz Sirloin Steaks',
      '4 x 4oz Steak Burgers',
      "4 x 7oz Pork Steak's",
      '1lb Diced Beef (5% fat)',
      '1lb Lean Steak Mince (5% fat)',
    ],
    badge: 'Bestseller',
    featured: true,
  },
  {
    name: 'Muscle Pack',
    price: 8500,
    description:
      "Built for protein-led households — sirloin, popeseye, rump, pork, chicken, burgers, mince, diced beef and eggs. Stocks the freezer for a fortnight.",
    contents: [
      "4 x 7oz Sirloin Steak's",
      "4 x 7oz Popeseye Steak's",
      "4 x 7oz Rump Steak's",
      "4 x 7oz Pork Steak's",
      "4 Chicken Fillet's",
      '4 x 4oz Steak Burgers',
      '4 x 4oz Chicken Burgers',
      '1lb Lean Steak Mince',
      '1lb Lean Diced Beef',
      "6 Steak Link's",
      '6 Pork Loin Links',
      '12 Large Free Range Eggs',
    ],
    featured: true,
  },
  {
    name: "Manager's Bumper Special",
    price: 7250,
    description:
      'A bumper hamper — family steak pie, sirloins, popeseye, mince, diced, chicken, links, bacon, black pudding, lorne, scones, eggs and pies.',
    contents: [
      'Large Family Steak Pie',
      "4 x 7oz Sirloin Steak's",
      '1lb Popeseye Steak',
      '1lb Lean Steak Mince',
      '1lb Lean Diced Beef',
      "1lb Chicken Fillet's",
      "1lb Beef or Pork Link's",
      '1lb Sweetcure Bacon',
      '1lb Black Pudding',
      'Full Beef Lorne',
      '12 Potato Scones',
      '12 Large Eggs',
      '4 Chicken Burgers',
      '4 Pies',
    ],
  },
  {
    name: '7 Day Saver',
    price: 4750,
    description:
      'Seven days of evening meals planned out — roasting joint, steaks, chicken, beef olives, burgers, mince and diced beef.',
    contents: [
      '2lb Beef Roasting Joint',
      "4 x 7oz Sirloin Steak's",
      "4 Chicken Fillet's",
      "4 Beef Olive's or Pork Steak's",
      "4 x 4oz Steak Burger's",
      '1lb Lean Diced Beef',
      '1lb Lean Steak Mince',
    ],
  },
  {
    name: 'Family Pack',
    price: 7500,
    description:
      'A generous family-sized hamper anchored by a roasting joint and our flagship family steak pie. Sunday lunch is sorted.',
    contents: [
      'Large Family Steak Pie',
      '2lb Beef Roasting Joint',
      "4 x 7oz Sirloin Steak's",
      "4 x 7oz Pork Steak's",
      '1lb Popeseye Steak',
      "1lb Chicken Fillet's",
      '1lb Lean Steak Mince',
      '1lb Lean Diced Beef',
      '1lb Steak Square Slice',
      "1lb Beef or Pork Link's",
      '1lb Sweetcure Bacon',
      "6 Scotch Pie's",
    ],
  },
  {
    name: 'B.B.Q. Pack',
    price: 2250,
    description:
      'Fire up the grill — rump, chicken, pork, burgers and pork links. Designed for four hungry people round the BBQ.',
    contents: [
      "4 x 4oz Rump Steak's",
      "4 x 4oz Chicken Fillet's",
      "4 x 4oz Pork Steak's",
      "4 x 4oz Steak Burger's",
      "4 Pork Link's",
    ],
    badge: 'Summer',
  },
  {
    name: 'Fit Pack',
    price: 3000,
    description:
      'High-protein and lean — chicken, beef olives or pork, 5%-fat mince, 5%-fat diced beef and square slice.',
    contents: [
      "4 Large Chicken Fillet's",
      "4 Beef Olive's or Pork Steak's",
      '1lb Steak Mince (5% fat)',
      '1lb Diced Beef (5% fat)',
      '4 Steak Square Slice',
    ],
    badge: 'Lean',
  },
];

// ---------- Promotions ----------

const seedPromotions = [
  {
    code: 'WELCOME10',
    description: '10% off your first order',
    type: 'percent_off' as const,
    value: 10,
    minimumOrderInPence: 2000,
    maxRedemptions: null,
    isActive: true,
  },
  {
    code: 'FREEDELIVERY',
    description: 'Free home delivery on any order',
    type: 'free_delivery' as const,
    value: 0,
    minimumOrderInPence: 0,
    maxRedemptions: null,
    isActive: true,
  },
  {
    code: 'WEEKEND5',
    description: '£5 off the Manager’s Bumper Special',
    type: 'amount_off' as const,
    value: 500,
    minimumOrderInPence: 5000,
    maxRedemptions: 100,
    isActive: true,
  },
];

// ---------- Reviews (from the customer's Google listing) ----------

const seedReviews = [
  {
    authorName: 'Lesley Rees',
    rating: 5,
    body:
      "Fantastic butchers, great prices for good quality produce. Steaks, chicken, steak pies, silverside — brilliant. Everyone should try, you won't be disappointed.",
    isFeatured: true,
  },
  {
    authorName: 'Valerie Bruce',
    rating: 5,
    body:
      'The quality of the meat is fab. Service is great — nothing too much trouble. Great to have a local "proper" butcher and none of that pre-packaged plastic stuff from supermarkets.',
    isFeatured: true,
  },
  {
    authorName: 'Audrey Redford',
    rating: 5,
    body:
      'Really helpful. Butcher meat is second to none. We are big fans of the sausages, both square and link. The steak pies are amazing. The Christmas packs are really good value for money too.',
    isFeatured: true,
  },
  {
    authorName: 'Suzanne Macdonald',
    rating: 5,
    body:
      'We are pretty fussy and are regular buyers from this butcher. Superb festive packs, steaks, pies, sausage, burgers and meat. Gary will go out of his way with any requests. Fantastic quality and always great offers on.',
    isFeatured: true,
  },
  {
    authorName: 'Lindsay Campbell',
    rating: 5,
    body:
      "I have been using Gary as my butchers for a few years. His stock is always of the highest quality with a brilliant selection. Packs available at fantastic prices — we personally love the Muscle Pack.",
    isFeatured: false,
  },
  {
    authorName: 'Ken Bruce',
    rating: 5,
    body:
      "Excellent butcher and fishmonger. Gary's shop has the finest meat and fish available in Erskine. We are regular customers and would highly recommend this business.",
    isFeatured: true,
  },
  {
    authorName: 'Caireen Broadbent',
    rating: 5,
    body:
      'Went here for the first time last week. The steak pies were great. Will definitely be back to try other meats.',
    isFeatured: false,
  },
];

// ---------- Runner ----------

async function main() {
  console.log('🌱  Seeding database…');

  console.log('  • Categories');
  const insertedCategories = await db
    .insert(categories)
    .values(seedCategories)
    .returning();

  const byCategorySlug = new Map(insertedCategories.map((c) => [c.slug, c]));

  console.log('  • Products');
  const productRows = singleProducts.map((p) => ({
    name: p.name,
    slug: slug(p.name),
    description: p.description,
    priceInPence: p.price,
    weightLabel: p.weight ?? null,
    categoryId: byCategorySlug.get(p.category)?.id,
    isFeatured: p.featured ?? false,
    badge: p.badge ?? null,
    isPack: false,
  }));
  await db.insert(products).values(productRows);

  console.log('  • Meat packs');
  const packRows = meatPacks.map((p) => ({
    name: p.name,
    slug: slug(p.name),
    description: p.description,
    priceInPence: p.price,
    packContents: p.contents,
    categoryId: byCategorySlug.get('meat-packs')?.id,
    isFeatured: p.featured ?? false,
    badge: p.badge ?? null,
    isPack: true,
  }));
  await db.insert(products).values(packRows);

  console.log('  • Promotions');
  await db.insert(promotions).values(seedPromotions);

  console.log('  • Reviews');
  await db.insert(reviews).values(seedReviews);

  console.log('✅  Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
