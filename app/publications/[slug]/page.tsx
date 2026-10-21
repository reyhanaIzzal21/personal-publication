import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublishedPublicationBySlug } from '@/lib/publications/queries';
import { PublicationDetailLayout } from '@/components/publications/PublicationDetailLayout';
import { extractCleanDescription, getBaseUrl, SITE_CONFIG } from '@/lib/seo/config';

export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data: publication } = await getPublishedPublicationBySlug(slug);

  if (!publication) {
    return {
      title: 'Publication Not Found',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const rawDescription =
    publication.subtitle ||
    publication.introParagraphs?.[0] ||
    publication.sections?.[0]?.paragraphs?.[0] ||
    `${publication.contentType} on ${publication.subject} by ${SITE_CONFIG.author}`;

  const description = extractCleanDescription(rawDescription, 160);
  const canonicalUrl = `/publications/${publication.slug}`;

  return {
    title: publication.title,
    description: description || undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: publication.title,
      description: description || undefined,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      type: 'article',
      publishedTime: publication.publishedAt,
      authors: [SITE_CONFIG.author],
      section: publication.subject,
      tags: [publication.contentType, publication.subject],
    },
    twitter: {
      card: 'summary_large_image',
      title: publication.title,
      description: description || undefined,
    },
  };
}

async function PublicationContent({ params }: PageProps) {
  const { slug } = await params;
  const { data: publication, error } = await getPublishedPublicationBySlug(slug);

  if (error || !publication) {
    notFound();
  }

  const baseUrl = getBaseUrl();
  const rawDescription =
    publication.subtitle ||
    publication.introParagraphs?.[0] ||
    publication.sections?.[0]?.paragraphs?.[0] ||
    `${publication.contentType} by ${SITE_CONFIG.author}`;
  const description = extractCleanDescription(rawDescription, 160);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: publication.title,
    description: description || undefined,
    datePublished: publication.publishedAt,
    dateModified: publication.publishedAt,
    author: {
      '@type': 'Person',
      name: SITE_CONFIG.author,
      url: baseUrl,
    },
    publisher: {
      '@type': 'Person',
      name: SITE_CONFIG.author,
      url: baseUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/publications/${publication.slug}`,
    },
    image: `${baseUrl}/publications/${publication.slug}/opengraph-image`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <PublicationDetailLayout publication={publication} />
    </>
  );
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
