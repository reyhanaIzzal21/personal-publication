import { getPublishedPublicationsGroupedByType } from '@/lib/publications/queries';
import { ORDERED_CONTENT_TYPES } from '@/lib/publications/types';
import { PublicationItem } from '@/components/publications/PublicationItem';
import { getBaseUrl, SITE_CONFIG } from '@/lib/seo/config';

export const instant = false;

export default async function Home() {
  const { data: groupedPublications, error } = await getPublishedPublicationsGroupedByType();
  const baseUrl = getBaseUrl();

  const totalCount = groupedPublications
    ? Object.values(groupedPublications).reduce((acc, list) => acc + list.length, 0)
    : 0;

  const websiteStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: SITE_CONFIG.name,
        description: SITE_CONFIG.description,
        publisher: {
          '@id': `${baseUrl}/#author`,
        },
      },
      {
        '@type': 'Person',
        '@id': `${baseUrl}/#author`,
        name: SITE_CONFIG.author,
        url: baseUrl,
      },
    ],
  };

  return (
    <main className="max-w-[580px] w-full mx-auto px-4 sm:px-6 md:px-0 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
      />
      {/* Header / Masthead */}
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-primary tracking-normal">
          Reyhana Izzal
        </h1>
      </header>

      {/* Intro / Profile Biography */}
      <section className="space-y-4 mb-12 sm:mb-14 text-[16px] sm:text-[20px] leading-[1.65] text-text font-serif">
        <p>
          Reyhana Izzal is a Software Engineer and the Founder of Neurifly, a Hybrid SaaS platform providing customized, scalable digital ecosystems for the education and tutoring sector.
        </p>
        <p>
          Previously, he worked as a Full Stack and Backend Developer at PT Humma Teknologi Indonesia, focusing on enterprise system architecture, REST API design, and business process automation. He has also mentored emerging engineering talent and served as an industry assessor for software development competencies.
        </p>
        <p>
          Driven by an early intersection between economics and technology, Reyhana actively writes and publishes data-driven research, market analyses, and essays covering macroeconomics, financial systems, AI developments, and political economy.
        </p>
        <p>
          He was awarded 1st Place at the 2026 LKS Web Technologies competition (Regency level) and earned a Medallion for Excellence at the Provincial level.
        </p>
      </section>

      {/* Publications Listing by Content Type / Error / Empty State */}
      {error ? (
        <section className="border-t border-border pt-6 font-serif text-[15px] text-secondary">
          <p>Unable to load publications at this time. Please check back shortly.</p>
        </section>
      ) : totalCount === 0 ? (
        <section className="border-t border-border pt-6 font-serif text-[15px] text-secondary">
          <p>No publications published yet.</p>
        </section>
      ) : (
        <section className="space-y-10 sm:space-y-11">
          {ORDERED_CONTENT_TYPES.map((type) => {
            const pubs = groupedPublications?.[type] || [];
            if (pubs.length === 0) return null;

            return (
              <div key={type}>
                <h2 className="text-[22px] sm:text-[24px] font-semibold text-primary mb-3.5">
                  {type}
                </h2>
                <div>
                  {pubs.map((pub) => (
                    <PublicationItem key={pub.id} publication={pub} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
