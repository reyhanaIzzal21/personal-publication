-- =============================================================================
-- DRAFT SCHEMA ARTIFACT — PERSONAL PUBLICATION DATABASE
-- =============================================================================
-- Proyek: Personal Publication Website (Reyhana Izzal)
-- Fase: Phase 4 — Database Design & Review
-- Tanggal: 2026-10-20
-- Status: DRAFT / REVIEW ONLY
--
-- PERINGATAN PENTING:
-- File ini merupakan artefak rancangan DDL (Data Definition Language) dan 
-- Row Level Security (RLS) yang dibuat untuk keperluan telaah arsitektural.
-- JANGAN MENJALANKAN FILE INI TERHADAP DATABASE AKTIF SEBELUM DITINJAU DAN 
-- DISETUJUI SECARA EKSPLISIT OLEH PENGGUNA.
-- =============================================================================

-- Pastikan extension pgcrypto tersedia untuk gen_random_uuid() (standar di Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. TABEL: publications
-- =============================================================================
-- Menyimpan metadata artikel, status rilis, kategori, dan konten terstruktur (jsonb).
CREATE TABLE IF NOT EXISTS public.publications (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Routing & Identifikasi Publik
    slug TEXT NOT NULL,

    -- Informasi Editorial
    title TEXT NOT NULL,
    subtitle TEXT,
    content_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    publication_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Kontrol Siklus Hidup & Status
    status TEXT NOT NULL DEFAULT 'draft',

    -- Konten Artikel Terstruktur (Blocks & Sections untuk Table of Contents)
    content JSONB NOT NULL DEFAULT '{"version": 1, "intro": [], "sections": []}'::jsonb,

    -- Timestamp Sistem & Editorial
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- -------------------------------------------------------------------------
    -- Constraints & Integritas Data
    -- -------------------------------------------------------------------------
    -- Slug wajib unik dan berformat kebab-case
    CONSTRAINT uq_publications_slug UNIQUE (slug),
    CONSTRAINT chk_publications_slug_format 
        CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),

    -- Judul tidak boleh hanya berisi whitespace
    CONSTRAINT chk_publications_title_not_empty 
        CHECK (length(trim(title)) > 0),

    -- Subtitle jika diisi tidak boleh hanya whitespace
    CONSTRAINT chk_publications_subtitle_not_empty 
        CHECK (subtitle IS NULL OR length(trim(subtitle)) > 0),

    -- Pembatasan Content Type sesuai taksonomi frontend
    CONSTRAINT chk_publications_content_type 
        CHECK (content_type IN (
            'Research',
            'Hypothesis',
            'Essay',
            'Analysis'
        )),

    -- Pembatasan Subject sesuai taksonomi frontend
    CONSTRAINT chk_publications_subject 
        CHECK (subject IN (
            'Economics & Markets',
            'Technology & AI',
            'Business & Organizations',
            'Society, Politics & Philosophy'
        )),

    -- Pembatasan status artikel
    CONSTRAINT chk_publications_status 
        CHECK (status IN ('draft', 'published')),

    -- Konsistensi status terbit dan timestamp published_at
    CONSTRAINT chk_publications_published_consistency 
        CHECK (
            (status = 'draft') OR 
            (status = 'published' AND published_at IS NOT NULL)
        )
);

-- Dokumentasi Kolom Tabel publications
COMMENT ON TABLE public.publications IS 'Tabel utama menyimpan seluruh artikel publikasi, status, dan konten.';
COMMENT ON COLUMN public.publications.slug IS 'Slug URL unik artikel untuk routing Next.js (/publications/[slug]).';
COMMENT ON COLUMN public.publications.publication_date IS 'Tanggal rilis editorial (tipe DATE tanpa timezone untuk stabilitas tampilan kalender).';
COMMENT ON COLUMN public.publications.content IS 'Konten terstruktur JSONB memuat intro paragraphs dan sections dengan ID heading stabil untuk TOC.';
COMMENT ON COLUMN public.publications.published_at IS 'Waktu presisi artikel diaktifkan statusnya menjadi published.';

