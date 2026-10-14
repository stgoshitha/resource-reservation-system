
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50">
      {/* Navigation */}
      <header className="relative z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-sm">
              R
            </div>

            <span className="text-xl font-bold tracking-tight text-slate-900">
              Reserve<span className="text-indigo-600">Hub</span>
            </span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero section */}
      <main className="relative flex flex-1 items-center">
        <div className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-indigo-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Smarter Resource Management
            </div>

            <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Book resources.
              <br />
              <span className="text-indigo-600">
                Simplify your day.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-8 text-slate-600 sm:text-lg">
              A simple and reliable way to discover shared
              resources, check availability, and manage
              reservations—all in one place.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
              >
                Start reserving
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </Link>

              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-7 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:text-indigo-600"
              >
                Sign in to your account
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <span className="text-indigo-600">✓</span>
                Real-time availability checks
              </div>

              <div className="flex items-center gap-2">
                <span className="text-indigo-600">✓</span>
                Conflict-free reservations
              </div>
            </div>
          </div>

          {/* Resource preview */}
          <div className="relative">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/70 sm:p-7">
              <div className="mb-7 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Resource overview
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Find your next space
                  </h2>
                </div>

                <div className="rounded-xl bg-indigo-50 p-3 text-xl">
                  📅
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    icon: "🏢",
                    name: "Conference Room",
                    detail: "Meetings and collaboration",
                    status: "Available",
                  },
                  {
                    icon: "💻",
                    name: "Computer Lab",
                    detail: "Workshops and training",
                    status: "Available",
                  },
                  {
                    icon: "🎥",
                    name: "Media Studio",
                    detail: "Creative production",
                    status: "Check slots",
                  },
                ].map((resource) => (
                  <div
                    key={resource.name}
                    className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                      {resource.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900">
                        {resource.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {resource.detail}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                      {resource.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-indigo-600 p-5 text-white">
                <p className="text-sm text-indigo-100">
                  Easy scheduling
                </p>
                <p className="mt-2 text-lg font-semibold">
                  Your resources, one simple dashboard.
                </p>
                <p className="mt-2 text-sm leading-6 text-indigo-100">
                  Organize bookings and keep track of your
                  upcoming reservations.
                </p>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-xl shadow-slate-200/60 sm:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  ✓
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Booking confirmed
                  </p>
                  <p className="text-xs text-slate-500">
                    Simple and secure
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-slate-200 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-center text-sm text-slate-500 sm:flex-row lg:px-8">
          <p>
            © {new Date().getFullYear()} ReserveHub.
            All rights reserved.
          </p>

          <p>Resource Reservation Management System</p>
        </div>
      </footer>
    </div>
  );
}
