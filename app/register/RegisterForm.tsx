"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, Mail, UserRound } from "lucide-react";
import { FormField, FormInput, FormPassword } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";

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

export default function RegisterForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string[]>>
  >({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setFieldErrors({});

    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedName.length < 2 || normalizedName.length > 150) {
      toast.error("Full name must contain between 2 and 150 characters.");
      return;
    }

    if (password.length < 8 || password.length > 128) {
      toast.error("Password must contain between 8 and 128 characters.");
      return;
    }

    if (!SPECIAL_CHARACTER_REGEX.test(password)) {
      toast.error("Password must contain at least one special character.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          fullName: normalizedName,
          email: normalizedEmail,
          password,
        }),
      });

      const result: RegisterResponse = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Unable to create account.");
        setFieldErrors(result.errors || {});
        return;
      }

      // Registration does not create a login session.
      router.replace("/login?registered=1");
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

      <div className="auth-float-in relative z-10 w-full max-w-[760px]">
        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-8 shadow-xl shadow-slate-900/[0.035] sm:px-9 sm:py-10">
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

            <p className="text-sm leading-relaxed text-slate-500">
              Get started with ReserveHub.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 items-start gap-x-5 gap-y-4 sm:grid-cols-2">
              <FormField
                id="fullName"
                label="Full name"
                required
                error={fieldErrors.fullName?.join(" ")}
              >
                <div className="relative">
                  <UserRound
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <FormInput
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
                    error={Boolean(fieldErrors.fullName?.length)}
                    className="h-12 pl-11 text-base"
                  />
                </div>
              </FormField>

              <FormField
                id="email"
                label="Email address"
                required
                error={fieldErrors.email?.join(" ")}
              >
                <div className="relative">
                  <Mail
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <FormInput
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={loading}
                    placeholder="name@example.com"
                    error={Boolean(fieldErrors.email?.length)}
                    className="h-12 pl-11 text-base"
                  />
                </div>
              </FormField>

              <FormField
                id="password"
                label="Password"
                required
                error={fieldErrors.password?.join(" ")}
              >
                <FormPassword
                  id="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  placeholder="Create a password"
                  error={Boolean(fieldErrors.password?.length)}
                  className="h-12 text-base"
                />
              </FormField>

              <FormField
                id="confirmPassword"
                label="Confirm password"
                required
              >
                <FormPassword
                  id="confirmPassword"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={loading}
                  placeholder="Confirm your password"
                  className="h-12 text-base"
                />
              </FormField>
            </div>

            <p className="text-xs text-slate-500">
              Password must be 8–30 characters and include a special character.
            </p>

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
                  Creating account...
                </>
              ) : (
                <>
                  Create account
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
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline"
            >
              Sign in
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
