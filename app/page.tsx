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
          Dario Amodei is the CEO of{' '}
          <a
            href="https://www.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-border hover:decoration-primary underline-offset-4 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            Anthropic
          </a>
          , a public benefit corporation dedicated to building AI systems that are steerable, interpretable and safe.
        </p>
        <p>
          Previously, Dario served as Vice President of Research at OpenAI, where he led the development of large language models like GPT-2 and GPT-3. He is also the co-inventor of reinforcement learning from human feedback. Before joining OpenAI, he worked at Google Brain as a Senior Research Scientist.
        </p>
        <p>
          Dario earned his doctorate degree in biophysics from Princeton University as a Hertz Fellow, and was a postdoctoral scholar at the Stanford University School of Medicine.
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
