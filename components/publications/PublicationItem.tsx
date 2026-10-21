import Link from 'next/link';
import type { PublicationSummary } from '@/lib/publications/types';

interface PublicationItemProps {
  publication: PublicationSummary;
}

export function PublicationItem({ publication }: PublicationItemProps) {
  return (
    <article className="border-b border-border pb-2 mb-5">
      <div className="text-[14px] text-accent font-serif">
        {publication.subject}
      </div>
      <h3 className="text-[18px] sm:text-[20px] leading-snug font-semibold text-primary">
        <Link
          href={`/publications/${publication.slug}`}
          className="underline decoration-border hover:decoration-primary underline-offset-4 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          {publication.title}
        </Link>
      </h3>
      <p className="text-[12px] leading-relaxed text-secondary font-serif">
        {publication.subtitle}
      </p>
    </article>
  );
}
