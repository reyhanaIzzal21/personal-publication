import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment status:');
console.log('SUPABASE_URL:', url ? 'Defined' : 'Missing');
console.log('ANON_KEY:', anonKey ? 'Defined' : 'Missing');
console.log('SERVICE_ROLE_KEY:', serviceKey ? 'Defined' : 'Missing');

if (!url || !anonKey) {
  console.error('Fatal: Missing URL or Anon key');
  process.exit(1);
}

const anonClient = createClient(url, anonKey);
const adminClient = serviceKey ? createClient(url, serviceKey) : null;

async function run() {
  if (!adminClient) {
    console.error('Admin client not available');
    return;
  }

  // 1. Check publication_files records
  console.log('\n--- 1. Database: publication_files rows ---');
  const { data: dbFiles, error: dbErr } = await adminClient
    .from('publication_files')
    .select('id, publication_id, storage_path, original_filename, file_size_bytes, created_at');

  if (dbErr) {
    console.error('Database query error:', dbErr.message);
  } else {
    console.log(`Found ${dbFiles?.length || 0} publication_files:`);
    for (const f of dbFiles || []) {
      console.log(`- File ID: ${f.id}`);
      console.log(`  Publication ID: ${f.publication_id}`);
      console.log(`  Storage Path: ${f.storage_path}`);
      console.log(`  Filename: ${f.original_filename}`);
      console.log(`  Size: ${f.file_size_bytes} bytes`);
    }
  }

  // 2. Check publication row status for each file
  console.log('\n--- 2. Database: Parent publication status ---');
  if (dbFiles && dbFiles.length > 0) {
    for (const f of dbFiles) {
      const { data: pub } = await adminClient
        .from('publications')
        .select('id, slug, title, status')
        .eq('id', f.publication_id)
        .single();
      console.log(`Publication for file ${f.id}:`, pub);
    }
  }

  // 3. Check Storage Buckets
  console.log('\n--- 3. Storage: Buckets ---');
  const { data: buckets, error: bErr } = await adminClient.storage.listBuckets();
  if (bErr) {
    console.error('List buckets error:', bErr.message);
  } else {
    console.log('Buckets:', buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })));
  }

  // 4. Check Storage files in publication-attachments
  console.log('\n--- 4. Storage: List objects in publication-attachments ---');
  const { data: rootItems, error: rErr } = await adminClient.storage
    .from('publication-attachments')
    .list('');
  console.log('Root folder items:', rootItems?.map(i => i.name), rErr?.message || '');

  const { data: pubDirItems, error: pErr } = await adminClient.storage
    .from('publication-attachments')
    .list('publications');
  console.log('publications/ folder items:', pubDirItems?.map(i => i.name), pErr?.message || '');

  // 5. Check specific publication directory and test createSignedUrl
  if (dbFiles && dbFiles.length > 0) {
    for (const f of dbFiles) {
      console.log(`\n--- 5. Checking file: ${f.storage_path} ---`);
      const parts = f.storage_path.split('/');
      const dir = parts.slice(0, -1).join('/');
      const { data: subItems, error: sErr } = await adminClient.storage
        .from('publication-attachments')
        .list(dir);
      console.log(`Items in folder '${dir}':`, subItems?.map(i => i.name), sErr?.message || '');

      // Try signed URL with adminClient (Service Role)
      const { data: adminSigned, error: adminSignedErr } = await adminClient.storage
        .from('publication-attachments')
        .createSignedUrl(f.storage_path, 3600);
      console.log('Service Role createSignedUrl:', adminSigned ? 'SUCCESS' : 'FAILED', adminSignedErr?.message || '');

      // Try signed URL with anonClient (Anon)
      const { data: anonSigned, error: anonSignedErr } = await anonClient.storage
        .from('publication-attachments')
        .createSignedUrl(f.storage_path, 3600);
      console.log('Anon Client createSignedUrl:', anonSigned ? 'SUCCESS' : 'FAILED', anonSignedErr?.message || '');
    }
  }
}

run().catch(console.error);
