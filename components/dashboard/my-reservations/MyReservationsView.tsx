"use client";

import Link from "next/link";
import {
  CalendarDays,
  CircleX,
  List,
  Clock3,
  Download,
  Eye,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import GenericTable from "@/components/ui/table/GenericTable";
import type { GenericTableColumn } from "@/components/ui/table/GenericTable.types";
import Pagination from "@/components/ui/pagination/Pagination";
import { downloadReservationPDF } from "@/src/lib/utils/reservation-pdf";
import { Modal } from "@/components/ui/modal";
import {
  DATE_FORMAT,
  TIME_FORMAT,
  PAGE_SIZE,
  formatDuration,
  reservationStatus,
  statusClass,
} from "./reservation-utils";
import type { Filter } from "./reservation-utils";
import type { MyReservationsModel } from "./useMyReservations";
type Reservation = MyReservationsModel["visible"][number];

export default function MyReservationsView({ model }: { model: MyReservationsModel }) {
  const {
    loading,
    error,
    search,
    setSearch,
    filter,
    setFilter,
    setPage,
    now,
    cancellingId,
    confirmId,
    setConfirmId,
    setDetailsId,
    loadReservations,
    counts,
    filtered,
    totalPages,
    currentPage,
    visible,
    detailsReservation,
    cancelReservation,
  } = model;
  const filters: { id: Filter; label: string; icon: typeof CalendarDays }[] = [
    { id: "upcoming", label: "Upcoming", icon: CalendarDays },
    { id: "past", label: "Past", icon: Clock3 },
    { id: "cancelled", label: "Cancelled", icon: CircleX },
    { id: "all", label: "All", icon: List },
  ];
  const canCancelReservation = (reservation: Reservation) =>
    reservation.reservationStatus !== "CANCELLED" &&
    Date.parse(reservation.startTime) > now;
  const renderActions = (reservation: Reservation, mobile = false) => (
    <div className={`gap-2 ${mobile ? "grid w-full grid-cols-3" : "flex flex-wrap items-center justify-end"}`}>
      <button
        type="button"
        onClick={() => setDetailsId(reservation.reservationId)}
        className={`group/action inline-flex min-h-9 items-center justify-center gap-1.5 ${mobile ? "min-w-0 w-full min-h-10 gap-1 px-1.5 whitespace-nowrap" : ""} rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-100 hover:shadow-sm active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 motion-reduce:transform-none`}
      >
        <Eye className="h-3.5 w-3.5 transition-transform duration-200 group-hover/action:scale-110" />
        View
      </button>
      <button
        type="button"
        onClick={() => downloadReservationPDF(reservation)}
        aria-label={`Download PDF for ${reservation.reservationTitle}`}
        className={`group/action inline-flex min-h-9 items-center justify-center gap-1.5 ${mobile ? "min-w-0 w-full min-h-10 gap-1 px-1.5 whitespace-nowrap" : ""} rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-sm active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 motion-reduce:transform-none`}
      >
        <Download className="h-3.5 w-3.5 transition-transform duration-200 group-hover/action:translate-y-0.5" /> PDF
      </button>
      {canCancelReservation(reservation) && (
        <button
          type="button"
          onClick={() => setConfirmId(reservation.reservationId)}
          className={`group/action inline-flex min-h-9 items-center justify-center gap-1.5 ${mobile ? "min-w-0 w-full min-h-10 gap-1 px-1.5 whitespace-nowrap" : ""} rounded-lg border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-100 hover:shadow-sm active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 motion-reduce:transform-none`}
        >
          <X className="h-3.5 w-3.5 transition-transform duration-200 group-hover/action:rotate-90" /> Cancel
        </button>
      )}
    </div>
  );
  const columns: GenericTableColumn<Reservation>[] = [
    {
      key: "reservation",
      header: "Reservation",
      render: (reservation) => (
        <div className="min-w-36 max-w-64">
          <p className="break-words text-sm font-semibold text-slate-900">{reservation.reservationTitle}</p>
          <p className="mt-1 break-words text-xs text-slate-500">{reservation.resource.resourceName}</p>
          <p className="mt-1 text-xs text-slate-400">{reservation.resource.resourceCode}</p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date & Time",
      render: (reservation) => (
        <div className="flex items-center gap-3 whitespace-nowrap">
          <CalendarDays className="h-4 w-4 shrink-0 text-slate-600" />
          <div>
          <p className="text-sm font-medium text-slate-800">{DATE_FORMAT.format(new Date(reservation.startTime))}</p>
          <p className="mt-1 text-xs text-slate-500">
            {TIME_FORMAT.format(new Date(reservation.startTime))} – {TIME_FORMAT.format(new Date(reservation.endTime))}
          </p>
          </div>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      render: (reservation) => (
        <span className="inline-flex items-center gap-2.5 whitespace-nowrap text-sm text-slate-600">
          <Clock3 className="h-4 w-4 text-slate-600" />
          {formatDuration(reservation.startTime, reservation.endTime)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (reservation) => {
        const status = reservationStatus(reservation, now);
        return (
          <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(status)}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            {status}
          </span>
        );
      },
    },
    { key: "actions", header: "Actions", align: "right", render: (reservation) => renderActions(reservation) },
  ];
  return (
    <main className="w-full min-w-0 space-y-6 pb-10">
      <header className="group relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-indigo-200 hover:shadow-md sm:p-6">
        <div className="flex w-full flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Reservation Management</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">My Reservations</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
              View, track, and manage all your resource reservations in one place.
            </p>
          </div>
          <Link
            href="/dashboard/reservations/new"
            className="group/btn inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 motion-reduce:transform-none sm:w-auto"
          >
            <Plus className="h-4 w-4 transition-transform duration-300 group-hover/btn:rotate-90 motion-reduce:transform-none" />
            New Reservation
          </Link>
        </div>
      </header>
      <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-full items-center gap-2 overflow-x-auto" role="group" aria-label="Filter reservations">
              {filters.map((item) => {
                const active = filter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => { setFilter(item.id); setPage(1); }}
                    className={`group/tab relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-indigo-600 ${active ? "bg-indigo-50 font-semibold text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"}`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                    <span className={`rounded-md px-1.5 py-0.5 text-xs transition-colors duration-300 ${active ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500 group-hover/tab:bg-indigo-50 group-hover/tab:text-indigo-600"}`}>
                      {counts[item.id]}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="group/search relative w-full lg:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors duration-200 group-focus-within/search:text-indigo-600" />
              <input
                type="search"
                aria-label="Search reservations"
                placeholder="Search reservations..."
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
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
            <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-10 text-center">
              <p className="text-sm text-rose-700">{error}</p>
              <button type="button" onClick={() => void loadReservations()} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-50 active:scale-[0.98]">
                <RefreshCw className="h-4 w-4" /> Try again
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4 sm:p-5">
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 px-4 py-14 text-center">
              <span className="rounded-2xl bg-indigo-50 p-4"><CalendarDays className="h-7 w-7 text-indigo-600" /></span>
              <h2 className="font-semibold text-slate-900">
                {search ? "No matching reservations" : `No ${filter === "all" ? "" : `${filter} `}reservations`}
              </h2>
              <p className="max-w-sm text-sm text-slate-500">
                {search ? "Try a different search term or filter." : "Your reservations will appear here once you create them."}
              </p>
              {search ? (
                <button type="button" onClick={() => setSearch("")} className="text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700">Clear search</button>
              ) : (
                <Link href="/dashboard/reservations/new" className="text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700">Book a resource →</Link>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="hidden px-4 pb-5 pt-1 sm:px-5 md:block">
              <div className="mx-auto w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="w-full overflow-x-auto">
                  <GenericTable<Reservation>
                    data={visible}
                    columns={columns}
                    getRowKey={(reservation) => reservation.reservationId}
                    searchable={false}
                    pagination={false}
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-3 p-4 md:hidden">
              {visible.map((reservation) => {
                const status = reservationStatus(reservation, now);
                return (
                  <article key={reservation.reservationId} className="min-w-0 rounded-xl border border-slate-200 p-4 transition-all duration-300 hover:border-indigo-200 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words text-sm font-semibold text-slate-900">{reservation.reservationTitle}</h3>
                        <p className="mt-1 break-words text-xs text-slate-500">{reservation.resource.resourceName}</p>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(status)}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>
                    </div>
                    <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3 text-sm text-slate-600">
                      <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-indigo-500" />{DATE_FORMAT.format(new Date(reservation.startTime))}</p>
                      <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 shrink-0 text-indigo-500" />{TIME_FORMAT.format(new Date(reservation.startTime))} – {TIME_FORMAT.format(new Date(reservation.endTime))} · {formatDuration(reservation.startTime, reservation.endTime)}</p>
                    </div>
                    <div className="mt-4 border-t border-slate-100 pt-3">{renderActions(reservation, true)}</div>
                  </article>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
                <Pagination
                  currentPage={currentPage}
                  totalItems={filtered.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                  showPageSize={false}
                  showInfo
                />
              </div>
            )}
          </>
        )}
      </section>
      <Modal
        open={Boolean(detailsReservation)}
        onOpenChange={(open) => {
          if (!open) setDetailsId(null);
        }}
        title="Reservation Details"
        description={detailsReservation?.reservationTitle}
        size="md"
        position="center"
        footer={
          <>
            <button
              type="button"
              disabled={!detailsReservation}
              onClick={() => {
                if (detailsReservation) {
                  downloadReservationPDF(detailsReservation);
                }
              }}
              className="group inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 motion-reduce:transform-none"
            >
              <Download className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
              Download PDF
            </button>
          </>
        }
      >
        {detailsReservation && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
              <span className="text-sm font-medium text-slate-600">
                Reservation Status
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                  reservationStatus(detailsReservation, now)
                )}`}
              >
                {reservationStatus(detailsReservation, now)}
              </span>
            </div>
            <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
              {[
                ["Resource", detailsReservation.resource.resourceName],
                ["Code", detailsReservation.resource.resourceCode],
                [
                  "Location",
                  detailsReservation.resource.location || "Not specified",
                ],
                [
                  "Date",
                  DATE_FORMAT.format(new Date(detailsReservation.startTime)),
                ],
                [
                  "Time",
                  `${TIME_FORMAT.format(
                    new Date(detailsReservation.startTime)
                  )} – ${TIME_FORMAT.format(
                    new Date(detailsReservation.endTime)
                  )}`,
                ],
                [
                  "Duration",
                  formatDuration(
                    detailsReservation.startTime,
                    detailsReservation.endTime
                  ),
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[100px_minmax(0,1fr)] items-start gap-4 py-3.5 text-sm sm:grid-cols-[120px_minmax(0,1fr)]"
                >
                  <dt className="font-medium text-slate-500">{label}</dt>
                  <dd className="min-w-0 break-words text-right font-semibold text-slate-800">
                    {value}
                  </dd>
                </div>
              ))}
              <div className="py-4">
                <dt className="mb-2 text-sm font-medium text-slate-500">
                  Reservation Notes
                </dt>
                <dd className="rounded-lg bg-slate-50 p-4 text-left text-sm font-normal leading-7 whitespace-pre-wrap break-words text-slate-700">
                  {detailsReservation.notes || "No additional notes provided."}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>
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
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 active:scale-[0.98]">
                Keep reservation
              </button>
              <button
                type="button"
                disabled={Boolean(cancellingId)}
                onClick={() => void cancelReservation(confirmId)}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-rose-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50">
                {cancellingId ? "Cancelling..." : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
