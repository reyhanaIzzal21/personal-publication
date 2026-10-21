'use server';

import { createClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { ContentType, PublicationStatus, Subject } from '@/lib/publications/types';

export interface LoginActionState {
  error?: string;
}

export interface PublicationActionState {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  publicationId?: string;
  /** Final slug saved to DB — used by the form to build the public URL link. */
  slug?: string;
}

const VALID_CONTENT_TYPES: ContentType[] = ['Research', 'Hypothesis', 'Essay', 'Analysis'];
const VALID_SUBJECTS: Subject[] = [
  'Economics & Markets',
  'Technology & AI',
  'Business & Organizations',
  'Society, Politics & Philosophy',
];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Converts a title string into a URL-safe slug.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'publication';
}

/**
 * Generates a slug from the title and ensures it is unique in the DB.
 * If the base slug already exists, appends -2, -3, ... until unique.
 * Pass `excludeId` when updating an existing publication so its own row
 * is not treated as a collision.
 */
async function generateUniqueSlug(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  title: string,
  excludeId?: string
): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  let attempt = 1;

  while (true) {
    let query = supabase
      .from('publications')
      .select('id')
      .eq('slug', candidate);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query.maybeSingle();

    if (!data) {
      // No collision — this slug is available
      return candidate;
    }

    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}

/**
 * Server Action for admin login.
 */
export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return { error: 'Please enter both email and password.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: 'Invalid email or password.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: 'Invalid email or password.' };
  }

  const role = data.user.app_metadata?.role;

  if (role !== 'admin') {
    await supabase.auth.signOut();
    return {
      error: 'Access denied: This account does not have administrator privileges.',
    };
  }

  redirect('/admin/publications');
}

/**
 * Server Action for signing out of admin session.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

/**
 * Validates common publication form fields (slug is NOT user-supplied;
 * it is generated server-side from the title after validation).
 */
function validatePublicationData(formData: FormData): {
  data?: {
    title: string;
    subtitle: string | null;
    contentType: ContentType;
    subject: Subject;
    publicationDate: string;
    status: PublicationStatus;
    content: Record<string, unknown>;
  };
  errors?: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const title = formData.get('title')?.toString().trim() || '';
  if (!title) {
    errors.title = 'Title is required and cannot be empty.';
  }

  const subtitleRaw = formData.get('subtitle')?.toString().trim();
  const subtitle = subtitleRaw && subtitleRaw.length > 0 ? subtitleRaw : null;

  const contentTypeRaw = formData.get('content_type')?.toString();
  if (!contentTypeRaw || !VALID_CONTENT_TYPES.includes(contentTypeRaw as ContentType)) {
    errors.content_type = 'Invalid content type selected.';
  }

  const subjectRaw = formData.get('subject')?.toString();
  if (!subjectRaw || !VALID_SUBJECTS.includes(subjectRaw as Subject)) {
    errors.subject = 'Invalid subject selected.';
  }

  const publicationDate = formData.get('publication_date')?.toString().trim() || '';
  if (!publicationDate || !DATE_REGEX.test(publicationDate)) {
    errors.publication_date = 'Publication date must be formatted as YYYY-MM-DD.';
  }

  const statusRaw = formData.get('status')?.toString();
  const status: PublicationStatus = statusRaw === 'published' ? 'published' : 'draft';

  const contentRaw = formData.get('content')?.toString() || '';
  let content: Record<string, unknown> = { version: 1, intro: [], sections: [] };
  if (contentRaw) {
    try {
      content = JSON.parse(contentRaw);
    } catch {
      errors.content = 'Content data format is invalid.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    data: {
      title,
      subtitle,
      contentType: contentTypeRaw as ContentType,
      subject: subjectRaw as Subject,
      publicationDate,
      status,
      content,
    },
  };
}

/**
 * Validates uploaded PDF file.
 */
function validatePdfFile(file: File | null): { valid: boolean; error?: string } {
  if (!file || file.size === 0) {
    return { valid: true };
  }

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return { valid: false, error: 'Only PDF documents (.pdf) are allowed.' };
  }

  if (file.size > MAX_PDF_BYTES) {
    return { valid: false, error: 'PDF file size exceeds maximum limit of 25MB.' };
  }

  return { valid: true };
}

/**
 * Server Action: Create a new publication (Draft or Published).
 */
