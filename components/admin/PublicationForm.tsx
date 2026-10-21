'use client';

import { useState, useActionState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  createPublicationAction,
  updatePublicationAction,
  type PublicationActionState,
} from '@/app/admin/actions';
import type { EditorOutput } from '@/components/editor/PublicationEditor';
import type {
  ContentType,
  DatabasePublication,
  DatabasePublicationFile,
  PublicationStatus,
  Subject,
} from '@/lib/publications/types';

// Dynamic import with ssr:false prevents TipTap/ProseMirror from attempting
// server-side rendering. TipTap creates DOM nodes that React 19's strict
// reconciler cannot match during hydration, causing the `removeChild` crash.
const PublicationEditor = dynamic(
  () => import('@/components/editor/PublicationEditor').then((m) => ({ default: m.PublicationEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="border border-border p-8 text-center text-secondary font-serif text-sm">
        Loading editor...
      </div>
    ),
  }
);

interface PublicationFormProps {
  initialData?: {
    publication: DatabasePublication;
    file: DatabasePublicationFile | null;
    pdfSignedUrl?: string;
  };
}

const CONTENT_TYPES: ContentType[] = ['Research', 'Hypothesis', 'Essay', 'Analysis'];
const SUBJECTS: Subject[] = [
  'Economics & Markets',
  'Technology & AI',
  'Business & Organizations',
  'Society, Politics & Philosophy',
];

export function PublicationForm({ initialData }: PublicationFormProps) {
  const isEditing = Boolean(initialData?.publication?.id);

  // Pick corresponding server action
  const actionToUse = isEditing ? updatePublicationAction : createPublicationAction;
  const [state, formAction, isPending] = useActionState<PublicationActionState, FormData>(
    actionToUse,
    {}
  );

  const [title, setTitle] = useState(initialData?.publication?.title || '');
  const [subtitle, setSubtitle] = useState(initialData?.publication?.subtitle || '');
  const [contentType, setContentType] = useState<ContentType>(
    initialData?.publication?.content_type || 'Research'
  );
  const [subject, setSubject] = useState<Subject>(
    initialData?.publication?.subject || 'Technology & AI'
  );
  const [publicationDate, setPublicationDate] = useState(
    initialData?.publication?.publication_date || ''
  );
  const [status, setStatus] = useState<PublicationStatus>(
    initialData?.publication?.status || 'draft'
  );

  // Content state for hidden field
  const [contentJson, setContentJson] = useState<string>(
    JSON.stringify(initialData?.publication?.content || { version: 1, intro: [], sections: [] })
  );

  // PDF action state
  const [pdfAction, setPdfAction] = useState<'keep' | 'replace' | 'delete' | 'upload'>(
    initialData?.file ? 'keep' : 'upload'
  );
  const [selectedFileError, setSelectedFileError] = useState<string | null>(null);

  const handleEditorChange = (output: EditorOutput) => {
    setContentJson(JSON.stringify(output.structuredContent));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFileError(null);

    if (file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedFileError('Only PDF files are supported.');
        e.target.value = '';
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setSelectedFileError('File exceeds 25MB limit.');
        e.target.value = '';
        return;
      }
    }
  };

  return (
    <form action={formAction} className="space-y-8 font-serif">
      {/* Hidden Fields */}
      {isEditing && <input type="hidden" name="id" value={initialData?.publication.id} />}
      <input type="hidden" name="content" value={contentJson} />
      <input type="hidden" name="pdf_action" value={pdfAction} />

      {/* Form Feedback */}
      {state.error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 border border-[#B91C1C]/40 bg-[#FEE2E2]/60 text-[#991B1B] text-sm leading-relaxed"
        >
          {state.error}
        </div>
      )}

      {state.success && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 border border-[#166534]/40 bg-[#DCFCE7]/60 text-[#14532D] text-sm leading-relaxed flex items-center justify-between"
        >
          <span>Publication saved successfully.</span>
          {status === 'published' && state.slug && (
            <Link
              href={`/publications/${state.slug}`}
              target="_blank"
              className="underline hover:text-black font-sans text-xs uppercase tracking-wider"
            >
              View on Public Site →
            </Link>
          )}
        </div>
      )}

      {/* Main Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div className="md:col-span-2">
          <label htmlFor="title" className="block text-sm font-semibold text-primary mb-1.5">
            Publication Title <span className="text-[#991B1B]">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isPending}
            placeholder="e.g. A Quantitative Study of Market Valuation Models"
            className="w-full px-3.5 py-2.5 bg-background border border-border text-primary font-serif text-[17px] focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
          {state.fieldErrors?.title && (
            <p className="mt-1 text-xs text-[#991B1B]">{state.fieldErrors.title}</p>
          )}
        </div>

        {/* Subtitle */}
        <div className="md:col-span-2">
          <label htmlFor="subtitle" className="block text-sm font-semibold text-primary mb-1.5">
            Subtitle (Optional)
          </label>
          <input
            id="subtitle"
            name="subtitle"
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            disabled={isPending}
            placeholder="A brief editorial overview or thesis"
            className="w-full px-3.5 py-2.5 bg-background border border-border text-primary font-serif italic text-[16px] focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
          {state.fieldErrors?.subtitle && (
            <p className="mt-1 text-xs text-[#991B1B]">{state.fieldErrors.subtitle}</p>
          )}
        </div>

        {/* Content Type */}
        <div>
          <label htmlFor="content_type" className="block text-sm font-semibold text-primary mb-1.5">
            Content Type <span className="text-[#991B1B]">*</span>
          </label>
          <select
            id="content_type"
            name="content_type"
            value={contentType}
            onChange={(e) => setContentType(e.target.value as ContentType)}
            disabled={isPending}
            className="w-full px-3.5 py-2.5 bg-background border border-border text-primary font-serif text-[15px] focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          >
            {CONTENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {state.fieldErrors?.content_type && (
            <p className="mt-1 text-xs text-[#991B1B]">{state.fieldErrors.content_type}</p>
          )}
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-semibold text-primary mb-1.5">
            Subject <span className="text-[#991B1B]">*</span>
          </label>
          <select
            id="subject"
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value as Subject)}
            disabled={isPending}
            className="w-full px-3.5 py-2.5 bg-background border border-border text-primary font-serif text-[15px] focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          >
            {SUBJECTS.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
          {state.fieldErrors?.subject && (
            <p className="mt-1 text-xs text-[#991B1B]">{state.fieldErrors.subject}</p>
          )}
        </div>

        {/* Publication Date */}
        <div>
          <label htmlFor="publication_date" className="block text-sm font-semibold text-primary mb-1.5">
            Editorial Date (YYYY-MM-DD) <span className="text-[#991B1B]">*</span>
          </label>
          <input
            id="publication_date"
            name="publication_date"
            type="date"
            required
            value={publicationDate}
            onChange={(e) => setPublicationDate(e.target.value)}
            disabled={isPending}
            className="w-full px-3.5 py-2.5 bg-background border border-border text-primary font-serif text-[15px] focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
          {state.fieldErrors?.publication_date && (
            <p className="mt-1 text-xs text-[#991B1B]">{state.fieldErrors.publication_date}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-semibold text-primary mb-1.5">
            Status <span className="text-[#991B1B]">*</span>
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as PublicationStatus)}
            disabled={isPending}
            className="w-full px-3.5 py-2.5 bg-background border border-border text-primary font-serif text-[15px] focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          >
            <option value="draft">Draft (Private, not listed publicly)</option>
            <option value="published">Published (Live on homepage and detail page)</option>
          </select>
          {state.fieldErrors?.status && (
            <p className="mt-1 text-xs text-[#991B1B]">{state.fieldErrors.status}</p>
          )}
        </div>
      </div>

      {/* PDF Attachment Section */}
      <div className="border border-border p-5 bg-[#F9F6F0] space-y-4">
        <h2 className="text-base font-semibold text-primary font-serif">
          PDF Attachment (Optional, Max 1 PDF)
        </h2>

        {initialData?.file && pdfAction === 'keep' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="font-semibold text-primary">Current file:</span>{' '}
                <span className="text-text">{initialData.file.original_filename}</span>{' '}
                <span className="text-secondary text-xs">
                  ({Math.round(initialData.file.file_size_bytes / 1024)} KB)
                </span>
              </div>
              {initialData.pdfSignedUrl && (
                <a
                  href={initialData.pdfSignedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline text-secondary hover:text-primary"
                >
                  View / Download PDF ↗
                </a>
              )}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setPdfAction('replace')}
                className="text-xs px-2.5 py-1 bg-[#EAE3D2] border border-border text-primary hover:bg-border transition-colors cursor-pointer"
              >
                Replace with new PDF
              </button>
              <button
                type="button"
                onClick={() => setPdfAction('delete')}
                className="text-xs px-2.5 py-1 text-[#991B1B] border border-[#B91C1C]/30 hover:bg-[#FEE2E2] transition-colors cursor-pointer"
              >
                Remove attachment
              </button>
            </div>
          </div>
        )}

        {initialData?.file && pdfAction === 'replace' && (
          <div className="space-y-3">
            <p className="text-xs text-secondary">
              Replacing <strong>{initialData.file.original_filename}</strong>. Choose a new PDF file:
            </p>
            <input
              type="file"
              name="pdf_file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={isPending}
              className="block w-full text-sm text-secondary file:mr-4 file:py-2 file:px-4 file:border file:border-border file:bg-[#EAE3D2] file:text-primary file:font-serif file:text-xs hover:file:bg-border cursor-pointer"
            />
            <button
              type="button"
              onClick={() => {
                setPdfAction('keep');
                setSelectedFileError(null);
              }}
              className="text-xs text-secondary hover:text-primary underline"
            >
              Cancel replacement (keep original)
            </button>
          </div>
        )}

        {initialData?.file && pdfAction === 'delete' && (
          <div className="p-3 bg-[#FEE2E2]/60 border border-[#B91C1C]/30 text-xs text-[#991B1B] flex items-center justify-between">
            <span>Attachment marked for deletion upon saving.</span>
            <button
              type="button"
              onClick={() => setPdfAction('keep')}
              className="underline hover:text-primary"
            >
              Undo
            </button>
          </div>
        )}

        {(!initialData?.file || pdfAction === 'upload') && (
          <div className="space-y-2">
            <label htmlFor="pdf_file" className="block text-xs text-secondary">
              Attach a PDF manuscript or report (Max 25MB):
            </label>
            <input
              id="pdf_file"
              type="file"
              name="pdf_file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={isPending}
              className="block w-full text-sm text-secondary file:mr-4 file:py-2 file:px-4 file:border file:border-border file:bg-[#EAE3D2] file:text-primary file:font-serif file:text-xs hover:file:bg-border cursor-pointer"
            />
          </div>
        )}

        {(selectedFileError || state.fieldErrors?.pdf_file) && (
          <p className="text-xs text-[#991B1B]">
            {selectedFileError || state.fieldErrors?.pdf_file}
          </p>
        )}
      </div>

      {/* Rich-Text Article Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-base font-semibold text-primary font-serif">
            Article Content
          </label>
          <span className="text-xs text-secondary">
            Full rich text: Headings (H2/H3), Bold, Italic, Underline, Lists, Blockquotes, Links
          </span>
        </div>

        <PublicationEditor
          initialContent={initialData?.publication?.content}
          onChange={handleEditorChange}
          disabled={isPending}
        />
        {state.fieldErrors?.content && (
          <p className="mt-1 text-xs text-[#991B1B]">{state.fieldErrors.content}</p>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-6 border-t border-border">
        <Link
          href="/admin/publications"
          className="text-secondary hover:text-primary underline decoration-border hover:decoration-primary text-sm transition-colors"
        >
          ← Cancel and return
        </Link>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 bg-[#2A2825] text-white hover:bg-[#1A1816] transition-colors text-sm font-semibold cursor-pointer disabled:opacity-50 select-none"
          >
            {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Publication'}
          </button>
        </div>
      </div>
    </form>
  );
}
