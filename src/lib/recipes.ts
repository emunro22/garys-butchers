export type RecipePost = {
  slug: string;
  title: string;
  eyebrow: string;
  standfirst: string;
  readTime: string;
  publishedAt: string;
  body: { heading?: string; paragraphs: string[] }[];
  links: { label: string; href: string }[];
  recipe?: {
    prepTime: string;
    cookTime: string;
    totalTime: string;
    recipeYield: string;
    ingredients: string[];
    instructions: string[];
  };
};

export const recipes: RecipePost[] = [
  {
    slug: 'sunday-roast-rib-of-beef',
    title: 'How to Cook the Perfect Rib of Beef for Sunday Dinner',
    eyebrow: 'Cooking guide',
    standfirst:
      "A butcher's guide to picking, seasoning and roasting a rib of Scottish beef: timings, resting, and the gravy that goes with it.",
    readTime: '5 min read',
    publishedAt: '2026-01-12',
    body: [
      {
        paragraphs: [
          'Rib of beef is the one joint we sell out of first every Sunday morning, and for good reason: it bastes itself as it cooks, carves into generous slices, and forgives a few extra minutes in the oven if the family is running late. Here\'s how we\'d cook it at home.',
        ],
      },
      {
        heading: 'Choosing the joint',
        paragraphs: [
          "Ask for a rib on the bone if you can: the bone insulates the meat and keeps it juicier, and it makes for a better centrepiece at the table. As a rough guide, one rib feeds two to three people, so a two-rib joint comfortably feeds four to six. We hand-cut every rib joint to order, so let us know the head count and we'll cut accordingly.",
          'Take it out of the fridge an hour before it goes in the oven. A cold joint straight from the fridge cooks unevenly, giving you a well-done outer ring and a cool centre.',
        ],
      },
      {
        heading: 'Timings',
        paragraphs: [
          'For a joint on the bone, we work on 15 minutes at 240°C to seal it, then roughly 15 minutes per 450g at 180°C for medium-rare, a little longer for medium. A meat thermometer is the honest way to check: pull it out at 52–54°C for medium-rare, since it will climb another few degrees while it rests.',
          'Resting matters as much as the cooking. Give it at least 20 minutes under foil somewhere warm before carving. The juices redistribute through the meat instead of running out onto the board, and it makes carving neater too.',
        ],
      },
      {
        heading: 'The gravy',
        paragraphs: [
          "Don't wash the roasting tin. Sit it on the hob, add a splash of red wine and scrape up everything stuck to the bottom, since that's where the flavour is. Add beef stock, reduce by half, and finish with a knob of butter for shine.",
        ],
      },
    ],
    links: [
      { label: 'Shop beef', href: '/shop/beef' },
      { label: 'Browse meat packs', href: '/shop/meat-packs' },
      { label: 'More recipes', href: '/recipes' },
    ],
    recipe: {
      prepTime: 'PT15M',
      cookTime: 'PT1H30M',
      totalTime: 'PT2H5M',
      recipeYield: '6 servings',
      ingredients: [
        '1 two-rib joint of Scottish beef (approx. 2.5kg)',
        'Sea salt and freshly cracked black pepper',
        '2 tbsp olive oil or beef dripping',
        '1 onion, halved',
        '2 carrots, roughly chopped',
        'Splash of red wine',
        '500ml beef stock',
        'Knob of butter',
      ],
      instructions: [
        'Take the beef out of the fridge 1 hour before cooking so it comes up to room temperature.',
        'Preheat the oven to 240°C (fan 220°C). Season the joint generously with salt and pepper and rub with oil or dripping.',
        'Sit the beef on top of the onion and carrots in a roasting tin, which keeps it off the base and flavours the gravy.',
        'Roast for 15 minutes at 240°C, then turn down to 180°C (fan 160°C) and continue roasting, allowing roughly 15 minutes per 450g for medium-rare.',
        'Check with a meat thermometer, and remove at 52–54°C for medium-rare.',
        'Rest under foil for at least 20 minutes before carving.',
        'Make the gravy in the roasting tin with wine and stock while the beef rests, then carve and serve.',
      ],
    },
  },
  {
    slug: 'where-our-meat-comes-from',
    title: 'Where Our Meat Comes From: Sourcing Scottish Beef, Pork & Fish',
    eyebrow: 'Sourcing',
    standfirst:
      "A look at the farms and suppliers behind the counter: why we source Scottish where we can, and what that means for what ends up in your order.",
    readTime: '4 min read',
    publishedAt: '2025-11-03',
    body: [
      {
        paragraphs: [
          "One of the first questions customers ask when they walk in is where the meat comes from. It's a fair question, and one the big supermarket chains can rarely answer with a straight name and a place. We can.",
        ],
      },
      {
        heading: 'Scottish first',
        paragraphs: [
          'We buy Scottish beef, pork and chicken wherever we can, from farms and suppliers we deal with directly rather than through a faceless distribution chain. That matters for two reasons: it supports Scottish farming, and it means we know exactly what we\'re selling, cut for cut.',
          "The fish counter works the same way. Deliveries land fresh from the Scottish coast Tuesday to Saturday, so what's on the counter reflects the week's catch rather than a fixed order sheet.",
        ],
      },
      {
        heading: 'Why hand-cut matters',
        paragraphs: [
          "Every joint, steak and sausage in the shop is cut and prepared by hand on the premises, and nothing arrives pre-packed in plastic from a central factory. That's slower than buying in ready-portioned trays, but it means we can cut to the exact weight or thickness a customer wants, and it means what you're buying was still a whole carcass a day or two before it reaches your bag.",
        ],
      },
      {
        heading: 'Ask us',
        paragraphs: [
          "If you want to know more about a specific cut, where it's from, how it was reared, how to cook it, just ask at the counter. It's the kind of thing an independent butcher can tell you that a supermarket shelf can't.",
        ],
      },
    ],
    links: [
      { label: 'Our story', href: '/about' },
      { label: 'Shop all products', href: '/shop' },
      { label: 'More recipes', href: '/recipes' },
    ],
  },
  {
    slug: 'scottish-square-sausage-guide',
    title: "Square Sausage, Explained: Scotland's Breakfast Staple",
    eyebrow: 'Local flavour',
    standfirst:
      "What square sausage actually is, how we make ours, and the simplest way to cook a proper Scottish breakfast roll.",
    readTime: '3 min read',
    publishedAt: '2025-09-18',
    body: [
      {
        paragraphs: [
          'If you\'ve grown up in Scotland, square (or "Lorne") sausage needs no introduction. If you haven\'t, the shape is the first surprise: it\'s sliced from a block rather than twisted into links, so every slice fits a breakfast roll edge to edge with no gaps.',
        ],
      },
      {
        heading: "What's in it",
        paragraphs: [
          "Ours is minced beef and pork, seasoned simply and formed into a block in-store, then sliced to order: no fillers, no mystery ingredients. Customers across Erskine, Renfrew, Inchinnan and Bridge of Weir tend to buy it a few slices thick for the griddle, or ask us to slice it thinner for rolling into sausage rolls.",
        ],
      },
      {
        heading: 'How to cook it',
        paragraphs: [
          'A dry, hot pan is all you need: no oil, since there\'s enough fat in the mix to stop it sticking. Around 3–4 minutes a side on a medium-high heat until it\'s browned and cooked through. Don\'t press it down with the spatula, or you\'ll push the juice out and it\'ll dry out.',
          "Butter a soft floury roll, add the sausage, and a squeeze of brown sauce if you're doing it properly. That's a Scottish breakfast roll, simple, and hard to beat.",
        ],
      },
    ],
    links: [
      { label: 'Shop pork & ham', href: '/shop/pork-ham' },
      { label: 'Browse meat packs', href: '/shop/meat-packs' },
      { label: 'More recipes', href: '/recipes' },
    ],
    recipe: {
      prepTime: 'PT2M',
      cookTime: 'PT8M',
      totalTime: 'PT10M',
      recipeYield: '1 roll',
      ingredients: [
        '1–2 slices square sausage',
        '1 soft floury roll',
        'Butter',
        'Brown sauce, to serve',
      ],
      instructions: [
        'Heat a dry, heavy-based pan over medium-high heat.',
        'Add the square sausage and cook for 3–4 minutes per side, without pressing down, until browned and cooked through.',
        'Butter the roll while the sausage cooks.',
        'Add the sausage to the roll, finish with brown sauce, and serve immediately.',
      ],
    },
  },
];

export function getRecipeBySlug(slug: string): RecipePost | undefined {
  return recipes.find((r) => r.slug === slug);
}
