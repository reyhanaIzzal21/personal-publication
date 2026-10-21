import { sanitizeHtml } from '../lib/security/sanitize.ts';
import { parseTiptapToStructuredContent } from '../components/editor/PublicationEditor.tsx';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

console.log('=== TEST SUITE: PHASE 7.2 RICH TEXT & EDITORIAL INTEGRITY ===\n');

// 1. Test HTML Sanitizer
console.log('--- 1. Testing Sanitizer Security & Fidelity ---');

// 1a. Security: Script and pseudo-protocol stripping
const xss1 = '<p>Safe <script>alert(1)</script>text</p>';
assert(sanitizeHtml(xss1) === '<p>Safe text</p>', 'Strips <script> tags completely');

const xss2 = '<a href="javascript:alert(1)">Malicious</a>';
assert(!sanitizeHtml(xss2).includes('javascript:'), 'Strips javascript: pseudo-protocol');

const xss3 = '<a href="data:text/html;base64,...">Data URL</a>';
assert(!sanitizeHtml(xss3).includes('data:'), 'Strips data: pseudo-protocol');

// 1b. Allowed semantic tags & safe links
const safeLink = '<a href="https://example.com/research">Read paper</a>';
const cleanLink = sanitizeHtml(safeLink);
assert(
  cleanLink.includes('href="https://example.com/research"') &&
  cleanLink.includes('target="_blank"') &&
  cleanLink.includes('rel="noopener noreferrer"'),
  'Preserves valid HTTPS link and adds secure target/rel attributes'
);

// 1c. Ordered list with start attribute
const olWithStart = '<ol start="5"><li>Item 5</li><li>Item 6</li></ol>';
assert(sanitizeHtml(olWithStart) === '<ol start="5"><li>Item 5</li><li>Item 6</li></ol>', 'Preserves start attribute on <ol>');

// 1d. Code blocks with language attribute
const preCode = '<pre data-language="typescript"><code>const x: number = 42;</code></pre>';
assert(sanitizeHtml(preCode) === preCode, 'Preserves data-language and code block elements');

// 1e. Blockquotes, lists, formatting
const richHtml = '<blockquote><p>Quote with <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <s>strike</s>, and <code>code</code></p></blockquote>';
assert(sanitizeHtml(richHtml) === richHtml, 'Preserves nested blockquote, marks, and code cleanly');

// 2. Comprehensive Tiptap Document Parser Tests
console.log('\n--- 2. Testing Tiptap Document Parser (All Required Formats) ---');

const fullDoc = {
  type: 'doc',
  content: [
    // Introduction content (before first H2)
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Intro paragraph with ' },
        { type: 'text', text: 'bold text', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' and ' },
        {
          type: 'text',
          text: 'a link',
          marks: [
            { type: 'bold' },
            { type: 'link', attrs: { href: 'https://google.com' } }
          ]
        },
        { type: 'text', text: '.' }
      ]
    },
    {
      type: 'blockquote',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Introductory blockquote line 1.\nLine 2.' }]
        }
      ]
    },
    // First Section (H2)
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'First Major Section' }]
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Body paragraph under first section.' }]
    },
    // Subheading (H3)
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: 'Subsection Alpha' }]
    },
    // Bullet list with 3 items
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Bullet item 1' }]
            }
          ]
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Bullet item 2 with ' },
                { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
                { type: 'text', text: ' and ' },
                { type: 'text', text: 'italic', marks: [{ type: 'italic' }] }
              ]
            }
          ]
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Bullet item 3 with link',
                  marks: [{ type: 'link', attrs: { href: 'https://example.com' } }]
                }
              ]
            }
          ]
        }
      ]
    },
    // Ordered list with 3 items
    {
      type: 'orderedList',
      attrs: { start: 1 },
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step one' }] }]
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step two' }] }]
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step three' }] }]
        }
      ]
    },
    // Code block
    {
      type: 'codeBlock',
      attrs: { language: 'typescript' },
      content: [{ type: 'text', text: 'function calculate() {\n  return 42;\n}' }]
    },
    // Second Section with DUPLICATE TITLE to test unique ID collision avoidance
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'First Major Section' }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Testing inline formatting: ' },
        { type: 'text', text: 'underline', marks: [{ type: 'underline' }] },
        { type: 'text', text: ', ' },
        { type: 'text', text: 'strike', marks: [{ type: 'strike' }] },
        { type: 'text', text: ', and ' },
        { type: 'text', text: 'inline code', marks: [{ type: 'code' }] },
        { type: 'text', text: '.' }
      ]
    },
    // Empty paragraph test
    {
      type: 'paragraph',
      content: []
    }
  ]
};

