export type BlogBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

export type BlogPost = {
  slug: string;
  title: string;
  category: string;
  metaDescription: string;
  publishDate: string; // ISO date
  excerpt: string;
  body: BlogBlock[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'sirloin-popeseye-rump-steak-guide',
    title: 'Sirloin, Popeseye or Rump: How to Choose Your Steak',
    category: 'Cut guides',
    metaDescription:
      "A butcher's guide to the difference between sirloin, popeseye and rump steak, and which cut suits which meal.",
    publishDate: '2026-08-18',
    excerpt:
      'Three of our most popular steak cuts, explained: what makes each one different, and how to pick the right one for what you\'re cooking.',
    body: [
      {
        type: 'paragraph',
        text: "We get asked most days which steak to go for, so here's the short version. All three of these cuts come from the hindquarter of the animal, and we cut all of them ourselves, usually to 7oz, though we're happy to cut thicker or thinner if you ask at the counter.",
      },
      { type: 'heading', text: 'Sirloin' },
      {
        type: 'paragraph',
        text: "Sirloin is the classic choice, and for good reason. It carries a bit more marbling than rump, which bastes the meat as it cooks and makes it more forgiving if you leave it on the pan a minute too long. If you want a reliably tender steak without overthinking it, this is the one.",
      },
      { type: 'heading', text: 'Popeseye' },
      {
        type: 'paragraph',
        text: 'Popeseye is a Scottish butchery term you won\'t see much outside Scotland. It\'s a lean, boneless cut, similar in character to a topside or rump, with very little fat running through it. It\'s a great everyday steak and tends to be kinder on the price than sirloin, but because it\'s lean it cooks faster and is easiest to get right at medium-rare rather than well done.',
      },
      { type: 'heading', text: 'Rump' },
      {
        type: 'paragraph',
        text: "Rump has a firmer texture and, in our view, the deepest flavour of the three. It rewards a good rest after cooking, five minutes under foil makes a real difference, and it's usually the best value cut of the three per pound.",
      },
      {
        type: 'list',
        items: [
          "Want the most reliably tender steak: go for sirloin.",
          "Want a lean, everyday steak that's easy on the price: go for popeseye.",
          "Want maximum flavour and don't mind a slightly firmer bite: go for rump.",
        ],
      },
      {
        type: 'paragraph',
        text: "All three also show up in several of our meat packs, including the Manager's Special and the Muscle Pack, if you'd rather stock up than buy one at a time. Whatever you pick, we cut it fresh on the day you collect or have it delivered.",
      },
    ],
  },
  {
    slug: 'how-to-choose-a-meat-pack',
    title: 'Which Meat Pack Should You Choose? A Guide to Our Packs',
    category: 'Meat packs',
    metaDescription:
      "A rundown of Gary's meat packs, from the Small Breakfast Pack to the Muscle Pack, and which one suits your household.",
    publishDate: '2026-07-22',
    excerpt:
      "We've built up over ten different meat packs on the price list over the years. Here's what's actually in the main ones, and who each one suits.",
    body: [
      {
        type: 'paragraph',
        text: "The packs started as a way to make it easier to shop for a full week rather than one meal at a time, and they've become one of the things we're best known for. They're all bagged fresh the day you collect or have them delivered, never pre-packed in advance. Here's how to pick between them.",
      },
      { type: 'heading', text: 'For breakfasts' },
      {
        type: 'paragraph',
        text: 'The Small and Large Breakfast Packs cover a proper Scottish fry-up: square sausage, sweetcure bacon, black pudding, haggis or fruit pudding, potato scones and free-range eggs. The Large version is built for a full house at the weekend rather than a weekday breakfast for one or two.',
      },
      { type: 'heading', text: 'For quick weeknight cooking' },
      {
        type: 'paragraph',
        text: "The Mid-Week Pack is exactly what it sounds like: a couple of steak pies for one night, rump and pork loin steaks for another, and mince and diced beef to fall back on for whatever you fancy. It's built around variety rather than bulk.",
      },
      { type: 'heading', text: 'For lean eating' },
      {
        type: 'paragraph',
        text: "The Slimmer's Pack and the Fit Pack are both built around 5%-fat mince and diced beef, lean chicken fillets and sirloin, with no fatty cuts padding out the price. The Fit Pack is the smaller, lighter option of the two.",
      },
      { type: 'heading', text: 'For stocking the freezer' },
      {
        type: 'paragraph',
        text: "The Muscle Pack and the Manager's Special are the two we sell the most of, and both are built for bulk. Between sirloin, popeseye, rump, pork, chicken, burgers, mince and diced beef, the Muscle Pack in particular is designed to stock a freezer for a couple of weeks rather than a single dinner.",
      },
      { type: 'heading', text: 'For a full week of dinners' },
      {
        type: 'paragraph',
        text: 'The 7 Day Saver plans out seven evening meals in one go: a roasting joint, sirloin steaks, chicken, beef olives, burgers, mince and diced beef, so you\'re not deciding what\'s for dinner from scratch every night.',
      },
      { type: 'heading', text: 'For a family occasion' },
      {
        type: 'paragraph',
        text: "The Family Pack and the Manager's Bumper Special are both anchored by our Large Family Steak Pie and a roasting joint, alongside a wide spread of steaks, mince, sausages, bacon and eggs. These are the ones people tend to buy for a full house over a weekend or a holiday.",
      },
      { type: 'heading', text: 'For the BBQ' },
      {
        type: 'paragraph',
        text: 'The B.B.Q. Pack is a summer-only pack: rump, chicken, pork, burgers and pork links, sized for four people round the grill.',
      },
      {
        type: 'paragraph',
        text: "If you're not sure which one fits, give us a call or ask at the counter. We'll happily talk through what's in each one and swap things around if there's something in a pack your household doesn't eat.",
      },
    ],
  },
  {
    slug: 'fishmonger-counter-guide',
    title: 'From the Fishmonger Counter: Salmon, Haddock, Cod and Prawns',
    category: 'Fish & seafood',
    metaDescription:
      "A simple guide to what's usually on our fishmonger counter, and the easiest way to cook each one at home.",
    publishDate: '2026-06-30',
    excerpt:
      "Our fish counter runs alongside the butchery, with deliveries landing fresh from the Scottish coast Tuesday to Saturday. Here's what's usually available, and how to cook it.",
    body: [
      {
        type: 'paragraph',
        text: "The fish counter gets less attention than the meat side of the shop, but it runs the same way: fresh deliveries through the week, nothing sitting around, and simple cooking is usually all it needs.",
      },
      { type: 'heading', text: 'Scottish salmon fillet' },
      {
        type: 'paragraph',
        text: "Our salmon comes skin-on and pin-boned, ready to go straight in the pan. Score the skin lightly, season, and cook skin-side down in a hot pan for most of the time so the skin crisps while the flesh stays soft. It's a forgiving fillet and hard to get wrong.",
      },
      { type: 'heading', text: 'Smoked haddock' },
      {
        type: 'paragraph',
        text: "Naturally smoked and undyed, so it's a paler colour than the bright yellow-dyed haddock you'll see in some supermarkets, but the flavour is better for it. It's the classic base for a kedgeree, or simply poached in milk with a poached egg on top.",
      },
      { type: 'heading', text: 'King prawns' },
      {
        type: 'paragraph',
        text: 'Raw and peeled, ready to cook. They only need a couple of minutes in a hot pan or on a skewer until they turn pink and opaque; overcooking is the only real way to go wrong with a prawn.',
      },
      { type: 'heading', text: 'Cod loin' },
      {
        type: 'paragraph',
        text: 'Thick and flaking, cod loin is best kept simple: bake it with butter and lemon, or pan-fry skin-side down until crisp. Because it\'s a thicker cut than a standard fillet, it holds together well and is easy to time.',
      },
      {
        type: 'paragraph',
        text: "If you're not sure what's freshest on a given day, ask at the counter when you're in, or give us a call before you order online. We're happy to point you toward whatever's just come in.",
      },
    ],
  },
  {
    slug: 'click-collect-vs-delivery',
    title: 'Click & Collect or Delivery? How Ordering From Us Works',
    category: 'Ordering & delivery',
    metaDescription:
      'How online ordering, click & collect and home delivery work at Gary\'s Butchers & Fishmongers in Erskine.',
    publishDate: '2026-05-14',
    excerpt:
      "A quick guide to ordering online, whether you're picking up in Erskine or having your order delivered to Renfrew, Inchinnan or Bridge of Weir.",
    body: [
      {
        type: 'paragraph',
        text: "Everything on the site can be ordered for click & collect or home delivery, and both work the same way at checkout: add what you need to the basket, then choose how and when you'd like it.",
      },
      { type: 'heading', text: 'Click & collect' },
      {
        type: 'paragraph',
        text: "There's no charge for click & collect. Choose a pickup slot at checkout and collect from the shop at 19 Park Glade Shops, Erskine, PA8 7HH. We're open Monday to Friday 7:30am to 5pm, and Saturday 7:30am to 2pm.",
      },
      { type: 'heading', text: 'Home delivery' },
      {
        type: 'paragraph',
        text: "We deliver to Erskine, Renfrew, Inchinnan, Bridge of Weir and the areas around them, priced by distance from the shop:",
      },
      {
        type: 'list',
        items: [
          'Within 5 miles: free',
          'Between 5 and 10 miles: £3.95',
          'Between 10 and 30 miles: £5, for bulk or larger orders we also offer a courier option, priced once the order is weighed',
        ],
      },
      { type: 'heading', text: 'Same-day delivery' },
      {
        type: 'paragraph',
        text: "Orders placed before 10am are usually delivered the same day. Anything placed after that goes out on the next available delivery slot, since everything is cut fresh to order rather than pulled from a pre-packed shelf.",
      },
      {
        type: 'paragraph',
        text: "Whichever option you choose, nothing is prepared until your order is placed. It's bagged and, where relevant, hand-cut to weight on the day you collect it or the day it goes out for delivery.",
      },
    ],
  },
  {
    slug: 'freezing-and-storing-your-order',
    title: 'How to Freeze and Store Your Meat Order',
    category: 'Tips & storage',
    metaDescription:
      'Simple, practical advice on freezing and storing a fresh meat or meat pack order so nothing goes to waste.',
    publishDate: '2026-04-09',
    excerpt:
      "Some of our packs, like the Muscle Pack and the 7 Day Saver, are built to stock a freezer for a couple of weeks. Here's how to freeze and store everything properly so it stays at its best.",
    body: [
      {
        type: 'paragraph',
        text: "A few of our packs, the Muscle Pack especially, are deliberately built to fill a freezer rather than be eaten in one go. If you're not using everything within a day or two of collection or delivery, here's how to keep it in good condition.",
      },
      { type: 'heading', text: 'Freeze it fresh' },
      {
        type: 'paragraph',
        text: "Get anything you're not using straight into the freezer rather than leaving it in the fridge for several days first. Fresh meat freezes better than meat that's already close to its use-by date.",
      },
      { type: 'heading', text: 'Portion before you freeze' },
      {
        type: 'paragraph',
        text: "Mince and diced beef in particular are much easier to use later if you split them into meal-sized portions before freezing, rather than defrosting the whole pound at once. A flat freezer bag, pressed thin, also defrosts faster than a solid block.",
      },
      { type: 'heading', text: 'Defrost in the fridge' },
      {
        type: 'paragraph',
        text: "The safest way to defrost anything is slowly, in the fridge, ideally overnight. Roasting joints and larger cuts need the longest, often a full day or two depending on size, so it's worth planning ahead for a Sunday roast rather than defrosting at room temperature on the day.",
      },
      { type: 'heading', text: 'Know your timings' },
      {
        type: 'list',
        items: [
          'Mince and diced beef: use within 2 to 3 months of freezing for the best texture',
          'Steaks and chops: 4 to 6 months',
          'Whole joints: up to 6 months',
          'Sausages, burgers and pies: 2 to 3 months',
        ],
      },
      {
        type: 'paragraph',
        text: "None of this is complicated, but it's the difference between a freezer pack that lasts you a fortnight in good condition, and one that ends up freezer-burnt at the back. If you're ever unsure about a specific cut, just ask us when you collect.",
      },
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getAllBlogCategories(): string[] {
  return Array.from(new Set(blogPosts.map((post) => post.category)));
}
