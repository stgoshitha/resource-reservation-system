
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type AuthUser = {
  userId: string;
  fullName: string;
  email: string;
  userRole: "ADMIN" | "USER";
};

type ApiResponse = {
  message?: string;
  user?: AuthUser;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const registered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      // Step 1: Login using existing backend API
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const loginResult: ApiResponse = await loginResponse.json();

      if (!loginResponse.ok) {
        setError(loginResult.message || "Login failed. Please try again.");
        return;
      }

      // Step 2: Verify the session
      const meResponse = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const meResult: ApiResponse = await meResponse.json();

      if (!meResponse.ok || !meResult.user) {
        setError("Unable to verify your session. Please try again.");
        return;
      }

      // Step 3: Redirect based on user role
      const user = meResult.user;

      if (user.userRole === "ADMIN") {
        router.replace("/admin");
      } else if (user.userRole === "USER") {
        router.replace("/dashboard");
      } else {
        setError("Your account has an unsupported role.");
        return;
      }

      router.refresh();
    } catch {
      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F7F8FA] px-4 py-8 sm:px-6">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3563E9] text-white">
            <CalendarCheckIcon />
          </div>

          <span className="text-2xl font-bold tracking-tight text-[#111827]">
            ReserveHub
          </span>
        </div>

        {/* Login Card */}
        <section className="rounded-2xl border border-[#E5EAF1] bg-white px-6 py-8 shadow-[0_8px_32px_rgba(15,23,42,0.035)] sm:px-9 sm:py-10">
          <div className="mb-8 text-center">
            <h1 className="text-[26px] font-semibold tracking-tight text-[#111827]">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-[#64748B]">
              Sign in to your account to continue.
            </p>
          </div>

          {/* Registration success */}
          {registered && (
            <div
              role="status"
              className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            >
              Account created successfully. Please sign in.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                className="h-12 w-full rounded-xl border border-[#DCE3ED] bg-white px-4 text-base text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3563E9] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              />
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-xl border border-[#DCE3ED] bg-white px-4 pr-12 text-base text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3563E9] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-3 flex items-center justify-center px-2 text-[#64748B] transition-colors hover:text-[#0F172A] disabled:opacity-60"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Error */}
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
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-[#64748B]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#3563E9] transition-colors hover:text-[#2853D4] hover:underline"
            >
              Create account
            </Link>
          </p>
        </section>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-[#94A3B8]">
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
      <path d="m3 3 18 18M10.6 5.1A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a15.4 15.4 0 0 1-3 3.7M6.5 6.5C3.7 8.3 2 12 2 12s3.5 7 10 7a10.6 10.6 0 0 0 4.1-.8" />
      <path d="M10 10a3 3 0 0 4 4" />
    </svg>
  );
}