export async function createPublicationAction(
  _prevState: PublicationActionState,
  formData: FormData
): Promise<PublicationActionState> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { error: 'Unauthorized: Administrator privileges required.' };
  }

  const validation = validatePublicationData(formData);
  if (validation.errors || !validation.data) {
    return { fieldErrors: validation.errors, error: 'Please correct the errors in the form.' };
  }

  const pdfFile = formData.get('pdf_file') as File | null;
  const pdfValidation = validatePdfFile(pdfFile);
  if (!pdfValidation.valid) {
    return { fieldErrors: { pdf_file: pdfValidation.error || 'Invalid PDF file.' } };
  }

  const supabase = await createClient();

  // Auto-generate a unique slug from the title
  const slug = await generateUniqueSlug(supabase, validation.data.title);

  const insertPayload = {
    title: validation.data.title,
    slug,
    subtitle: validation.data.subtitle,
    content_type: validation.data.contentType,
    subject: validation.data.subject,
    publication_date: validation.data.publicationDate,
    status: validation.data.status,
    content: validation.data.content,
    published_at: validation.data.status === 'published' ? new Date().toISOString() : null,
  };

  const { data: newPub, error: insertError } = await supabase
    .from('publications')
    .insert(insertPayload)
    .select('id, slug')
    .single();

  if (insertError || !newPub) {
    console.error('[createPublicationAction] Database insert error:', insertError?.message);
    return { error: `Failed to create publication: ${insertError?.message || 'Unknown database error'}` };
  }

  // Handle PDF upload if attached
  if (pdfFile && pdfFile.size > 0) {
    const cleanFileName = pdfFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `publications/${newPub.id}/${Date.now()}_${cleanFileName}`;

    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('publication-attachments')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('[createPublicationAction] Storage upload error:', uploadError.message);
      return {
        error: `Publication created, but PDF upload failed: ${uploadError.message}. You can attach the PDF in Edit mode.`,
        publicationId: newPub.id,
        slug: newPub.slug,
      };
    }

    // Insert metadata into publication_files
    const { error: fileMetaError } = await supabase
      .from('publication_files')
      .insert({
        publication_id: newPub.id,
        storage_path: storagePath,
        original_filename: pdfFile.name,
        mime_type: 'application/pdf',
        file_size_bytes: pdfFile.size,
      });

    if (fileMetaError) {
      console.error('[createPublicationAction] File metadata error:', fileMetaError.message);
      await supabase.storage.from('publication-attachments').remove([storagePath]);
    }
  }

  revalidatePath('/');
  revalidatePath('/admin/publications');
  revalidatePath(`/publications/${newPub.slug}`);

  redirect('/admin/publications');
}

/**
 * Server Action: Update an existing publication.
 */
