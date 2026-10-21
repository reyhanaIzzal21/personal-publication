import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifyAdmin } from '@/lib/auth/admin';
import { getAllPublicationsForAdmin } from '@/lib/publications/queries';
import { logoutAction } from '../actions';
import { AdminPublicationsList } from '@/components/admin/AdminPublicationsList';

export const metadata = {
  title: 'Publications Management — Admin',
};

export const instant = false;

export default async function AdminPublicationsPage() {
  const auth = await verifyAdmin();

  if (!auth.authorized) {
    if (auth.reason === 'unauthenticated') {
      redirect('/admin/login');
    }

    return (
      <main className="max-w-[580px] w-full mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-xl font-semibold text-primary font-serif mb-2">
          Access Denied
        </h1>
        <p className="text-[14px] text-secondary font-serif mb-6">
          This account ({auth.user.email}) does not have administrator privileges.
        </p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm font-serif underline decoration-border hover:decoration-primary underline-offset-4 cursor-pointer"
          >
            Sign out
          </button>
        </form>
      </main>
    );
  }

  const { data: publications, error } = await getAllPublicationsForAdmin();

  return (
    <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 font-serif">
      {/* Admin Masthead */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-primary tracking-normal">
              Admin Dashboard
            </h1>
            <span className="text-xs px-2 py-0.5 bg-[#EAE3D2] text-secondary font-sans uppercase">
              Publications
            </span>
          </div>
          <p className="text-[13px] text-secondary mt-1">
            Signed in as <strong className="text-primary font-normal">{auth.user.email}</strong>
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/admin/publications/new"
            className="px-4 py-2 bg-[#2A2825] text-white hover:bg-[#1A1816] transition-colors text-xs uppercase tracking-wider font-sans font-medium"
          >
            + New Publication
          </Link>
          <Link
            href="/"
            target="_blank"
            className="text-secondary hover:text-primary underline decoration-border hover:decoration-primary text-xs font-sans uppercase tracking-wider transition-colors"
          >
            Public Site ↗
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-xs font-sans uppercase tracking-wider text-secondary hover:text-[#991B1B] underline decoration-border hover:decoration-[#991B1B] cursor-pointer transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Main Listing or Error */}
      {error ? (
        <div
          role="alert"
          className="p-6 border border-[#B91C1C]/40 bg-[#FEE2E2]/60 text-[#991B1B] space-y-2"
        >
          <h2 className="font-semibold text-base">Error Loading Publications</h2>
          <p className="text-sm">{error.message}</p>
        </div>
      ) : (
        <AdminPublicationsList initialPublications={publications || []} />
      )}
    </main>
  );
}
