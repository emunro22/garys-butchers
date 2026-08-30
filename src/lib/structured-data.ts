const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Approximate town-centre coordinates for Erskine, Renfrewshire (PA8) —
// good enough for a LocalBusiness listing, not a precise street geocode.
const SHOP_GEO = { latitude: 55.9049, longitude: -4.4564 };

type ReviewSummary = {
  authorName: string;
  rating: number;
  body: string;
  publishedAt: Date | string;
};

export function buildLocalBusinessJsonLd(opts: {
  name: string;
  address: string;
  phone: string;
  reviews: ReviewSummary[];
  reviewCount: number;
  averageRating: number;
}) {
  const businessId = `${SITE_URL}/#business`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['GroceryStore', 'LocalBusiness'],
        '@id': businessId,
        name: opts.name,
        url: SITE_URL,
        image: `${SITE_URL}/logo.png`,
        telephone: opts.phone,
        priceRange: '££',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '19 Park Glade Shops',
          addressLocality: 'Erskine',
          postalCode: 'PA8 7HH',
          addressCountry: 'GB',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: SHOP_GEO.latitude,
          longitude: SHOP_GEO.longitude,
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '07:30',
            closes: '17:00',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: 'Saturday',
            opens: '07:30',
            closes: '14:00',
          },
        ],
        ...(opts.reviewCount > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: Number(opts.averageRating.toFixed(1)),
                reviewCount: opts.reviewCount,
                bestRating: 5,
              },
            }
          : {}),
        review: opts.reviews.map((r) => ({
          '@type': 'Review',
          author: { '@type': 'Person', name: r.authorName },
          reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
          reviewBody: r.body,
          datePublished: new Date(r.publishedAt).toISOString().slice(0, 10),
        })),
      },
      {
        '@type': 'Service',
        serviceType: 'Home meat & fish delivery',
        provider: { '@id': businessId },
        areaServed: ['Erskine', 'Renfrew', 'Inchinnan', 'Bridge of Weir'].map((name) => ({
          '@type': 'City',
          name,
        })),
        description:
          'Free home delivery within 5 miles of the shop; paid delivery available up to 30 miles. Click & collect also available with no charge.',
      },
      {
        '@type': 'WebSite',
        url: SITE_URL,
        name: opts.name,
      },
    ],
  };
}

export function buildFaqPageJsonLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}
