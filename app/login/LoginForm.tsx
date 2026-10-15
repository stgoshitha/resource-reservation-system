"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, LoaderCircle, Mail } from "lucide-react";
import {
  FormField,
  FormInput,
  FormPassword,
} from "@/components/ui/form";
import { toast } from "@/components/ui/toast";

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

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      // Login using the existing authentication API.
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
        toast.error(
          loginResult.message || "Login failed. Please try again."
        );
        return;
      }

      // Verify the authenticated session.
      const meResponse = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const meResult: ApiResponse = await meResponse.json();

      if (!meResponse.ok || !meResult.user) {
        toast.error("Unable to verify your session. Please try again.");
        return;
      }

      // Redirect users based on their assigned role.
      const user = meResult.user;

      if (user.userRole === "ADMIN") {
        router.replace("/admin");
      } else if (user.userRole === "USER") {
        router.replace("/dashboard");
      } else {
        toast.error("Your account has an unsupported role.");
        return;
      }

      setEmail("");
      setPassword("");
      router.refresh();
    } catch {
      toast.error("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-indigo-100/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="auth-glow pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-blue-100/40 blur-3xl"
      />

      <div className="auth-float-in relative z-10 w-full max-w-[440px]">
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-xl shadow-slate-900/[0.035] sm:px-9 sm:py-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-3 overflow-hidden rounded-2xl shadow-lg shadow-indigo-600/15">
              <Image
                src="/ReserveHub-Logo.png"
                alt="ReserveHub Logo"
                width={72}
                height={72}
                className="h-[72px] w-[72px] object-cover"
                priority
              />
            </div>

            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Reserve<span className="text-indigo-600">Hub</span>
            </span>

            <div className="my-4 flex w-full items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Sign in to manage your resource reservations.
            </p>
          </div>

          {registered && (
            <div
              role="status"
              className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              Account created successfully. Please sign in.
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            className="space-y-5"
          >
            <FormField id="email" label="Email address" required>
              <div className="relative">
                <Mail
                  size={18}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <FormInput
                  id="email"
                  type="email"
                  autoComplete="off"
                  required
                  autoFocus
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  placeholder="name@example.com"
                  className="h-12 pl-11 text-base"
                />
              </div>
            </FormField>

            <FormField id="password" label="Password" required>
              <FormPassword
                id="password"
                autoComplete="off"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                placeholder="Enter your password"
                className="h-12 text-base"
              />
            </FormField>

            <button
              type="submit"
              disabled={loading}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight
                    size={18}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Create account
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} ReserveHub. All rights reserved.
        </p>
      </div>
    </main>
  );
}