-- =============================================================================
-- 2. TABEL: publication_files
-- =============================================================================
-- Menyimpan referensi metadata file lampiran PDF di Supabase Storage.
-- Maksimal SATU file per publikasi dijamin melalui constraint UNIQUE (publication_id).
CREATE TABLE IF NOT EXISTS public.publication_files (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relasi 1-ke-1 (Opsional) dengan publications
    publication_id UUID NOT NULL,

    -- Lokasi & Informasi Berkas di Supabase Storage
    storage_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/pdf',
    file_size_bytes BIGINT NOT NULL,
    
    -- Metadata Tampilan Tambahan (Frontend PDF Box)
    page_count INTEGER,
    title TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- -------------------------------------------------------------------------
    -- Constraints & Integritas Data
    -- -------------------------------------------------------------------------
    -- Foreign Key cascade jika publikasi dihapus
    CONSTRAINT fk_publication_files_publication 
        FOREIGN KEY (publication_id) 
        REFERENCES public.publications(id) 
        ON DELETE CASCADE,

    -- ATURAN UTAMA: Maksimal 1 berkas per publikasi
    CONSTRAINT uq_publication_files_publication_id 
        UNIQUE (publication_id),

    -- Validasi path dan nama berkas
    CONSTRAINT chk_publication_files_storage_path_not_empty 
        CHECK (length(trim(storage_path)) > 0),
    CONSTRAINT chk_publication_files_filename_not_empty 
        CHECK (length(trim(original_filename)) > 0),

    -- Hanya menerima tipe berkas PDF
    CONSTRAINT chk_publication_files_mime_type 
        CHECK (mime_type = 'application/pdf'),

    -- Ukuran berkas harus positif
    CONSTRAINT chk_publication_files_file_size 
        CHECK (file_size_bytes > 0),

    -- Estimasi jumlah halaman harus positif jika diisi
    CONSTRAINT chk_publication_files_page_count 
        CHECK (page_count IS NULL OR page_count > 0)
);

-- Dokumentasi Kolom Tabel publication_files
COMMENT ON TABLE public.publication_files IS 'Metadata berkas PDF lampiran artikel di Supabase Storage (Maks 1 PDF per artikel).';
COMMENT ON COLUMN public.publication_files.storage_path IS 'Path objek relatif di dalam bucket Storage (misal: publications/pub-id/paper.pdf).';
COMMENT ON COLUMN public.publication_files.original_filename IS 'Nama berkas asli untuk atribut download di browser.';

-- =============================================================================
-- 3. INDEKS & OPTIMASI QUERY (Berdasarkan Supabase Postgres Best Practices)
-- =============================================================================

-- A. Indeks Foreign Key pada publication_files
-- Mencegah sequential scan saat JOIN atau saat eksekusi ON DELETE CASCADE
CREATE INDEX IF NOT EXISTS idx_publication_files_publication_id 
ON public.publication_files (publication_id);

-- B. Partial Index: Daftar Publikasi Terbit
-- Mengoptimasi query beranda dan arsip yang selalu memfilter WHERE status = 'published'
-- Mengabaikan artikel draft sehingga indeks jauh lebih ringkas dan hemat RAM
CREATE INDEX IF NOT EXISTS idx_publications_published_listing 
ON public.publications (publication_date DESC, created_at DESC) 
WHERE status = 'published';

-- C. Partial Composite Index: Pengelompokan Beranda berdasarkan Content Type
-- Mengoptimasi query grouping homepage (ORDERED_CONTENT_TYPES: Research, Hypothesis, Essay, Analysis)
CREATE INDEX IF NOT EXISTS idx_publications_published_content_type 
ON public.publications (content_type, publication_date DESC) 
WHERE status = 'published';

-- =============================================================================
-- 4. DATABASE FUNCTIONS & TRIGGERS
-- =============================================================================

-- Fungsi otomatisasi pembaruan kolom updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Trigger updated_at pada tabel publications
DROP TRIGGER IF EXISTS trg_publications_updated_at ON public.publications;
CREATE TRIGGER trg_publications_updated_at
    BEFORE UPDATE ON public.publications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger updated_at pada tabel publication_files
