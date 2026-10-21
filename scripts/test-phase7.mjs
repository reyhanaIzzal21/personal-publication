import { sanitizeHtml } from '../lib/security/sanitize.ts';
import { parseTiptapToStructuredContent } from '../components/editor/PublicationEditor.tsx';
import { createClient } from '@supabase/supabase-js';

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

console.log('--- 1. Testing HTML Sanitizer ---');
const dirtyHtml1 = '<p>Hello <strong>World</strong><script>alert("XSS")</script></p>';
const clean1 = sanitizeHtml(dirtyHtml1);
assert(!clean1.includes('<script>') && clean1.includes('Hello') && clean1.includes('<strong>World</strong>'), 'Strips <script> tags cleanly');

const dirtyHtml2 = '<a href="javascript:alert(1)">Click me</a>';
const clean2 = sanitizeHtml(dirtyHtml2);
assert(!clean2.includes('javascript:'), 'Strips javascript: pseudo-protocols from links');

const cleanLink = '<a href="https://example.com/paper.pdf">Download</a>';
const sanitizedLink = sanitizeHtml(cleanLink);
assert(sanitizedLink.includes('href="https://example.com/paper.pdf"') && sanitizedLink.includes('rel="noopener noreferrer"'), 'Preserves safe HTTPS links and adds noopener noreferrer');

console.log('\n--- 2. Testing Tiptap to Structured Content Parser ---');
const dummyDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'This is the opening intro paragraph.' }]
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '1. Methodology & Modeling' }]
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Section one analysis description.' }]
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '2. Empirical Findings' }]
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Section two detailed conclusions.' }]
    }
  ]
};

const structured = parseTiptapToStructuredContent(dummyDoc);
assert(structured.introParagraphs?.length === 1 && structured.introParagraphs[0] === 'This is the opening intro paragraph.', 'Extracted intro paragraph before first H2');
assert(structured.sections?.length === 2, 'Extracted 2 sections broken by H2');
assert(structured.sections?.[0].id === '1-methodology-modeling', 'Section 1 generated correct slug ID for TOC');
assert(structured.sections?.[0].title === '1. Methodology & Modeling', 'Section 1 title preserved');
assert(structured.sections?.[1].id === '2-empirical-findings', 'Section 2 generated correct slug ID for TOC');

console.log('\n--- 3. Testing Supabase RLS Enforcement ---');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (supabaseUrl && supabaseKey) {
  const anonClient = createClient(supabaseUrl, supabaseKey);

  // Anon insert should be denied by RLS
  const { error: insertError } = await anonClient
    .from('publications')
    .insert({
      title: 'Hacked Publication',
      slug: 'hacked-publication',
      content_type: 'Research',
      subject: 'Technology & AI'
    });

  assert(insertError !== null && (insertError.code === '42501' || insertError.message.includes('row-level security')), 'RLS prevents anonymous user from inserting publications');

  // Anon read should only see published items
  const { data: anonData, error: selectError } = await anonClient
    .from('publications')
    .select('id, status');

  assert(selectError === null, 'Anon client can perform SELECT with RLS');
  const hasDraftsInAnonQuery = (anonData || []).some((item) => item.status === 'draft');
  assert(!hasDraftsInAnonQuery, 'Anon client cannot view draft publications');
} else {
  console.log('[SKIP] Supabase credentials not found in environment');
}

console.log(`\nTest Summary: ${passed} Passed, ${failed} Failed`);
if (failed > 0) process.exit(1);
