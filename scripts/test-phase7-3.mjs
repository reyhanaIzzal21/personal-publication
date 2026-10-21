import { getPublishedPublicationBySlug } from '../lib/publications/queries.ts';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

console.log('=== TEST SUITE: PHASE 7.3 PDF ATTACHMENT ACCESS & SECURITY ===\n');

async function run() {
  const adminClient = createClient(url, serviceKey);

  // 1. Fetch a real published publication with PDF
  console.log('--- 1. Testing Unauthenticated Visitor Access to Published PDF ---');
  const publishedSlug = 'menjelajahi-masa-depan-teknologi-web-heading-1';
  const { data: pubDetail, error: pubError } = await getPublishedPublicationBySlug(publishedSlug);

  assert(!pubError && pubDetail !== null, 'Public query retrieved published publication');
  assert(pubDetail?.title !== undefined, 'Publication title retrieved cleanly');
  assert(pubDetail?.pdfAttachment !== undefined, 'PDF attachment is present for unauthenticated visitor');

  if (pubDetail?.pdfAttachment) {
    console.log('PDF Attachment details:');
    console.log('- Filename:', pubDetail.pdfAttachment.filename);
    console.log('- Size (bytes):', pubDetail.pdfAttachment.fileSizeBytes);
    console.log('- View URL generated:', Boolean(pubDetail.pdfAttachment.url));
    console.log('- Download URL generated:', Boolean(pubDetail.pdfAttachment.downloadUrl));

    assert(Boolean(pubDetail.pdfAttachment.url), 'View signed URL was generated');
    assert(Boolean(pubDetail.pdfAttachment.downloadUrl), 'Download signed URL was generated');

    // Test View URL with anonymous HTTP fetch (simulating browser in incognito / without login)
    const viewResponse = await fetch(pubDetail.pdfAttachment.url);
    assert(
      viewResponse.status === 200,
      `View URL is accessible publicly without login (HTTP ${viewResponse.status})`
    );
    assert(
      viewResponse.headers.get('content-type')?.includes('application/pdf'),
      `View URL returns application/pdf content type (${viewResponse.headers.get('content-type')})`
    );

    // Test Download URL with anonymous HTTP fetch
    const downloadResponse = await fetch(pubDetail.pdfAttachment.downloadUrl);
    assert(
      downloadResponse.status === 200,
      `Download URL is accessible publicly without login (HTTP ${downloadResponse.status})`
    );
    const contentDisposition = downloadResponse.headers.get('content-disposition');
    assert(
      contentDisposition?.includes('attachment'),
      `Download URL includes 'Content-Disposition: attachment' (${contentDisposition})`
    );
  }

  // 2. Draft Publication Security: Draft publications must NEVER be accessible publicly
  console.log('\n--- 2. Testing Draft Publication Security ---');
  // Create a temporary draft publication with PDF metadata to verify zero leakage
  const { data: testDraft } = await adminClient
    .from('publications')
    .insert({
      title: 'Secret Internal Draft',
      slug: 'secret-internal-draft-test',
      status: 'draft',
      content_type: 'Research',
      subject: 'Technology & AI',
      publication_date: '2026-10-21',
      content: { version: 1, intro: ['Draft intro'], sections: [] }
    })
    .select('id, slug')
    .single();

  if (testDraft) {
    // Attach a file metadata to this draft
    await adminClient.from('publication_files').insert({
      publication_id: testDraft.id,
      storage_path: 'publications/test-draft/draft.pdf',
      original_filename: 'draft.pdf',
      mime_type: 'application/pdf',
      file_size_bytes: 1024
    });

    // Test that public query returns null for draft slug
    const { data: draftResult } = await getPublishedPublicationBySlug(testDraft.slug);
    assert(draftResult === null, 'Draft publication returns null for public query (notFound)');

    // Clean up test draft
    await adminClient.from('publications').delete().eq('id', testDraft.id);
  }

  // 3. Fallback when Storage Object is missing
  console.log('\n--- 3. Testing Fallback When Storage Path is Invalid ---');
  // Create temporary published publication pointing to non-existent storage path
  const { data: testMissingPub } = await adminClient
    .from('publications')
    .insert({
      title: 'Missing PDF Test',
      slug: 'missing-pdf-test',
      status: 'published',
      content_type: 'Essay',
      subject: 'Technology & AI',
      publication_date: '2026-10-21',
      content: { version: 1, intro: ['Normal essay content.'], sections: [] }
    })
    .select('id, slug')
    .single();

  if (testMissingPub) {
    await adminClient.from('publication_files').insert({
      publication_id: testMissingPub.id,
      storage_path: 'publications/non-existent-id/ghost-file.pdf',
      original_filename: 'ghost-file.pdf',
      mime_type: 'application/pdf',
      file_size_bytes: 500
    });

    const { data: missingPubResult, error: missingPubError } = await getPublishedPublicationBySlug(testMissingPub.slug);
    assert(!missingPubError, 'Query does not crash when storage object is missing');
    assert(missingPubResult !== null, 'Publication article content is still returned cleanly');
    assert(missingPubResult?.pdfAttachment === undefined, 'pdfAttachment is safely undefined (fallback) instead of broken link');

    // Clean up test publication
    await adminClient.from('publications').delete().eq('id', testMissingPub.id);
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
