
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type FieldName = "fullName" | "email" | "password";

type RegisterResponse = {
  message?: string;
  errors?: Partial<Record<FieldName, string[]>>;
  user?: {
    userId: string;
    fullName: string;
    email: string;
    userRole: "USER";
  };
};

const SPECIAL_CHARACTER_REGEX = /[!@#$%^&*(),.?":{}|<>_\-+=]/;

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string[]>>
  >({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setFieldErrors({});

    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedName.length < 2 || normalizedName.length > 150) {
      setError("Full name must contain between 2 and 150 characters.");
      return;
    }

    if (password.length < 8 || password.length > 128) {
      setError("Password must contain between 8 and 128 characters.");
      return;
    }

    if (!SPECIAL_CHARACTER_REGEX.test(password)) {
      setError("Password must contain at least one special character.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          fullName: normalizedName,
          email: normalizedEmail,
          password,
        }),
      });

      const result: RegisterResponse = await response.json();

      if (!response.ok) {
        setError(result.message || "Unable to create account.");
        setFieldErrors(result.errors || {});
        return;
      }

      // Registration creates an account, not a login session.
      // Redirect the user to sign in.
      router.replace("/login?registered=1");
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F7F8FA] px-4 py-8 sm:px-6">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-7 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3563E9] text-white">
            <CalendarCheckIcon />
          </div>

          <span className="text-2xl font-bold tracking-tight text-[#111827]">
            ReserveHub
          </span>
        </div>

        {/* Register Card */}
        <section className="rounded-2xl border border-[#E5EAF1] bg-white px-6 py-8 shadow-[0_8px_32px_rgba(15,23,42,0.035)] sm:px-9 sm:py-9">
          <div className="mb-7 text-center">
            <h1 className="text-[26px] font-semibold tracking-tight text-[#111827]">
              Create an account
            </h1>

            <p className="mt-2 text-sm text-[#64748B]">
              Get started with ReserveHub.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-[#334155]"
              >
                Full name
              </label>

              <input
                id="fullName"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                maxLength={150}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={loading}
                placeholder="Enter your full name"
                aria-invalid={Boolean(fieldErrors.fullName?.length)}
                className="h-12 w-full rounded-xl border border-[#DCE3ED] bg-white px-4 text-base text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3563E9] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              />

              {fieldErrors.fullName?.map((message, index) => (
                <p key={index} className="mt-2 text-xs text-red-600">
                  {message}
                </p>
              ))}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#334155]"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                placeholder="name@example.com"
                aria-invalid={Boolean(fieldErrors.email?.length)}
                className="h-12 w-full rounded-xl border border-[#DCE3ED] bg-white px-4 text-base text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3563E9] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              />

              {fieldErrors.email?.map((message, index) => (
                <p key={index} className="mt-2 text-xs text-red-600">
                  {message}
                </p>
              ))}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[#334155]"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  placeholder="Create a password"
                  aria-invalid={Boolean(fieldErrors.password?.length)}
                  aria-describedby="password-hint"
                  className="h-12 w-full rounded-xl border border-[#DCE3ED] bg-white px-4 pr-12 text-base text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3563E9] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  disabled={loading}
                  className="absolute inset-y-0 right-3 flex items-center justify-center px-2 text-[#64748B] transition-colors hover:text-[#0F172A] disabled:opacity-60"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              <p
                id="password-hint"
                className="mt-2 text-xs leading-5 text-[#94A3B8]"
              >
                8–128 characters, including at least one special character.
              </p>

              {fieldErrors.password?.map((message, index) => (
                <p key={index} className="mt-2 text-xs text-red-600">
                  {message}
                </p>
              ))}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-[#334155]"
              >
                Confirm password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  disabled={loading}
                  placeholder="Confirm your password"
                  className="h-12 w-full rounded-xl border border-[#DCE3ED] bg-white px-4 pr-12 text-base text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3563E9] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((value) => !value)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  aria-pressed={showConfirmPassword}
                  disabled={loading}
                  className="absolute inset-y-0 right-3 flex items-center justify-center px-2 text-[#64748B] transition-colors hover:text-[#0F172A] disabled:opacity-60"
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon />
                  ) : (
                    <EyeIcon />
                  )}
                </button>
              </div>
            </div>

            {/* API Error */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3563E9] text-sm font-semibold text-white transition-colors hover:bg-[#2853D4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#64748B]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#3563E9] transition-colors hover:text-[#2853D4] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </section>

        <p className="mt-7 text-center text-xs text-[#94A3B8]">
          © {new Date().getFullYear()} ReserveHub. All rights reserved.
        </p>
      </div>
    </main>
  );
}

function CalendarCheckIcon() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 10h18M9 16l2 2 4-4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 3 18 18M10.6 5.1A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a15.4 15.4 0 0 1-3 3.7" />
      <path d="M6.5 6.5C3.7 8.3 2 12 2 12s3.5 7 10 7a10.6 10.6 0 0 0 4.1-.8" />
      <path d="M10 10a3 3 0 0 0 4 4" />
    </svg>
  );
}
