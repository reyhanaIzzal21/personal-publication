'use client';

import { useActionState } from 'react';
import { loginAction, type LoginActionState } from '../actions';

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {/* Generic Error Feedback */}
      {state.error && (
        <div
          role="alert"
          aria-live="polite"
          className="border border-[#B91C1C]/40 bg-[#FEE2E2]/60 px-3.5 py-2.5 text-[13.5px] text-[#991B1B] font-serif leading-relaxed"
        >
          {state.error}
        </div>
      )}

      {/* Email Input */}
      <div>
        <label
          htmlFor="email"
          className="block text-[13.5px] font-serif text-secondary mb-1.5"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={isPending}
          className="w-full px-3 py-2 bg-transparent border border-border text-primary font-serif text-[15px] focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          placeholder="admin@example.com"
        />
      </div>

      {/* Password Input */}
      <div>
        <label
          htmlFor="password"
          className="block text-[13.5px] font-serif text-secondary mb-1.5"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          disabled={isPending}
          className="w-full px-3 py-2 bg-transparent border border-border text-primary font-serif text-[15px] focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#2A2825] text-white py-2.5 px-4 text-[14.5px] font-serif hover:bg-[#1A1816] transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer select-none"
        >
          {isPending ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </form>
  );
}
