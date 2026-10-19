import { getPublicationsGroupedByType, ORDERED_CONTENT_TYPES } from '@/lib/mock-publications';
import { PublicationItem } from '@/components/publications/PublicationItem';

export default function Home() {
  const groupedPublications = getPublicationsGroupedByType();

  return (
    <main className="max-w-[580px] w-full mx-auto px-4 sm:px-6 md:px-0 py-6">
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

      {/* Publications Listing by Content Type */}
      <section className="space-y-10 sm:space-y-11">
        {ORDERED_CONTENT_TYPES.map((type) => {
          const pubs = groupedPublications[type] || [];
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
    </main>
  );
}
