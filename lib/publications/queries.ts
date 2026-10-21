import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sanitizeHtml } from '@/lib/security/sanitize';
import {
  type AdminPublicationItem,
  type ContentType,
  type DatabasePublication,
  type DatabasePublicationFile,
  type PublicationDetail,
  type PublicationSummary,
  type StructuredSection,
} from './types';

/**
 * Result wrapper to distinguish empty query results from database/network errors
 */
export type QueryResult<T> =
  | { data: T; error: null }
  | { data: null; error: Error };

/**
 * Fetches all published publications from Supabase.
 *
 * Enforces RLS and status filter, selecting only listing metadata.
 * Ordered by publication_date DESC, created_at DESC matching database index idx_publications_published_listing.
 */
export async function getPublishedPublications(): Promise<QueryResult<PublicationSummary[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('publications')
      .select('id, slug, title, subtitle, content_type, subject, publication_date, published_at')
      .eq('status', 'published')
      .order('publication_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getPublishedPublications] Supabase query error:', error.message);
      return { data: null, error: new Error(error.message) };
    }

    if (!data) {
      return { data: [], error: null };
    }

    const summaries: PublicationSummary[] = data.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      subtitle: item.subtitle || '',
      contentType: item.content_type as ContentType,
      subject: item.subject,
      publishedAt: item.publication_date || item.published_at || new Date().toISOString(),
    }));

    return { data: summaries, error: null };
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      ('digest' in err || (err instanceof Error && err.message.includes('prerendering')))
    ) {
      throw err;
    }
    const error = err instanceof Error ? err : new Error('Unknown database error');
    console.error('[getPublishedPublications] Unexpected error:', error.message);
    return { data: null, error };
  }
}

/**
 * Fetches published publications and groups them by content type
 * according to the predefined ORDERED_CONTENT_TYPES taxonomy.
 */
export async function getPublishedPublicationsGroupedByType(): Promise<
  QueryResult<Record<ContentType, PublicationSummary[]>>
> {
  const result = await getPublishedPublications();

  if (result.error) {
    return { data: null, error: result.error };
  }

  const grouped: Record<ContentType, PublicationSummary[]> = {
    Research: [],
    Hypothesis: [],
    Essay: [],
    Analysis: [],
  };

  for (const pub of result.data) {
    if (grouped[pub.contentType]) {
      grouped[pub.contentType].push(pub);
    }
  }

  return { data: grouped, error: null };
}

/**
 * Helper to parse structured JSONB sections and extract paragraph text.
 * Accommodates both direct string arrays and block-based JSON formats.
 */
function parseStructuredSections(sections?: StructuredSection[]): PublicationDetail['sections'] {
  if (!sections || !Array.isArray(sections)) {
    return [];
  }

  return sections.map((sec) => {
    let paragraphs: string[] = [];

    if (Array.isArray(sec.paragraphs) && sec.paragraphs.length > 0) {
      paragraphs = sec.paragraphs;
    } else if (Array.isArray(sec.blocks) && sec.blocks.length > 0) {
      paragraphs = sec.blocks
        .filter((block) => block.type === 'paragraph' && typeof block.content === 'string')
        .map((block) => block.content as string);
    }

    const rawHtml =
      (sec as { html?: string; htmlContent?: string }).html ||
      (sec as { html?: string; htmlContent?: string }).htmlContent;
    const htmlContent = rawHtml ? sanitizeHtml(rawHtml) : undefined;

    return {
      id: sec.id,
      title: sec.title,
      subtitle: sec.subtitle,
      paragraphs,
      htmlContent,
    };
  });
}

/**
 * Fetches a single published publication by slug, joining its associated PDF file metadata.
 * Generates a temporary signed URL for verified published files.
 */
