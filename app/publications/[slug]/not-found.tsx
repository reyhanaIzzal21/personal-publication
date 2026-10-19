import Link from 'next/link';

export default function PublicationNotFound() {
  return (
    <main className="max-w-[580px] w-full mx-auto px-4 sm:px-6 py-20 text-center font-serif">
      <h1 className="text-3xl font-semibold text-primary mb-3">
        Publication Not Found
      </h1>
      <p className="text-secondary text-base mb-8">
        The requested publication does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="text-primary text-sm underline decoration-border hover:decoration-primary underline-offset-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        ← Return to publications
      </Link>
    </main>
  );
}
