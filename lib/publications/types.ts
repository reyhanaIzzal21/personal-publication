export type ContentType = 'Research' | 'Hypothesis' | 'Essay' | 'Analysis';

export type Subject =
  | 'Economics & Markets'
  | 'Technology & AI'
  | 'Business & Organizations'
  | 'Society, Politics & Philosophy';

export type PublicationStatus = 'draft' | 'published';

export const ORDERED_CONTENT_TYPES: ContentType[] = [
  'Research',
  'Hypothesis',
  'Essay',
  'Analysis',
];

/**
 * Raw database row from public.publications
 */
export interface DatabasePublication {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  content_type: ContentType;
  subject: Subject;
  publication_date: string; // ISO date string (YYYY-MM-DD)
  status: PublicationStatus;
  content: StructuredContent;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Raw database row from public.publication_files
 */
export interface DatabasePublicationFile {
  id: string;
  publication_id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  page_count: number | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Structured content inside publications.content JSONB
 */
export interface ContentBlock {
  type: string;
  content?: string;
  level?: number;
  id?: string;
  title?: string;
  items?: string[];
  [key: string]: unknown;
}

export interface StructuredSection {
  id: string;
  title: string;
  subtitle?: string;
  paragraphs?: string[];
  blocks?: ContentBlock[];
  html?: string;
  htmlContent?: string;
}

export interface StructuredContent {
  version?: number;
  intro?: string[];
  introParagraphs?: string[];
  sections?: StructuredSection[];
  [key: string]: unknown;
}

/**
 * Article section formatted for the frontend TOC and reader
 */
export interface ArticleSection {
  id: string;
  title: string;
  subtitle?: string;
  paragraphs: string[];
  htmlContent?: string;
}

/**
 * Publication representation for admin dashboard listing
 */
export interface AdminPublicationItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  contentType: ContentType;
  subject: Subject;
  publicationDate: string;
  status: PublicationStatus;
  publishedAt: string | null;
  hasPdf: boolean;
  pdfFileName?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * PDF attachment formatted for PdfAttachmentBox component
 */
export interface PdfAttachment {
  url: string;
  downloadUrl?: string;
  filename: string;
  title?: string;
  pageCount?: number;
  fileSizeBytes?: number;
  fileSizeDisplay?: string;
}

/**
 * Full publication representation for detail page
 */
export interface PublicationDetail {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  contentType: ContentType;
  subject: Subject;
  publishedAt: string;
  readingTimeMinutes?: number;
  contentHtml?: string;
  pdfAttachment?: PdfAttachment;
  introParagraphs?: string[];
  sections?: ArticleSection[];
}

/**
 * Summary publication representation for homepage listing
 */
export interface PublicationSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  contentType: ContentType;
  subject: Subject;
  publishedAt: string;
}