export async function getPublishedPublicationBySlug(
  slug: string
): Promise<QueryResult<PublicationDetail | null>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('publications')
      .select('*, publication_files(*)')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error) {
      console.error(`[getPublishedPublicationBySlug] Error fetching slug '${slug}':`, error.message);
      return { data: null, error: new Error(error.message) };
    }

    if (!data) {
      return { data: null, error: null };
    }

    const row = data as DatabasePublication & {
      publication_files: DatabasePublicationFile | DatabasePublicationFile[] | null;
    };

    // Extract PDF attachment metadata and generate signed URL if file exists
    let pdfAttachment: PublicationDetail['pdfAttachment'] = undefined;
    const rawFile = Array.isArray(row.publication_files)
      ? row.publication_files[0]
      : row.publication_files;

    if (rawFile && rawFile.storage_path) {
      // Use privileged server client to generate signed URLs for verified published articles
      const privilegedClient = createAdminClient();
      const storageClient = privilegedClient || supabase;

      // 1. View URL (inline view in browser tab, 2-hour duration)
      const { data: signedData, error: signedError } = await storageClient.storage
        .from('publication-attachments')
        .createSignedUrl(rawFile.storage_path, 7200);

      // 2. Download URL (forces Content-Disposition: attachment header)
      const { data: downloadData } = await storageClient.storage
        .from('publication-attachments')
        .createSignedUrl(rawFile.storage_path, 7200, {
          download: rawFile.original_filename || 'document.pdf',
        });

      if (!signedError && signedData?.signedUrl) {
        pdfAttachment = {
          url: signedData.signedUrl,
          downloadUrl: downloadData?.signedUrl || signedData.signedUrl,
          filename: rawFile.original_filename,
          title: rawFile.title || undefined,
          pageCount: rawFile.page_count || undefined,
          fileSizeBytes: Number(rawFile.file_size_bytes),
        };
      } else {
        console.warn(
          `[getPublishedPublicationBySlug] Could not create signed URL for file '${rawFile.storage_path}':`,
          signedError?.message
        );
      }
    }

    // Extract content structure
    const content = row.content || {};
    const rawIntro =
      Array.isArray(content.intro) && content.intro.length > 0
        ? content.intro
        : Array.isArray(content.introParagraphs)
        ? content.introParagraphs
        : [];
    const introParagraphs = rawIntro.map((item: string) =>
      typeof item === 'string' ? sanitizeHtml(item) : ''
    );

    const sections = parseStructuredSections(content.sections);

    const publication: PublicationDetail = {
      id: row.id,
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle || '',
      contentType: row.content_type,
      subject: row.subject,
      publishedAt: row.publication_date || row.published_at || row.created_at,
      introParagraphs,
      sections,
      pdfAttachment,
    };

    return { data: publication, error: null };
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      ('digest' in err || (err instanceof Error && err.message.includes('prerendering')))
    ) {
      throw err;
    }
    const error = err instanceof Error ? err : new Error('Unknown database error');
    console.error(`[getPublishedPublicationBySlug] Unexpected error for slug '${slug}':`, error.message);
    return { data: null, error };
  }
}

/**
 * Fetches all publications (draft and published) for the authenticated admin.
 * Protected by Supabase Row-Level Security and verifyAdmin.
 */
export async function getAllPublicationsForAdmin(): Promise<
  QueryResult<AdminPublicationItem[]>
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('publications')
      .select('id, slug, title, subtitle, content_type, subject, publication_date, status, published_at, created_at, updated_at, publication_files(id, original_filename)')
      .order('publication_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getAllPublicationsForAdmin] Supabase error:', error.message);
      return { data: null, error: new Error(error.message) };
    }

    if (!data) {
      return { data: [], error: null };
    }

    const items: AdminPublicationItem[] = data.map((item) => {
      const files = item.publication_files;
      const file = Array.isArray(files) ? files[0] : files;

      return {
        id: item.id,
        slug: item.slug,
        title: item.title,
        subtitle: item.subtitle,
        contentType: item.content_type as ContentType,
        subject: item.subject,
        publicationDate: item.publication_date,
        status: item.status,
        publishedAt: item.published_at,
        hasPdf: Boolean(file),
        pdfFileName: file?.original_filename,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      };
    });

    return { data: items, error: null };
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      ('digest' in err || (err instanceof Error && err.message.includes('prerendering')))
    ) {
      throw err;
    }
    const error = err instanceof Error ? err : new Error('Failed to load admin publications');
    console.error('[getAllPublicationsForAdmin] Unexpected error:', error.message);
    return { data: null, error };
  }
}

/**
 * Fetches a single publication by its ID for admin editing, including any attached file and signed download URL.
 */
export async function getPublicationByIdForAdmin(id: string): Promise<
  QueryResult<{
    publication: DatabasePublication;
    file: DatabasePublicationFile | null;
    pdfSignedUrl?: string;
  } | null>
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('publications')
      .select('*, publication_files(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`[getPublicationByIdForAdmin] Error fetching id '${id}':`, error.message);
      return { data: null, error: new Error(error.message) };
    }

    if (!data) {
      return { data: null, error: null };
    }

    const rawFile = Array.isArray(data.publication_files)
      ? data.publication_files[0]
      : data.publication_files;

    let pdfSignedUrl: string | undefined = undefined;

    if (rawFile && rawFile.storage_path) {
      const privilegedClient = createAdminClient();
      const storageClient = privilegedClient || supabase;

      const { data: signedData } = await storageClient.storage
        .from('publication-attachments')
        .createSignedUrl(rawFile.storage_path, 3600);

      if (signedData?.signedUrl) {
        pdfSignedUrl = signedData.signedUrl;
      }
    }

    return {
      data: {
        publication: data as DatabasePublication,
        file: (rawFile as DatabasePublicationFile) || null,
        pdfSignedUrl,
      },
      error: null,
    };
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      ('digest' in err || (err instanceof Error && err.message.includes('prerendering')))
    ) {
      throw err;
    }
    const error = err instanceof Error ? err : new Error('Failed to load publication');
    console.error(`[getPublicationByIdForAdmin] Unexpected error for id '${id}':`, error.message);
    return { data: null, error };
  }
}

