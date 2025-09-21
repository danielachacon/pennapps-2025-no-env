"use client";

import { useState } from "react";
import Link from "next/link";

export type AuthMode = "login" | "register";

type Props = {
  mode: AuthMode;
  onSubmit?: (
    payload:
      | { email: string; password: string }
      | { email: string; password: string; emergencyContacts?: string[] }
  ) => Promise<void> | void;
  submitLabel?: string;
};

export default function AuthForm({ mode, onSubmit, submitLabel }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<string[]>([""]);

  const title = mode === "login" ? "Sign in" : "Create your account";
  const cta = submitLabel ?? (mode === "login" ? "Sign in" : "Continue");
  const altHref = mode === "login" ? "/register" : "/login";
  const altText = mode === "login" ? "Don't have an account? Create one" : "Already have an account? Sign in";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payloadBase = { email, password };
      if (mode === "register") {
        const contacts = emergencyContacts.map((c) => c.trim()).filter((c) => c.length > 0);
        await onSubmit?.({ ...payloadBase, emergencyContacts: contacts });
      } else {
        await onSubmit?.(payloadBase);
      }
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur p-8 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1 text-center">{title}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
          Use your email and password below
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 px-3 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Emergency contact phone numbers</label>
              <p className="text-xs text-gray-500">Add one or more phone numbers we can contact in an emergency.</p>
              {emergencyContacts.map((value, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="tel"
                    inputMode="tel"
                    value={value}
                    onChange={(e) => {
                      const next = [...emergencyContacts];
                      next[idx] = e.target.value;
                      setEmergencyContacts(next);
                    }}
                    className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., +1 555 123 4567"
                  />
                  <button
                    type="button"
                    onClick={() => setEmergencyContacts((prev) => prev.filter((_, i) => i !== idx))}
                    className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800"
                    aria-label="Remove contact"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setEmergencyContacts((prev) => [...prev, ""])}
                className="mt-1 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800"
              >
                Add another contact
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium px-4 py-2 transition-colors"
          >
            {loading ? "Please wait…" : cta}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href={altHref} className="text-sm text-blue-600 hover:text-blue-700">
            {altText}
          </Link>
        </div>
      </div>
    </div>
  );
}
