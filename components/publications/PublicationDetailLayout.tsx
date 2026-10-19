'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Publication } from '@/lib/mock-publications';
import { TableOfContents, type TocItem } from '@/components/navigation/TableOfContents';
import { PdfAttachmentBox } from '@/components/publications/PdfAttachmentBox';

interface PublicationDetailLayoutProps {
  publication: Publication;
}

// Minimal Icons
function HamburgerIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function PublicationDetailLayout({ publication }: PublicationDetailLayoutProps) {
  // Navigation State
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>('');

  // Extract TOC items from article sections
  const tocItems: TocItem[] = useMemo(() => {
    const items: TocItem[] = [];
    if (publication.introParagraphs && publication.introParagraphs.length > 0) {
      items.push({ id: 'introduction', title: 'Introduction' });
    }
    if (publication.sections) {
      for (const section of publication.sections) {
        items.push({ id: section.id, title: section.title });
      }
    }
    return items;
  }, [publication]);

  // Active section tracking via IntersectionObserver
  useEffect(() => {
    if (tocItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      {
        rootMargin: '-20% 0% -60% 0%',
        threshold: 0,
      }
    );

    for (const item of tocItems) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [tocItems]);

  // Body scroll-lock when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Formatted date string (e.g. "January 20, 2025")
  const formattedDate = new Date(publication.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background text-text">
      {/* =========================================================================
          MOBILE HEADER (Viewport < 1024px)
          Screenshot 1: Author name on left, Hamburger/Close on top-right
      ========================================================================= */}
      <header className="lg:hidden flex items-center justify-between px-4 sm:px-6 py-6 border-b border-border/40">
        <Link
          href="/"
          className="text-2xl sm:text-3xl font-semibold text-primary font-serif tracking-normal [text-decoration:none]! no-underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          Reyhana Izzal
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close contents' : 'Open contents'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-contents-panel"
          className="p-1 text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          {isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
        </button>
      </header>

      {/* =========================================================================
          MOBILE CONTENTS PANEL (Expanded state from Screenshot 1)
      ========================================================================= */}
      {isMobileMenuOpen && (
        <div
          id="mobile-contents-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Table of contents"
          className="lg:hidden fixed inset-0 z-[999] w-screen h-screen bg-background flex flex-col animate-in fade-in duration-150"
        >
          {/* Overlay Header — mirrors the mobile header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-6 border-b border-border/40 shrink-0">
            <span className="text-2xl sm:text-3xl font-semibold text-primary font-serif tracking-normal">
              Reyhana Izzal
            </span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close contents"
              className="p-1 text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <CloseIcon />
            </button>
          </div>

          {/* TOC Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            <TableOfContents
              items={tocItems}
              activeId={activeId}
              onItemClick={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          DESKTOP SIDEBAR (Viewport >= 1024px)
          Screenshot 2: Sits on the left side of viewport independently of 580px column
      ========================================================================= */}
      <aside
        aria-label="Publication table of contents"
        className="hidden lg:block fixed left-[max(1.5rem,calc(50%-510px))] top-12 z-20 w-[185px]"
      >
        {/* Toggle Button (✕ when open, ☰ when closed) */}
        <div className="mb-6">
          <button
            onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
            aria-label={isDesktopSidebarOpen ? 'Close contents' : 'Open contents'}
            aria-expanded={isDesktopSidebarOpen}
            aria-controls="desktop-contents-panel"
            className="p-1 text-primary hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            {isDesktopSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>

        {/* Contents List (Hidden when toggled closed) */}
        {isDesktopSidebarOpen && (
          <div
            id="desktop-contents-panel"
            className="max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 animate-in fade-in duration-150"
          >
            <TableOfContents items={tocItems} activeId={activeId} />
          </div>
        )}
      </aside>

      {/* =========================================================================
          MAIN ARTICLE COLUMN (Max width exactly 580px)
          Centered on desktop, responsive padding on mobile
      ========================================================================= */}
      <main className="max-w-[580px] w-full mx-auto px-4 sm:px-6 md:px-0 py-6">
        {/* Author Masthead (visible on desktop, links back to homepage) */}
        <div className="hidden lg:block mb-8">
          <Link
            href="/"
            className="text-2xl sm:text-3xl font-semibold text-primary font-serif tracking-normal [text-decoration:none]! no-underline hover:opacity-85 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            Reyhana Izzal
          </Link>
        </div>

        {/* Article Header Metadata */}
        <header className="mb-8">
          {/* Subject */}
          <div className="text-[14px] text-accent font-serif mb-2">
            {publication.subject}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-[30px] font-semibold text-primary font-serif leading-tight mb-2 tracking-normal">
            {publication.title}
          </h1>

          {/* Subtitle */}
          <p className="text-[15.5px] sm:text-[16.5px] text-secondary italic font-serif leading-relaxed mb-4">
            {publication.subtitle}
          </p>

          {/* Metadata Line: Date . ContentType */}
          <div className="text-[13px] text-secondary font-serif">
            {formattedDate} . {publication.contentType}
          </div>
        </header>

        {/* PDF Attachment Box (Conditional on attachment existence) */}
        {publication.pdfAttachment && (
          <PdfAttachmentBox attachment={publication.pdfAttachment} />
        )}

        {/* Article Body */}
        <article className="text-text font-serif">
          {/* Introduction Section */}
          {publication.introParagraphs && publication.introParagraphs.length > 0 && (
            <div id="introduction" className="scroll-mt-16 space-y-4 mb-10 text-[16px] sm:text-[17px] leading-[1.65]">
              {publication.introParagraphs.map((para, index) => (
                <p key={index}>{para}</p>
              ))}
            </div>
          )}

          {/* Formatted Article Sections */}
          {publication.sections && publication.sections.length > 0 && (
            <div className="space-y-10">
              {publication.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-16">
                  {/* Section Title */}
                  <h2 className="text-[20px] sm:text-[22px] font-semibold text-primary mb-2 font-serif leading-snug">
                    {section.title}
                  </h2>

                  {/* Section Subtitle (if available) */}
                  {section.subtitle && (
                    <p className="text-[15.5px] text-secondary italic font-serif mb-4">
                      {section.subtitle}
                    </p>
                  )}

                  {/* Section Paragraphs */}
                  <div className="space-y-4 text-[16px] sm:text-[17px] leading-[1.65]">
                    {section.paragraphs.map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Fallback ContentHtml (if sections not specified) */}
          {(!publication.sections || publication.sections.length === 0) && publication.contentHtml && (
            <div
              className="space-y-4 text-[16px] sm:text-[17px] leading-[1.65]"
              dangerouslySetInnerHTML={{ __html: publication.contentHtml }}
            />
          )}
        </article>

        {/* Subtle Footer Separator */}
        <hr className="editorial-divider mt-16 mb-8" />
        <div className="text-center">
          <Link
            href="/"
            className="text-secondary text-sm font-serif underline decoration-border hover:decoration-primary underline-offset-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            ← Back to publications
          </Link>
        </div>
      </main>
    </div>
  );
}
