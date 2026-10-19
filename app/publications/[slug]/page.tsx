import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicationBySlug } from '@/lib/mock-publications';
import { PublicationDetailLayout } from '@/components/publications/PublicationDetailLayout';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const publication = getPublicationBySlug(slug);

  if (!publication) {
    return {
      title: 'Publication Not Found — Reyhana Izzal',
    };
  }

  return {
    title: `${publication.title} — Reyhana Izzal`,
    description: publication.subtitle,
  };
}

export default async function PublicationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const publication = getPublicationBySlug(slug);

  if (!publication) {
    notFound();
  }

  return <PublicationDetailLayout publication={publication} />;
}
