"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  Eye,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Reservation = {
  reservationId: string;
  reservationTitle: string;
  reservationStatus: "CONFIRMED" | "CANCELLED";
  startTime: string;
  endTime: string;
  notes: string | null;
  resource: {
    resourceName: string;
    resourceCode: string;
    location: string | null;
    capacity?: number | null;
    category?: { categoryName: string };
  };
};

type Filter = "upcoming" | "past" | "cancelled" | "all";

const PAGE_SIZE = 6;

const DATE_FORMAT = new Intl.DateTimeFormat("en-LK", {
  timeZone: "Asia/Colombo",
  dateStyle: "medium",
});

const TIME_FORMAT = new Intl.DateTimeFormat("en-LK", {
  timeZone: "Asia/Colombo",
  hour: "numeric",
  minute: "2-digit",
});

function getMessage(value: unknown, fallback: string) {
  if (value && typeof value === "object" && "message" in value) {
    const message = (value as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

function formatDuration(start: string, end: string) {
  const minutes = Math.max(
    0,
    Math.round((Date.parse(end) - Date.parse(start)) / 60_000),
  );
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours
    ? `${hours}h${remainder ? ` ${remainder}m` : ""}`
    : `${minutes}m`;
}

function reservationStatus(reservation: Reservation, now: number) {
  if (reservation.reservationStatus === "CANCELLED") return "Cancelled";
  if (Date.parse(reservation.endTime) <= now) return "Completed";
  if (Date.parse(reservation.startTime) <= now) return "In progress";
  return "Confirmed";
}

function statusClass(status: string) {
  if (status === "Cancelled") return "bg-rose-50 text-rose-700";
  if (status === "Completed") return "bg-slate-100 text-slate-600";
  if (status === "In progress") return "bg-blue-50 text-blue-700";
  return "bg-emerald-50 text-emerald-700";
}

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [page, setPage] = useState(1);
  const [now, setNow] = useState(() => Date.now());
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const loadReservations = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");

    try {
      // Preserve the existing paginated API integration.
      const allReservations: Reservation[] = [];
      let apiPage = 1;
      let totalPages = 1;

      do {
        const response = await fetch(
          `/api/reservations?page=${apiPage}&limit=100`,
          { cache: "no-store", signal },
        );
        const data: unknown = await response.json();

        if (!response.ok) {
          throw new Error(getMessage(data, "Could not load reservations."));
        }
        if (!data || typeof data !== "object" || !("data" in data)) {
          throw new Error("Unexpected reservations response.");
        }

        const result = data as {
          data: unknown;
          pagination?: { totalPages?: number };
        };
        if (!Array.isArray(result.data)) {
          throw new Error("Invalid reservations response.");
        }

        allReservations.push(...(result.data as Reservation[]));
        totalPages = result.pagination?.totalPages ?? 1;
        apiPage += 1;
      } while (apiPage <= totalPages && !signal?.aborted);

      if (!signal?.aborted) {
        setReservations(allReservations);
        setNow(Date.now());
      }
    } catch (caught) {
      if (signal?.aborted) return;
      setError(
        caught instanceof Error ? caught.message : "Could not load reservations.",
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadReservations(controller.signal);
    return () => controller.abort();
  }, [loadReservations]);

  const counts = useMemo(
    () => ({
      upcoming: reservations.filter(
        (r) =>
          r.reservationStatus === "CONFIRMED" && Date.parse(r.endTime) > now,
      ).length,
      past: reservations.filter(
        (r) =>
          r.reservationStatus === "CONFIRMED" && Date.parse(r.endTime) <= now,
      ).length,
      cancelled: reservations.filter(
        (r) => r.reservationStatus === "CANCELLED",
      ).length,
      all: reservations.length,
    }),
    [reservations, now],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reservations
      .filter((r) => {
        if (filter === "cancelled") return r.reservationStatus === "CANCELLED";
        if (filter === "upcoming") {
          return r.reservationStatus === "CONFIRMED" && Date.parse(r.endTime) > now;
        }
        if (filter === "past") {
          return r.reservationStatus === "CONFIRMED" && Date.parse(r.endTime) <= now;
        }
        return true;
      })
      .filter((r) =>
        [
          r.reservationTitle,
          r.resource.resourceName,
          r.resource.resourceCode,
          r.resource.category?.categoryName ?? "",
          r.resource.location ?? "",
        ].some((text) => text.toLowerCase().includes(query)),
      )
      .sort((a, b) =>
        filter === "past"
          ? Date.parse(b.startTime) - Date.parse(a.startTime)
          : Date.parse(a.startTime) - Date.parse(b.startTime),
      );
  }, [reservations, filter, search, now]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const detailsReservation = reservations.find(
    (reservation) => reservation.reservationId === detailsId,
  );

  async function cancelReservation(id: string) {
    if (cancellingId) return;
    setCancellingId(id);

    try {
      const response = await fetch(
        `/api/reservations/${encodeURIComponent(id)}/cancel`,
        { method: "PATCH" },
      );
      const data: unknown = await response.json();
      if (!response.ok) {
        throw new Error(getMessage(data, "Could not cancel reservation."));
      }

      toast.success("Reservation cancelled.");
      setConfirmId(null);
      setDetailsId(null);
      await loadReservations();
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "Could not cancel reservation.",
      );
    } finally {
      setCancellingId(null);
    }
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "upcoming", label: "Upcoming" },
    { id: "past", label: "Past" },
    { id: "cancelled", label: "Cancelled" },
    { id: "all", label: "All" },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Reservations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage your resource bookings in one place.
          </p>
        </div>
        <Link
          href="/dashboard/reservations/new"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <Plus className="h-4 w-4" />
          New Reservation
        </Link>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div
              className="flex max-w-full gap-1 overflow-x-auto pb-1"
              role="group"
              aria-label="Filter reservations"
            >
              {filters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={filter === item.id}
                  onClick={() => {
                    setFilter(item.id);
                    setPage(1);
                  }}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                    filter === item.id
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {item.label}
                  <span className="ml-1 text-xs opacity-70">{counts[item.id]}</span>
                </button>
              ))}
            </div>

            <div className="relative w-full lg:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                aria-label="Search reservations"
                placeholder="Search reservations..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-4 sm:p-5" aria-label="Loading reservations">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 sm:p-5">
            <div
              role="alert"
              className="flex flex-col items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-10 text-center"
            >
              <p className="text-sm text-rose-700">{error}</p>
              <button
                type="button"
                onClick={() => void loadReservations()}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
              >
                <RefreshCw className="h-4 w-4" /> Try again
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4 sm:p-5">
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 px-4 py-14 text-center">
              <span className="rounded-2xl bg-indigo-50 p-4">
                <CalendarDays className="h-7 w-7 text-indigo-600" />
              </span>
              <h2 className="font-semibold text-slate-900">
                {search
                  ? "No matching reservations"
                  : `No ${filter === "all" ? "" : `${filter} `}reservations`}
              </h2>
              <p className="max-w-sm text-sm text-slate-500">
                {search
                  ? "Try a different search term or filter."
                  : "Your reservations will appear here once you create them."}
              </p>
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Clear search
                </button>
              ) : (
                <Link
                  href="/dashboard/reservations/new"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Book a resource →
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop and tablet: full-width table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full table-auto border-collapse text-left">
                <thead className="border-b border-slate-200 bg-slate-50/80">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-5 py-3.5">Reservation</th>
                    <th scope="col" className="px-5 py-3.5">Date &amp; Time</th>
                    <th scope="col" className="px-5 py-3.5">Duration</th>
                    <th scope="col" className="px-5 py-3.5">Status</th>
                    <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((reservation) => {
                    const status = reservationStatus(reservation, now);
                    const canCancel =
                      reservation.reservationStatus !== "CANCELLED" &&
                      Date.parse(reservation.startTime) > now;

                    return (
                      <tr
                        key={reservation.reservationId}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="max-w-64 px-5 py-4 align-middle">
                          <p className="break-words text-sm font-semibold text-slate-900">
                            {reservation.reservationTitle}
                          </p>
                          <p className="mt-1 break-words text-xs text-slate-500">
                            {reservation.resource.resourceName}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {reservation.resource.resourceCode}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 align-middle">
                          <p className="text-sm font-medium text-slate-800">
                            {DATE_FORMAT.format(new Date(reservation.startTime))}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {TIME_FORMAT.format(new Date(reservation.startTime))} –{" "}
                            {TIME_FORMAT.format(new Date(reservation.endTime))}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {formatDuration(reservation.startTime, reservation.endTime)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(status)}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setDetailsId(reservation.reservationId)}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600"
                            >
                              <Eye className="h-4 w-4" /> View
                            </button>
                            {canCancel && (
                              <button
                                type="button"
                                onClick={() => setConfirmId(reservation.reservationId)}
                                className="inline-flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-rose-600"
                              >
                                <X className="h-4 w-4" /> Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: readable cards instead of horizontal scrolling */}
            <div className="grid gap-3 p-4 md:hidden">
              {visible.map((reservation) => {
                const status = reservationStatus(reservation, now);
                const canCancel =
                  reservation.reservationStatus !== "CANCELLED" &&
                  Date.parse(reservation.startTime) > now;

                return (
                  <article
                    key={reservation.reservationId}
                    className="min-w-0 rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words text-sm font-semibold text-slate-900">
                          {reservation.reservationTitle}
                        </h3>
                        <p className="mt-1 break-words text-xs text-slate-500">
                          {reservation.resource.resourceName}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(status)}`}
                      >
                        {status}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3 text-sm text-slate-600">
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0 text-indigo-500" />
                        {DATE_FORMAT.format(new Date(reservation.startTime))}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 shrink-0 text-indigo-500" />
                        {TIME_FORMAT.format(new Date(reservation.startTime))} –{" "}
                        {TIME_FORMAT.format(new Date(reservation.endTime))} ·{" "}
                        {formatDuration(reservation.startTime, reservation.endTime)}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => setDetailsId(reservation.reservationId)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600"
                      >
                        <Eye className="h-4 w-4" /> View details
                      </button>
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => setConfirmId(reservation.reservationId)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-rose-600"
                        >
                          <X className="h-4 w-4" /> Cancel
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-4 sm:px-5">
                <p className="text-sm text-slate-500">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-500">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {detailsReservation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetailsId(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="details-heading"
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="details-heading" className="text-lg font-semibold text-slate-900">
                  Reservation details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {detailsReservation.reservationTitle}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close details"
                onClick={() => setDetailsId(null)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
              {[
                ["Resource", detailsReservation.resource.resourceName],
                ["Code", detailsReservation.resource.resourceCode],
                ["Location", detailsReservation.resource.location || "Not specified"],
                ["Date", DATE_FORMAT.format(new Date(detailsReservation.startTime))],
                [
                  "Time",
                  `${TIME_FORMAT.format(new Date(detailsReservation.startTime))} – ${TIME_FORMAT.format(new Date(detailsReservation.endTime))}`,
                ],
                ["Duration", formatDuration(detailsReservation.startTime, detailsReservation.endTime)],
                ["Status", reservationStatus(detailsReservation, now)],
                ["Notes", detailsReservation.notes || "None"],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[100px_minmax(0,1fr)] gap-3 py-3 text-sm">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="break-words text-right font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              onClick={() => setDetailsId(null)}
              className="mt-5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {confirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !cancellingId) {
              setConfirmId(null);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-heading"
            aria-describedby="cancel-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 id="cancel-heading" className="text-lg font-semibold text-slate-900">
              Cancel this reservation?
            </h2>
            <p id="cancel-description" className="mt-2 text-sm text-slate-600">
              This will cancel your booking. You can create a new reservation later.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={Boolean(cancellingId)}
                onClick={() => setConfirmId(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Keep reservation
              </button>
              <button
                type="button"
                disabled={Boolean(cancellingId)}
                onClick={() => void cancelReservation(confirmId)}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {cancellingId ? "Cancelling..." : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
