import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="max-w-[580px] w-full mx-auto px-4 sm:px-6 md:px-0 py-16">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-primary font-serif tracking-normal">
          Publication Not Found
        </h1>
      </header>

      <section className="space-y-4 font-serif text-secondary text-[16px] sm:text-[18px] leading-[1.65]">
        <p>
          The publication you requested could not be found or is no longer publicly available.
        </p>

        <div className="pt-4">
          <Link
            href="/"
            className="text-primary underline decoration-border hover:decoration-primary underline-offset-4 transition-colors"
          >
            ← Return to publications index
          </Link>
        </div>
      </section>
    </main>
  );
}
