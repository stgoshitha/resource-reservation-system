import Image from "next/image";

export default function Loading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-label="Loading ReserveHub"
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-slate-50 px-6 py-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-indigo-100/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-blue-100/40 blur-3xl"
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <div className="relative flex h-32 w-32 items-center justify-center">
          <div className="absolute inset-4 rounded-full bg-indigo-200/50 blur-2xl" />

          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-indigo-600 border-r-indigo-300 motion-reduce:animate-none" />

          <div className="absolute inset-3 rounded-full border border-indigo-100" />

          <div className="relative animate-[bounce_3s_ease-in-out_infinite] overflow-hidden rounded-2xl bg-white p-1 shadow-xl shadow-indigo-600/15 motion-reduce:animate-none">
            <Image
              src="/ReserveHub-Logo.png"
              alt="ReserveHub Logo"
              width={72}
              height={72}
              className="h-[72px] w-[72px] rounded-xl object-cover"
              priority
            />
          </div>
        </div>

        <h1 className="mt-7 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Reserve<span className="text-indigo-600">Hub</span>
        </h1>

        <p className="mt-2 text-sm font-medium text-slate-500">
          Resource Reservation System
        </p>

        <div
          aria-hidden="true"
          className="mt-8 flex w-full items-center gap-4"
        >
          <div className="h-px flex-1 bg-slate-200" />
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div
          aria-hidden="true"
          className="mt-8 flex items-center justify-center gap-2"
        >
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-600 motion-reduce:animate-none [animation-delay:-0.3s]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-500 motion-reduce:animate-none [animation-delay:-0.15s]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-400 motion-reduce:animate-none" />
        </div>

        <p className="mt-5 text-sm font-medium text-slate-500">
          Preparing your workspace...
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Please wait a moment
        </p>
      </div>

      <p className="absolute bottom-6 left-0 right-0 px-4 text-center text-xs text-slate-400 sm:bottom-8">
        Simple bookings. Better resource management.
      </p>
    </main>
  );
}
