'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { useCallback, useState } from 'react';
import type { JSONContent } from '@tiptap/react';
import { sanitizeHtml } from '@/lib/security/sanitize';
import type { StructuredContent, StructuredSection } from '@/lib/publications/types';

export interface EditorOutput {
  tiptapJson: JSONContent;
  structuredContent: StructuredContent;
  htmlContent: string;
}

interface PublicationEditorProps {
  initialContent?: StructuredContent | null;
  onChange: (output: EditorOutput) => void;
  disabled?: boolean;
}

function slugifyHeading(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML renderer for Tiptap JSON — single source-of-truth serializer.
// Handles ALL node types and marks. Every save goes through this path.
// ─────────────────────────────────────────────────────────────────────────────

function isSafeHref(href: string): boolean {
  const t = href.trim().toLowerCase();
  if (t.startsWith('/') || t.startsWith('#') || t.startsWith('mailto:')) return true;
  try {
    const parsed = new URL(t);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Renders a single Tiptap inline text node with all its marks applied. */
function renderTextNode(node: JSONContent): string {
  if (node.type !== 'text') return '';
  let text = (node.text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (!node.marks || node.marks.length === 0) return text;

  for (const mark of node.marks) {
    switch (mark.type) {
      case 'bold':
        text = '<strong>' + text + '</strong>';
        break;
      case 'italic':
        text = '<em>' + text + '</em>';
        break;
      case 'underline':
        text = '<u>' + text + '</u>';
        break;
      case 'strike':
        text = '<s>' + text + '</s>';
        break;
      case 'code':
        text = '<code>' + text + '</code>';
        break;
      case 'link': {
        const href = (mark.attrs?.href as string) || '';
        if (href && isSafeHref(href)) {
          const safe = href.replace(/"/g, '&quot;');
          text = '<a href="' + safe + '" target="_blank" rel="noopener noreferrer">' + text + '</a>';
        }
        break;
      }
    }
  }
  return text;
}

/** Renders inline children of a block node (text nodes and hard breaks). */
function renderInlineContent(children: JSONContent[]): string {
  return children
    .map((child) => {
      if (child.type === 'text') return renderTextNode(child);
      if (child.type === 'hardBreak') return '<br>';
      if (child.content) return renderInlineContent(child.content);
      return '';
    })
    .join('');
}

/** Extracts raw unescaped plain text from inline nodes (for headings, slugs, and fallback plain text). */
function extractPlainText(children: JSONContent[]): string {
  return children
    .map((child) => {
      if (child.type === 'text') return child.text ?? '';
      if (child.type === 'hardBreak') return '\n';
      if (child.content) return extractPlainText(child.content);
      return '';
    })
    .join('');
}

/**
 * Renders a single Tiptap block node to an HTML string.
 * Handles: paragraph, heading, bulletList, orderedList, listItem,
 * blockquote, codeBlock, horizontalRule, hardBreak, and unknown fallbacks.
 */
function renderBlockNode(node: JSONContent): string {
  switch (node.type) {
    case 'paragraph': {
      const inner = renderInlineContent(node.content ?? []);
      return inner ? '<p>' + inner + '</p>' : '<p>&nbsp;</p>';
    }
    case 'heading': {
      const level = (node.attrs?.level as number) ?? 2;
      const inner = renderInlineContent(node.content ?? []);
      return '<h' + level + '>' + inner + '</h' + level + '>';
    }
    case 'bulletList': {
      const items = (node.content ?? []).map(renderBlockNode).join('');
      return '<ul>' + items + '</ul>';
    }
    case 'orderedList': {
      const start = (node.attrs?.start as number) ?? 1;
      const items = (node.content ?? []).map(renderBlockNode).join('');
      return start !== 1 ? '<ol start="' + start + '">' + items + '</ol>' : '<ol>' + items + '</ol>';
    }
    case 'listItem': {
      // listItem contains paragraph(s) + possibly nested lists.
      // Render paragraph content inline in <li>; recurse for nested lists.
      const parts = (node.content ?? []).map((child) => {
        if (child.type === 'paragraph') return renderInlineContent(child.content ?? []);
        return renderBlockNode(child);
      });
      return '<li>' + parts.join('') + '</li>';
    }
    case 'blockquote': {
      const inner = (node.content ?? []).map(renderBlockNode).join('');
      return '<blockquote>' + inner + '</blockquote>';
    }
    case 'codeBlock': {
      const lang = (node.attrs?.language as string) || '';
      const code = (node.content ?? [])
        .map((child) =>
          child.type === 'text'
            ? (child.text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            : ''
        )
        .join('');
      const langAttr = lang ? ' data-language="' + lang + '"' : '';
      return '<pre' + langAttr + '><code>' + code + '</code></pre>';
    }
    case 'horizontalRule':
      return '<hr>';
    case 'hardBreak':
      return '<br>';
    default:
      if (node.content) return node.content.map(renderBlockNode).join('');
      return '';
  }
}

/**
 * Converts a full Tiptap document JSON into editorial StructuredContent.
 *
 * Canonical sources stored per save:
 * - tiptap: original JSON (editor reload — 100% fidelity)
 * - intro:  HTML strings for content before the first H2
 * - introParagraphs: plain-text fallback
 * - sections[n].html: full HTML for each section body
 * - sections[n].paragraphs: plain-text fallback
 */
export function parseTiptapToStructuredContent(doc: JSONContent): StructuredContent {
  const contentNodes = doc.content ?? [];
  const introHtmlParts: string[] = [];
  const introParagraphs: string[] = [];
  const sections: StructuredSection[] = [];

  type SectionAcc = {
    id: string;
    title: string;
    htmlParts: string[];
    paragraphs: string[];
  };

  let current: SectionAcc | null = null;
  const usedIds = new Set<string>();

  function uniqueId(base: string): string {
    if (!usedIds.has(base)) { usedIds.add(base); return base; }
    let n = 2;
    while (usedIds.has(base + '-' + n)) n++;
    const id = base + '-' + n;
    usedIds.add(id);
    return id;
  }

  function flush() {
    if (!current) return;
    sections.push({
      id: current.id,
      title: current.title,
      paragraphs: current.paragraphs,
      blocks: [],
      html: current.htmlParts.join(''),
    } as StructuredSection & { html: string });
    current = null;
  }

  for (const node of contentNodes) {
    if (node.type === 'heading' && (node.attrs?.level as number) === 2) {
      flush();
      const headingText = extractPlainText(node.content ?? []).trim();
      const sectionId = uniqueId(slugifyHeading(headingText));
      current = {
        id: sectionId,
        title: headingText || 'Untitled Section',
        htmlParts: [],
        paragraphs: [],
      };
    } else {
      const html = renderBlockNode(node);
      if (current) {
        current.htmlParts.push(html);
        if (node.type === 'paragraph') {
          const plain = extractPlainText(node.content ?? []).trim();
          if (plain) current.paragraphs.push(plain);
        }
      } else {
        introHtmlParts.push(html);
        if (node.type === 'paragraph') {
          const plain = extractPlainText(node.content ?? []).trim();
          if (plain) introParagraphs.push(plain);
        }
      }
    }
  }

  flush();

  return {
    version: 1,
    intro: introHtmlParts,   // HTML strings — what the renderer uses
    introParagraphs,         // plain-text fallback
    sections,
    tiptap: doc,             // canonical JSON for editor reload
  };
}

export function PublicationEditor({
  initialContent,
  onChange,
  disabled = false,
}: PublicationEditorProps) {
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  // Reconstitute initial editor state
  const getInitialEditorContent = (): JSONContent | string => {
    if (!initialContent) {
      return '';
    }
    // If we have saved tiptap JSON directly, use it for 100% fidelity
    if (initialContent.tiptap && typeof initialContent.tiptap === 'object') {
      return initialContent.tiptap as JSONContent;
    }
    if ((initialContent as { type?: string }).type === 'doc') {
      return initialContent as JSONContent;
    }

    // Otherwise reconstruct HTML string from sections & intro for Tiptap's DOM parser
    let html = '';
    const intros = initialContent.intro || initialContent.introParagraphs || [];
    for (const p of intros) {
      if (typeof p === 'string' && p.trim()) {
        html += p.trim().startsWith('<') ? p : `<p>${p}</p>`;
      }
    }

    if (initialContent.sections && Array.isArray(initialContent.sections)) {
      for (const sec of initialContent.sections) {
        html += `<h2>${sec.title}</h2>`;
        const secHtml = sec.html || sec.htmlContent;
        if (secHtml) {
          html += secHtml;
        } else if (sec.paragraphs) {
          for (const p of sec.paragraphs) {
            html += `<p>${p}</p>`;
          }
        }
      }
    }

    return html;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class:
            'underline decoration-border hover:decoration-primary underline-offset-4 transition-colors duration-150',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
        validate: (href) => /^https?:\/\//.test(href) || href.startsWith('/') || href.startsWith('#'),
      }),
    ],
    content: getInitialEditorContent(),
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'tiptap-editor min-h-[360px] w-full p-4 bg-transparent border border-border focus:outline-none focus:border-primary text-text font-serif text-[16.5px] leading-[1.7] transition-colors',
      },
    },
    onUpdate: ({ editor }) => {
      const tiptapJson = editor.getJSON();
      const rawHtml = editor.getHTML();
      const sanitized = sanitizeHtml(rawHtml);
      const structured = parseTiptapToStructuredContent(tiptapJson);

      onChange({
        tiptapJson,
        structuredContent: structured,
        htmlContent: sanitized,
      });
    },
  });

  // Handle setting link
  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setLinkModalOpen(true);
  }, [editor]);

  const confirmLink = () => {
    if (!editor) return;

    if (linkUrl.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      let finalUrl = linkUrl.trim();
      if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith('/') && !finalUrl.startsWith('#')) {
        finalUrl = `https://${finalUrl}`;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
    }
    setLinkModalOpen(false);
    setLinkUrl('');
  };

  if (!editor) {
    return (
      <div className="border border-border p-8 text-center text-secondary font-serif text-sm">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="border border-border bg-background">
      {/* Editorial Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-[#F0EBE1] text-secondary font-serif text-[13.5px]">
        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled || !editor.can().chain().focus().toggleBold().run()}
          className={`px-2.5 py-1 transition-colors border ${
            editor.isActive('bold')
              ? 'bg-[#1A1816] text-[#F4EFE6] border-[#1A1816] font-bold'
              : 'border-transparent hover:border-border hover:bg-background text-primary'
          }`}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled || !editor.can().chain().focus().toggleItalic().run()}
          className={`px-2.5 py-1 transition-colors border italic ${
            editor.isActive('italic')
              ? 'bg-[#1A1816] text-[#F4EFE6] border-[#1A1816]'
              : 'border-transparent hover:border-border hover:bg-background text-primary'
          }`}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={disabled}
          className={`px-2.5 py-1 transition-colors border underline underline-offset-2 ${
            editor.isActive('underline')
              ? 'bg-[#1A1816] text-[#F4EFE6] border-[#1A1816]'
              : 'border-transparent hover:border-border hover:bg-background text-primary'
          }`}
          title="Underline (Ctrl+U)"
        >
          U
        </button>

        <span className="text-border px-1">|</span>

        {/* Heading 2 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
          className={`px-2.5 py-1 transition-colors border font-semibold ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-[#1A1816] text-[#F4EFE6] border-[#1A1816]'
              : 'border-transparent hover:border-border hover:bg-background text-primary'
          }`}
          title="Heading 2 (Creates TOC Section)"
        >
          H2
        </button>

        {/* Heading 3 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={disabled}
          className={`px-2.5 py-1 transition-colors border font-medium text-xs ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-[#1A1816] text-[#F4EFE6] border-[#1A1816]'
              : 'border-transparent hover:border-border hover:bg-background text-primary'
          }`}
          title="Heading 3 (Sub-heading)"
        >
          H3
        </button>

        <span className="text-border px-1">|</span>

        {/* Strikethrough */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={disabled}
          className={`px-2.5 py-1 transition-colors border line-through ${
            editor.isActive('strike')
              ? 'bg-[#1A1816] text-[#F4EFE6] border-[#1A1816]'
              : 'border-transparent hover:border-border hover:bg-background text-primary'
          }`}
          title="Strikethrough"
        >
          S
        </button>

        {/* Inline Code */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={disabled}
          className={`px-2.5 py-1 transition-colors border font-mono text-xs ${
            editor.isActive('code')
              ? 'bg-[#1A1816] text-[#F4EFE6] border-[#1A1816]'
              : 'border-transparent hover:border-border hover:bg-background text-primary'
          }`}
          title="Inline Code (Ctrl+E)"
        >
          {'</>'}
        </button>

        <span className="text-border px-1">|</span>

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          className={`px-2.5 py-1 transition-colors border ${
            editor.isActive('bulletList')
              ? 'bg-[#1A1816] text-[#F4EFE6] border-[#1A1816]'
              : 'border-transparent hover:border-border hover:bg-background text-primary'
          }`}
          title="Bullet List"
        >
          • List
        </button>

        {/* Ordered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          className={`px-2.5 py-1 transition-colors border ${
            editor.isActive('orderedList')
              ? 'bg-[#1A1816] text-[#F4EFE6] border-[#1A1816]'
              : 'border-transparent hover:border-border hover:bg-background text-primary'
          }`}
          title="Numbered List"
        >
          1. List
        </button>

        {/* Blockquote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={disabled}
          className={`px-2.5 py-1 transition-colors border italic ${
            editor.isActive('blockquote')
              ? 'bg-[#1A1816] text-[#F4EFE6] border-[#1A1816]'
              : 'border-transparent hover:border-border hover:bg-background text-primary'
          }`}
          title="Blockquote"
        >
          &ldquo; Quote
        </button>

        {/* Code Block */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          disabled={disabled}
          className={`px-2.5 py-1 transition-colors border font-mono text-xs ${
            editor.isActive('codeBlock')
              ? 'bg-[#1A1816] text-[#F4EFE6] border-[#1A1816]'
              : 'border-transparent hover:border-border hover:bg-background text-primary'
          }`}
          title="Code Block"
        >
          Block
        </button>

        <span className="text-border px-1">|</span>

        {/* Link Button */}
        <button
          type="button"
          onClick={setLink}
          disabled={disabled}
          className={`px-2.5 py-1 transition-colors border ${
            editor.isActive('link')
              ? 'bg-[#1A1816] text-[#F4EFE6] border-[#1A1816]'
              : 'border-transparent hover:border-border hover:bg-background text-primary'
          }`}
          title="Insert / Edit Link"
        >
          Link
        </button>

        {/* Unlink */}
        {editor.isActive('link') && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={disabled}
            className="px-2 py-1 text-xs text-[#991B1B] hover:underline"
            title="Remove Link"
          >
            Remove Link
          </button>
        )}

        <div className="ml-auto flex items-center gap-1">
          {/* Undo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            className="px-2 py-1 text-xs border border-transparent hover:border-border disabled:opacity-30 text-secondary"
            title="Undo (Ctrl+Z)"
          >
            Undo
          </button>
          {/* Redo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            className="px-2 py-1 text-xs border border-transparent hover:border-border disabled:opacity-30 text-secondary"
            title="Redo (Ctrl+Y)"
          >
            Redo
          </button>
        </div>
      </div>

      {/* Inline Link Modal */}
      {linkModalOpen && (
        <div className="p-3 bg-[#EAE3D2] border-b border-border flex items-center gap-2 text-sm font-serif">
          <label htmlFor="editor-link-url" className="text-secondary shrink-0">
            URL:
          </label>
          <input
            id="editor-link-url"
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 px-2.5 py-1 bg-background border border-border text-primary text-sm focus:outline-none focus:border-primary"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                confirmLink();
              } else if (e.key === 'Escape') {
                setLinkModalOpen(false);
              }
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={confirmLink}
            className="px-3 py-1 bg-[#2A2825] text-white text-xs hover:bg-[#1A1816]"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setLinkModalOpen(false)}
            className="px-2 py-1 text-xs text-secondary hover:text-primary"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Editor Content Surface */}
      <EditorContent editor={editor} />
      
      {/* Editorial Helper Hint */}
      <div className="px-3 py-1.5 border-t border-border/50 bg-[#F9F6F0] text-[12px] text-secondary font-serif flex items-center justify-between">
        <span>Tip: Heading 2 (H2) automatically creates sections for the Table of Contents. Paragraphs before the first H2 become the Introduction.</span>
      </div>
    </div>
  );
}
