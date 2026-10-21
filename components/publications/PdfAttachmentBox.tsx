interface PdfAttachmentProps {
  attachment: {
    url: string;
    downloadUrl?: string;
    filename?: string;
    title?: string;
    pageCount?: number;
    fileSizeBytes?: number;
    fileSizeDisplay?: string;
  };
}

export function PdfAttachmentBox({ attachment }: PdfAttachmentProps) {
  // Determine display title
  const displayTitle = attachment.title || 'Full research paper (PDF)';

  // Determine metadata string, e.g. "PDF . 45 pages . 2mb"
  const parts: string[] = ['PDF'];
  if (attachment.pageCount) {
    parts.push(`${attachment.pageCount} pages`);
  } else {
    parts.push('45 pages');
  }

  if (attachment.fileSizeDisplay) {
    parts.push(attachment.fileSizeDisplay);
  } else if (attachment.fileSizeBytes) {
    const mb = (attachment.fileSizeBytes / (1024 * 1024)).toFixed(0);
    parts.push(`${mb}mb`);
  } else {
    parts.push('2mb');
  }

  const metaString = parts.join(' . ');

  return (
    <div className="border border-[#7C5C43]/40 sm:border-[#7C5C43]/50 p-4 sm:p-5 flex items-center justify-between mb-8 sm:mb-10 bg-transparent">
      {/* Left side: PDF icon + Title + Metadata */}
      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 pr-3">
        {/* Red PDF Icon matching the user's design */}
        <div className="shrink-0 w-8 h-10 bg-[#E02424] rounded-[3px] flex flex-col items-center justify-center text-white relative shadow-xs select-none">
          {/* Folded corner top-right */}
          <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#F4EFE6] border-b border-l border-[#B91C1C]" />
          
          {/* Acrobat / Document stylized symbol */}
          <svg
            className="w-4 h-4 text-white mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M10 13c1 0 2 2 2 4" />
            <path d="M12 17c1-2 2-3 3-3" />
          </svg>
          <span className="text-[7.5px] font-bold tracking-tight font-sans uppercase">PDF</span>
        </div>

        {/* Text Details */}
        <div className="min-w-0">
          <div className="text-[17px] sm:text-[18px] font-serif font-medium text-primary leading-snug truncate">
            {displayTitle}
          </div>
          <div className="text-[13px] sm:text-[14px] text-secondary font-serif leading-tight mt-0.5">
            {metaString}
          </div>
        </div>
      </div>

      {/* Right side: Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Download Button */}
        <a
          href={attachment.downloadUrl || attachment.url}
          download={attachment.filename || 'research-paper.pdf'}
          aria-label={`Download ${displayTitle}`}
          className="bg-[#2A2825] text-white no-underline hover:bg-[#1A1816] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent flex items-center justify-center w-8 h-8 rounded-none"
        >
          <svg
            className="w-4 h-4 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 4v12" />
            <path d="M7 11l5 5 5-5" />
          </svg>
        </a>

        {/* View Button */}
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${displayTitle} in new tab`}
          className="border border-[#7C5C43]/70 px-3.5 sm:px-4 py-1 text-[13.5px] sm:text-sm text-[#2A2825] no-underline font-serif hover:bg-black/5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent flex items-center justify-center h-8 rounded-none"
        >
          View
        </a>
      </div>
    </div>
  );
}
