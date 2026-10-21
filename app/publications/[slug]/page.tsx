import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublishedPublicationBySlug } from '@/lib/publications/queries';
import { PublicationDetailLayout } from '@/components/publications/PublicationDetailLayout';

export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data: publication } = await getPublishedPublicationBySlug(slug);

  if (!publication) {
    return {
      title: 'Publication Not Found — Reyhana Izzal',
    };
  }

  return {
    title: `${publication.title} — Reyhana Izzal`,
    description: publication.subtitle || undefined,
  };
}

async function PublicationContent({ params }: PageProps) {
  const { slug } = await params;
  const { data: publication, error } = await getPublishedPublicationBySlug(slug);

  if (error || !publication) {
    notFound();
  }

  return <PublicationDetailLayout publication={publication} />;
}

export default function PublicationDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="max-w-[580px] w-full mx-auto px-4 sm:px-6 md:px-0 py-12">
          <div className="space-y-6 font-serif">
            <div className="h-4 bg-border/20 w-24"></div>
            <div className="h-8 bg-border/20 w-3/4"></div>
            <div className="h-4 bg-border/20 w-1/2"></div>
            <div className="space-y-3 pt-8">
              <div className="h-4 bg-border/20 w-full"></div>
              <div className="h-4 bg-border/20 w-full"></div>
              <div className="h-4 bg-border/20 w-4/5"></div>
            </div>
          </div>
        </main>
      }
    >
      <PublicationContent params={params} />
    </Suspense>
  );
}
