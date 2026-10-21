'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  deletePublicationAction,
  togglePublicationStatusAction,
} from '@/app/admin/actions';
import type { AdminPublicationItem } from '@/lib/publications/types';

interface AdminPublicationsListProps {
  initialPublications: AdminPublicationItem[];
}

export function AdminPublicationsList({
  initialPublications,
}: AdminPublicationsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [publications, setPublications] = useState<AdminPublicationItem[]>(initialPublications);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(
    null
  );

  const totalCount = publications.length;
  const publishedCount = publications.filter((p) => p.status === 'published').length;
  const draftCount = totalCount - publishedCount;

  const handleToggleStatus = (pub: AdminPublicationItem) => {
    const nextStatus = pub.status === 'published' ? 'draft' : 'published';
    setStatusMessage(null);

    startTransition(async () => {
      const result = await togglePublicationStatusAction(pub.id, nextStatus);
      if (result.success) {
        setPublications((prev) =>
          prev.map((item) =>
            item.id === pub.id ? { ...item, status: nextStatus } : item
          )
        );
        setStatusMessage({
          text: `"${pub.title}" is now set to ${nextStatus}.`,
        });
        router.refresh();
      } else {
        setStatusMessage({
          text: result.error || 'Failed to update publication status.',
          isError: true,
        });
      }
    });
  };

  const handleDelete = async (id: string, title: string) => {
    setStatusMessage(null);
    startTransition(async () => {
      const result = await deletePublicationAction(id);
      if (result.success) {
        setPublications((prev) => prev.filter((p) => p.id !== id));
        setDeletingId(null);
        setStatusMessage({ text: `Publication "${title}" deleted successfully.` });
        router.refresh();
      } else {
        setStatusMessage({
          text: result.error || 'Failed to delete publication.',
          isError: true,
        });
        setDeletingId(null);
      }
    });
  };

  return (
    <div className="space-y-6 font-serif">
      {/* Metric Counters Bar */}
      <div className="grid grid-cols-3 gap-3 border border-border p-3 bg-[#F0EBE1] text-center text-sm">
        <div>
          <div className="text-xs uppercase tracking-wider text-secondary font-sans">
            Total Articles
          </div>
          <div className="text-xl font-semibold text-primary mt-0.5">{totalCount}</div>
        </div>
        <div className="border-x border-border">
          <div className="text-xs uppercase tracking-wider text-secondary font-sans">
            Published
          </div>
          <div className="text-xl font-semibold text-[#166534] mt-0.5">{publishedCount}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-secondary font-sans">
            Drafts
          </div>
          <div className="text-xl font-semibold text-[#854D0E] mt-0.5">{draftCount}</div>
        </div>
      </div>

      {/* Feedback Alert */}
      {statusMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`p-3.5 border text-sm leading-relaxed ${
            statusMessage.isError
              ? 'border-[#B91C1C]/40 bg-[#FEE2E2]/60 text-[#991B1B]'
              : 'border-[#166534]/40 bg-[#DCFCE7]/60 text-[#14532D]'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Empty State */}
      {publications.length === 0 ? (
        <div className="border border-border p-12 text-center space-y-4 bg-background">
          <p className="text-base text-secondary">
            No publications found in the database.
          </p>
          <p className="text-sm text-secondary">
            Click &ldquo;Create New Publication&rdquo; above to start drafting your first article.
          </p>
        </div>
      ) : (
        /* Publication List Table */
        <div className="border border-border overflow-x-auto bg-background">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-[#EAE3D2] text-[12px] uppercase font-sans tracking-wider text-secondary">
                <th className="py-3 px-4 font-medium">Title &amp; Subject</th>
                <th className="py-3 px-3 font-medium">Category</th>
                <th className="py-3 px-3 font-medium">Date</th>
                <th className="py-3 px-3 font-medium">PDF</th>
                <th className="py-3 px-3 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {publications.map((pub) => {
                const isItemDeleting = deletingId === pub.id;

                return (
                  <tr
                    key={pub.id}
                    className="hover:bg-[#F9F6F0] transition-colors"
                  >
                    {/* Title & Subject */}
                    <td className="py-3.5 px-4 max-w-[280px]">
                      <div className="font-semibold text-primary text-[15px] leading-snug">
                        {pub.title}
                      </div>
                      <div className="text-xs text-secondary mt-0.5">
                        {pub.subject}
                      </div>
                    </td>

                    {/* Content Type */}
                    <td className="py-3.5 px-3 text-secondary text-xs">
                      {pub.contentType}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-3 text-secondary text-xs font-mono">
                      {pub.publicationDate}
                    </td>

                    {/* PDF Indicator */}
                    <td className="py-3.5 px-3 text-xs">
                      {pub.hasPdf ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 bg-[#EAE3D2] text-primary text-[11px] font-sans"
                          title={pub.pdfFileName || 'PDF Attached'}
                        >
                          📄 PDF
                        </span>
                      ) : (
                        <span className="text-border text-xs">—</span>
                      )}
                    </td>

                    {/* Status Badge & Quick Toggle */}
                    <td className="py-3.5 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(pub)}
                        disabled={isPending}
                        title={`Click to ${pub.status === 'published' ? 'unpublish' : 'publish'}`}
                        className={`inline-block px-2.5 py-0.5 text-xs font-sans uppercase tracking-wider cursor-pointer border transition-colors ${
                          pub.status === 'published'
                            ? 'bg-[#DCFCE7] text-[#14532D] border-[#86EFAC] hover:bg-[#BBF7D0]'
                            : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] hover:bg-[#FDE68A]'
                        }`}
                      >
                        {pub.status}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3 text-xs">
                        <Link
                          href={`/admin/publications/${pub.id}/edit`}
                          className="text-primary underline decoration-border hover:decoration-primary underline-offset-4"
                        >
                          Edit
                        </Link>

                        {pub.status === 'published' && (
                          <Link
                            href={`/publications/${pub.slug}`}
                            target="_blank"
                            className="text-secondary hover:text-primary underline decoration-border hover:decoration-primary underline-offset-4"
                          >
                            View
                          </Link>
                        )}

                        {isItemDeleting ? (
                          <div className="inline-flex items-center gap-2 p-1.5 bg-[#FEE2E2] border border-[#B91C1C]/40 text-[#991B1B]">
                            <span className="text-[11px]">Delete permanently?</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(pub.id, pub.title)}
                              disabled={isPending}
                              className="font-bold underline cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              disabled={isPending}
                              className="text-secondary hover:text-primary cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingId(pub.id)}
                            disabled={isPending}
                            className="text-[#991B1B] hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