export async function updatePublicationAction(
  _prevState: PublicationActionState,
  formData: FormData
): Promise<PublicationActionState> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { error: 'Unauthorized: Administrator privileges required.' };
  }

  const id = formData.get('id')?.toString();
  if (!id) {
    return { error: 'Missing publication ID.' };
  }

  const validation = validatePublicationData(formData);
  if (validation.errors || !validation.data) {
    return { fieldErrors: validation.errors, error: 'Please correct the errors in the form.' };
  }

  const pdfAction = formData.get('pdf_action')?.toString() || 'keep';
  const pdfFile = formData.get('pdf_file') as File | null;

  if (pdfAction === 'replace' && (!pdfFile || pdfFile.size === 0)) {
    return { fieldErrors: { pdf_file: 'Please select a PDF file to replace the existing one.' } };
  }

  if (pdfFile && pdfFile.size > 0) {
    const pdfValidation = validatePdfFile(pdfFile);
    if (!pdfValidation.valid) {
      return { fieldErrors: { pdf_file: pdfValidation.error || 'Invalid PDF file.' } };
    }
  }

  const supabase = await createClient();

  // Verify publication exists
  const { data: existingPub, error: fetchError } = await supabase
    .from('publications')
    .select('id, title, slug, status, published_at, publication_files(id, storage_path)')
    .eq('id', id)
    .single();

  if (fetchError || !existingPub) {
    return { error: 'Publication not found.' };
  }

  // Regenerate unique slug if title was updated or if slug was missing;
  // otherwise preserve current slug.
  const isTitleChanged = validation.data.title.trim() !== (existingPub.title || '').trim();
  const slug = isTitleChanged || !existingPub.slug
    ? await generateUniqueSlug(supabase, validation.data.title, id)
    : existingPub.slug;

  // Determine published_at value
  let publishedAt = existingPub.published_at;
  if (validation.data.status === 'published' && !publishedAt) {
    publishedAt = new Date().toISOString();
  }

  const updatePayload = {
    title: validation.data.title,
    slug,
    subtitle: validation.data.subtitle,
    content_type: validation.data.contentType,
    subject: validation.data.subject,
    publication_date: validation.data.publicationDate,
    status: validation.data.status,
    content: validation.data.content,
    published_at: publishedAt,
  };

  const { error: updateError } = await supabase
    .from('publications')
    .update(updatePayload)
    .eq('id', id);

  if (updateError) {
    console.error('[updatePublicationAction] Database update error:', updateError.message);
    return { error: `Failed to update publication: ${updateError.message}` };
  }

  const existingFiles = existingPub.publication_files;
  const existingFile = Array.isArray(existingFiles) ? existingFiles[0] : existingFiles;

  // Handle PDF deletion
  if (pdfAction === 'delete' && existingFile) {
    if (existingFile.storage_path) {
      await supabase.storage.from('publication-attachments').remove([existingFile.storage_path]);
    }
    await supabase.from('publication_files').delete().eq('publication_id', id);
  }

  // Handle PDF upload or replacement
  if ((pdfAction === 'replace' || (pdfAction === 'upload' && !existingFile)) && pdfFile && pdfFile.size > 0) {
    const cleanFileName = pdfFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const newStoragePath = `publications/${id}/${Date.now()}_${cleanFileName}`;

    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('publication-attachments')
      .upload(newStoragePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('[updatePublicationAction] Storage upload error:', uploadError.message);
      return { error: `Publication updated, but PDF upload failed: ${uploadError.message}` };
    }

    if (existingFile) {
      // Update metadata row
      const { error: metaUpdateError } = await supabase
        .from('publication_files')
        .update({
          storage_path: newStoragePath,
          original_filename: pdfFile.name,
          mime_type: 'application/pdf',
          file_size_bytes: pdfFile.size,
        })
        .eq('publication_id', id);

      if (!metaUpdateError) {
        // Clean up old storage object safely only after metadata has shifted
        if (existingFile.storage_path && existingFile.storage_path !== newStoragePath) {
          await supabase.storage.from('publication-attachments').remove([existingFile.storage_path]);
        }
      } else {
        console.error('[updatePublicationAction] File metadata update error:', metaUpdateError.message);
        await supabase.storage.from('publication-attachments').remove([newStoragePath]);
        return { error: `Failed to update PDF metadata: ${metaUpdateError.message}` };
      }
    } else {
      // Insert new metadata row
      const { error: metaInsertError } = await supabase.from('publication_files').insert({
        publication_id: id,
        storage_path: newStoragePath,
        original_filename: pdfFile.name,
        mime_type: 'application/pdf',
        file_size_bytes: pdfFile.size,
      });

      if (metaInsertError) {
        console.error('[updatePublicationAction] File metadata insert error:', metaInsertError.message);
        await supabase.storage.from('publication-attachments').remove([newStoragePath]);
        return { error: `Failed to save PDF metadata: ${metaInsertError.message}` };
      }
    }
  }

  revalidatePath('/');
  revalidatePath('/admin/publications');
  if (existingPub.slug && existingPub.slug !== slug) {
    revalidatePath(`/publications/${existingPub.slug}`);
  }
  revalidatePath(`/publications/${slug}`);

  return { success: true, publicationId: id, slug };
}

/**
 * Server Action: Quick toggle of publication status (Draft <-> Published).
 */
export async function togglePublicationStatusAction(
  id: string,
  newStatus: 'draft' | 'published'
): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { success: false, error: 'Unauthorized.' };
  }

  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from('publications')
    .select('id, slug, status, published_at')
    .eq('id', id)
    .single();

  if (fetchError || !current) {
    return { success: false, error: 'Publication not found.' };
  }

  const updatePayload: { status: 'draft' | 'published'; published_at?: string | null } = {
    status: newStatus,
  };

  if (newStatus === 'published' && !current.published_at) {
    updatePayload.published_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from('publications')
    .update(updatePayload)
    .eq('id', id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath('/');
  revalidatePath('/admin/publications');
  revalidatePath(`/publications/${current.slug}`);

  return { success: true };
}

/**
 * Server Action: Delete a publication and its attached PDF permanently.
 */
export async function deletePublicationAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { success: false, error: 'Unauthorized.' };
  }

  const supabase = await createClient();

  // Find publication and associated storage files
  const { data: pub, error: fetchError } = await supabase
    .from('publications')
    .select('id, slug, publication_files(storage_path)')
    .eq('id', id)
    .single();

  if (fetchError || !pub) {
    return { success: false, error: 'Publication not found.' };
  }

  const files = pub.publication_files;
  const file = Array.isArray(files) ? files[0] : files;

  // Clean up Storage object if it exists
  if (file && file.storage_path) {
    const { error: storageError } = await supabase.storage
      .from('publication-attachments')
      .remove([file.storage_path]);

    if (storageError) {
      console.warn('[deletePublicationAction] Warning: Failed to delete Storage file:', storageError.message);
    }
  }

  // Delete publication row (CASCADE will remove publication_files row)
  const { error: deleteError } = await supabase.from('publications').delete().eq('id', id);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  revalidatePath('/');
  revalidatePath('/admin/publications');
  revalidatePath(`/publications/${pub.slug}`);

  return { success: true };
}
