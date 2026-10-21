import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifyAdmin } from '@/lib/auth/admin';
import { logoutAction } from '../../actions';
import { PublicationForm } from '@/components/admin/PublicationForm';

export const metadata = {
  title: 'New Publication — Admin',
};

export const instant = false;

export default async function NewPublicationPage() {
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

  return (
    <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 font-serif">
      <header className="flex items-center justify-between border-b border-border pb-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-secondary mb-1">
            <Link
              href="/admin/publications"
              className="hover:text-primary underline decoration-border hover:decoration-primary"
            >
              Publications
            </Link>
            <span>/</span>
            <span>New</span>
          </div>
          <h1 className="text-2xl font-semibold text-primary">
            Create Publication
          </h1>
        </div>

        <Link
          href="/admin/publications"
          className="text-xs text-secondary hover:text-primary underline decoration-border hover:decoration-primary uppercase tracking-wider font-sans"
        >
          ← Back to List
        </Link>
      </header>

      <PublicationForm />
    </main>
  );
}
