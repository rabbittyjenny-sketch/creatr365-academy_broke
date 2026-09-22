import { Helmet } from 'react-helmet-async';

interface FAQSchemaItem {
  question: string;
  /** Plain text only — schema.org acceptedAnswer.text can't hold JSX, so
   *  any answer that includes a link in the visible UI gets a flattened,
   *  equally accurate plain-text version here (see FAQ.tsx). */
  answer: string;
}

export const FAQSchema = ({ items }: { items: FAQSchemaItem[] }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