const result = parseTiptapToStructuredContent(fullDoc);

// Verify Introduction
assert(result.intro?.length === 2, 'Intro contains exactly 2 nodes (paragraph and blockquote)');
assert(result.intro[0].includes('<strong>bold text</strong>'), 'Intro contains bold formatting');
assert(result.intro[0].includes('href="https://google.com"'), 'Intro contains hyperlink');
assert(result.intro[1].startsWith('<blockquote>') && result.intro[1].endsWith('</blockquote>'), 'Intro contains semantic blockquote');

// Verify Sections
assert(result.sections?.length === 2, 'Generated exactly 2 sections from H2 headings');

const sec1 = result.sections[0];
assert(sec1.id === 'first-major-section', 'First section has slugified ID "first-major-section"');
assert(sec1.title === 'First Major Section', 'First section title preserved');
assert(sec1.html.includes('<h3>Subsection Alpha</h3>'), 'Section 1 contains H3 subsection in html');
assert(sec1.html.includes('<ul><li>Bullet item 1</li>'), 'Section 1 contains semantic <ul> with <li>');
assert(sec1.html.includes('<strong>bold</strong>') && sec1.html.includes('<em>italic</em>'), 'Section 1 list item preserves bold and italic marks');
assert(sec1.html.includes('<a href="https://example.com"'), 'Section 1 list item preserves link');
assert(sec1.html.includes('<ol><li>Step one</li><li>Step two</li><li>Step three</li></ol>'), 'Section 1 contains semantic <ol> with 3 items');
assert(sec1.html.includes('<pre data-language="typescript"><code>function calculate()'), 'Section 1 contains formatted <pre><code> code block');

// Verify Duplicate Heading ID resolution (collision prevention)
const sec2 = result.sections[1];
assert(sec2.title === 'First Major Section', 'Second section preserves title');
assert(sec2.id === 'first-major-section-2', 'Second section generated unique ID with suffix "-2"');
assert(sec2.html.includes('<u>underline</u>'), 'Section 2 contains underline formatting');
assert(sec2.html.includes('<s>strike</s>'), 'Section 2 contains strikethrough formatting');
assert(sec2.html.includes('<code>inline code</code>'), 'Section 2 contains inline code formatting');
assert(sec2.html.includes('<p>&nbsp;</p>'), 'Section 2 handled empty paragraph safely without crashing');

// 3. Document Without Headings Test
console.log('\n--- 3. Testing Document Without Headings ---');
const noHeadingsDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Single essay paragraph with no sections.' }]
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Solo list item' }] }]
        }
      ]
    }
  ]
};

const noHeadingsResult = parseTiptapToStructuredContent(noHeadingsDoc);
assert(noHeadingsResult.sections?.length === 0, 'No sections generated when there are no H2 headings');
assert(noHeadingsResult.intro?.length === 2, 'All content preserved as introductory content');
assert(noHeadingsResult.intro[1].includes('<ul><li>Solo list item</li></ul>'), 'Preserved bullet list in document without headings');

// 4. Verify Canonical Tiptap preservation
assert(result.tiptap === fullDoc, 'Canonical Tiptap JSON is stored for 100% editor fidelity on reload');

console.log(`\n========================================`);
console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
