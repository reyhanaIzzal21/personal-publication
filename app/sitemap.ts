import type { MetadataRoute } from 'next';
import { getPublishedPublications } from '@/lib/publications/queries';
import { getBaseUrl } from '@/lib/seo/config';


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const { data: publications } = await getPublishedPublications();

  const publicationEntries: MetadataRoute.Sitemap = (publications || []).map((pub) => {
    let lastMod = new Date();
    if (pub.publishedAt) {
      const parsed = new Date(pub.publishedAt);
      if (!isNaN(parsed.getTime())) {
        lastMod = parsed;
      }
    }

    return {
      url: `${baseUrl}/publications/${pub.slug}`,
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.8,
    };
  });

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...publicationEntries,
  ];
}
