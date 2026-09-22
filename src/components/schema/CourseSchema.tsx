import { Helmet } from 'react-helmet-async';

interface CourseSchemaProps {
  title: string;
  description: string;
  slug: string;
  /** Raw price text as stored, e.g. "25,000 - 45,000 ฿" or "ฟรี". Parsed
   *  for the numbers actually present — never a guessed single price. */
  price?: string | null;
}

/** Pulls every number out of a Thai price string like "25,000 - 45,000 ฿"
 *  → [25000, 45000]. Returns [] for "ฟรี"/blank so no fabricated Offer
 *  gets attached to a free course. */
function extractPrices(raw?: string | null): number[] {
  if (!raw) return [];
  const matches = raw.replace(/,/g, '').match(/\d+(\.\d+)?/g);
  if (!matches) return [];
  return matches.map(Number).filter((n) => n > 0);
}

export const CourseSchema = ({ title, description, slug, price }: CourseSchemaProps) => {
  const prices = extractPrices(price);
  const url = `https://c365.ideas365.space/course/${slug}`;

  const offers =
    prices.length === 0
      ? undefined
      : prices.length === 1
      ? { '@type': 'Offer', price: prices[0], priceCurrency: 'THB', url }
      : {
          '@type': 'AggregateOffer',
          lowPrice: Math.min(...prices),
          highPrice: Math.max(...prices),
          priceCurrency: 'THB',
          url,
        };

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: title,
    description,
    url,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'Creatr365',
      url: 'https://c365.ideas365.space',
    },
    ...(offers ? { offers } : {}),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