DROP TRIGGER IF EXISTS trg_publication_files_updated_at ON public.publication_files;
CREATE TRIGGER trg_publication_files_updated_at
    BEFORE UPDATE ON public.publication_files
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Fungsi otomatisasi pengaturan published_at saat status berubah menjadi 'published'
CREATE OR REPLACE FUNCTION public.handle_publication_status_transition()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Jika beralih ke 'published' dan published_at belum disetel, isi dengan waktu sekarang
    IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
        NEW.published_at = now();
    END IF;

    -- Jika dikembalikan ke 'draft', reset published_at jika diinginkan kebijakan editorial
    -- (atau pertahankan published_at asli sebagai riwayat pertama terbit tergantung preferensi)
    RETURN NEW;
END;
$$;

-- Trigger transisi status publikasi
DROP TRIGGER IF EXISTS trg_publication_status_transition ON public.publications;
CREATE TRIGGER trg_publication_status_transition
    BEFORE INSERT OR UPDATE ON public.publications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_publication_status_transition();

-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS) & ACCESS CONTROL
-- =============================================================================

-- Aktifkan RLS pada kedua tabel
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_files ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Kebijakan Akses: publications
-- -----------------------------------------------------------------------------

-- Kebijakan 1: Public Visitor (anon & authenticated) hanya boleh membaca artikel yang berstatus 'published'
-- Menggunakan SELECT cache pattern untuk memastikan evaluasi optimal
CREATE POLICY "Public visitors can view published publications"
    ON public.publications
    FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

-- Kebijakan 2: Administrator memiliki hak akses penuh (CRUD) pada semua artikel (draft maupun published)
-- Catatan: Admin diverifikasi melalui custom claims JWT app_metadata -> role = 'admin'
-- (Bukan sekadar authenticated user biasa)
CREATE POLICY "Admins have full CRUD access to all publications"
    ON public.publications
    FOR ALL
    TO authenticated
    USING (
        ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    )
    WITH CHECK (
        ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    );

-- -----------------------------------------------------------------------------
-- Kebijakan Akses: publication_files
-- -----------------------------------------------------------------------------

-- Kebijakan 1: Public Visitor boleh melihat metadata berkas PDF HANYA JIKA artikel induknya berstatus 'published'
CREATE POLICY "Public visitors can view files for published publications"
    ON public.publication_files
    FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.publications p 
            WHERE p.id = publication_files.publication_id 
              AND p.status = 'published'
        )
    );

-- Kebijakan 2: Administrator memiliki hak akses penuh (CRUD) pada metadata berkas
CREATE POLICY "Admins have full CRUD access to all publication files"
    ON public.publication_files
    FOR ALL
    TO authenticated
    USING (
        ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    )
    WITH CHECK (
        ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    );

-- =============================================================================
-- 6. PANDUAN KONFIGURASI STORAGE BUCKET (DRAFT UNTUK FASE SELANJUTNYA)
-- =============================================================================
-- Catatan Perancangan Storage:
-- 1. Nama bucket yang disarankan: 'publication-attachments'
-- 2. Bucket disarankan berstatus PRIVATE (public: false) agar file draft tidak bocor.
-- 3. File disajikan ke pengunjung publik via temporary Signed URLs yang dihasilkan 
--    oleh Server Component (misal masa berlaku 3600 detik).
-- 4. Kebijakan RLS storage pada storage.objects dirancang sebagai berikut:
--
-- Contoh Policy Storage (Diterapkan pada fase konfigurasi Supabase nanti):
--
-- CREATE POLICY "Allow admin upload to publication-attachments"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (
--     bucket_id = 'publication-attachments' AND
--     ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
-- );
--
-- CREATE POLICY "Allow admin delete from publication-attachments"
-- ON storage.objects FOR DELETE TO authenticated
-- USING (
--     bucket_id = 'publication-attachments' AND
--     ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
-- );
-- =============================================================================
-- AKHIR DARI FILE DRAFT SCHEMA
-- =============================================================================
