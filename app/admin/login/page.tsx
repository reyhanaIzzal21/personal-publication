import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifyAdmin } from '@/lib/auth/admin';
import { logoutAction } from '../actions';
import { LoginForm } from './LoginForm';

export const metadata = {
  title: 'Admin Access — Reyhana Izzal',
  description: 'Editorial administration login.',
};

/**
 * Opt out of static prerendering validation for dynamic auth cookies
 * in Next.js 16 Cache Components.
 */
export const instant = false;

export default async function AdminLoginPage() {
  const auth = await verifyAdmin();

  // If already logged in as an administrator, redirect directly to publications
  if (auth.authorized) {
    redirect('/admin/publications');
  }

  return (
    <main className="max-w-[420px] w-full mx-auto px-4 sm:px-6 py-16">
      {/* Editorial Header */}
      <header className="mb-8">
        <Link
          href="/"
          className="text-2xl font-semibold text-primary font-serif tracking-normal [text-decoration:none]! no-underline hover:opacity-85 transition-opacity"
        >
          Reyhana Izzal
        </Link>
        <h1 className="text-[20px] font-semibold text-primary font-serif mt-4 mb-1">
          Admin Access
        </h1>
        <p className="text-[13px] text-secondary font-serif">
          Editorial & publication management
        </p>
      </header>

      {/* Authenticated Non-Admin Warning State */}
      {auth.reason === 'forbidden' ? (
        <div className="space-y-4 border border-border p-4 bg-background">
          <p className="text-[14px] text-primary font-serif">
            You are signed in as{' '}
            <span className="font-semibold">{auth.user.email}</span>, but this
            account does not have administrator privileges.
          </p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-[13.5px] font-serif text-secondary hover:text-primary underline decoration-border hover:decoration-primary underline-offset-4 cursor-pointer"
            >
              Sign out and try another account
            </button>
          </form>
        </div>
      ) : (
        /* Standard Login Form */
        <LoginForm />
      )}

      {/* Return Link */}
      <footer className="mt-10 pt-6 border-t border-border">
        <Link
          href="/"
          className="text-[13px] text-secondary font-serif hover:text-primary transition-colors underline decoration-border hover:decoration-primary underline-offset-4"
        >
          ← Back to website
        </Link>
      </footer>
    </main>
  );
}
