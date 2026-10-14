
import { CalendarDays } from "lucide-react";

export default function Loading() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-[28px] bg-indigo-100/70 blur-xl" />

          <div className="relative flex h-20 w-20 items-center justify-center rounded-[24px] bg-indigo-600 shadow-xl shadow-indigo-600/20">
            <CalendarDays
              size={38}
              strokeWidth={1.8}
              className="text-white"
            />
          </div>

          <div className="absolute -inset-3 animate-spin rounded-full border-2 border-transparent border-t-indigo-500 border-r-indigo-200" />
        </div>

        <h1 className="mt-9 text-3xl font-bold tracking-tight text-slate-900">
          Reserve<span className="text-indigo-600">Hub</span>
        </h1>

        <p className="mt-2 text-sm font-medium text-slate-500">
          Resource Reservation System
        </p>

        <div className="mt-10 flex items-center gap-2">
          <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-600 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" />
        </div>

        <p className="mt-4 text-xs font-medium tracking-wide text-slate-400">
          Preparing your workspace...
        </p>
      </div>

      <p className="absolute bottom-8 text-center text-xs text-slate-400">
        Simple bookings. Better resource management.
      </p>
    </div>
  );
}
