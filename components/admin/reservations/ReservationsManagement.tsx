"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw } from "lucide-react";
import {
  GenericTable,
  type GenericTableColumn,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { FormSearch, FormSelect } from "@/components/ui/form";

type ReservationStatus = "CONFIRMED" | "CANCELLED";
type StatusFilter = "ALL" | ReservationStatus;

type Reservation = {
  reservationId: string;
  reservationTitle: string;
  startTime: string;
  endTime: string;
  reservationStatus: ReservationStatus;
  notes: string | null;
  createdAt: string;
  user: {
    userId: string;
    fullName: string;
    email: string;
  };
  resource: {
    resourceId: string;
    resourceCode: string;
    resourceName: string;
    location: string | null;
  };
};

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ReservationsResponse = {
  message?: string;
  data?: Reservation[];
  pagination?: PaginationData;
};

const INITIAL_PAGINATION: PaginationData = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-LK", {
    timeZone: "Asia/Colombo",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-LK", {
    timeZone: "Asia/Colombo",
    dateStyle: "medium",
  }).format(new Date(value));
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [statusInput, setStatusInput] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [pagination, setPagination] =
    useState<PaginationData>(INITIAL_PAGINATION);

  useEffect(() => {
    const controller = new AbortController();

    async function loadReservations() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          search,
          status,
        });

        const response = await fetch(
          `/api/admin/reservations?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result =
          (await response.json()) as ReservationsResponse;

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to load reservations"
          );
        }

        if (!controller.signal.aborted) {
          setReservations(result.data ?? []);
          setPagination(
            result.pagination ?? INITIAL_PAGINATION
          );
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load reservations"
        );
        setReservations([]);
        setPagination(INITIAL_PAGINATION);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadReservations();

    return () => controller.abort();
  }, [page, search, status, refresh]);

  function handleSearch() {
    setPage(1);
    setSearch(searchInput.trim());
    setStatus(statusInput);
  }

  const columns = useMemo<GenericTableColumn<Reservation>[]>(
    () => [
      {
        key: "reservation",
        header: "Reservation",
        render: (reservation) => (
          <div className="min-w-0">
            <p className="font-medium text-slate-900">
              {reservation.reservationTitle}
            </p>
            <p
              className="max-w-[190px] truncate text-xs text-slate-500"
              title={reservation.reservationId}
            >
              {reservation.reservationId}
            </p>
          </div>
        ),
      },
      {
        key: "user",
        header: "User",
        render: (reservation) => (
          <div className="min-w-0">
            <p className="font-medium text-slate-900">
              {reservation.user.fullName}
            </p>
            <p className="break-all text-xs text-slate-500">
              {reservation.user.email}
            </p>
          </div>
        ),
      },
      {
        key: "resource",
        header: "Resource",
        render: (reservation) => (
          <div>
            <p className="font-medium text-slate-900">
              {reservation.resource.resourceName}
            </p>
            <p className="text-xs text-indigo-600">
              {reservation.resource.resourceCode}
            </p>
          </div>
        ),
      },
      {
        key: "startTime",
        header: "Start Time",
        render: (reservation) =>
          formatDateTime(reservation.startTime),
      },
      {
        key: "endTime",
        header: "End Time",
        render: (reservation) =>
          formatDateTime(reservation.endTime),
      },
      {
        key: "status",
        header: "Status",
        render: (reservation) => (
          <StatusBadge
            status={
              reservation.reservationStatus === "CONFIRMED"
                ? "Confirmed"
                : "Cancelled"
            }
            variant={
              reservation.reservationStatus === "CONFIRMED"
                ? "success"
                : "danger"
            }
            size="sm"
          />
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        render: (reservation) => (
          <button
            type="button"
            onClick={() => setSelectedReservation(reservation)}
            title="View reservation"
            aria-label={`View ${reservation.reservationTitle}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-indigo-600 transition hover:bg-indigo-50"
          >
            <Eye size={18} />
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-7">
      <PageHeader
        title="Reservation Management"
        description="View and manage reservations across all users and resources."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Reservations" },
        ]}
        actions={
          <button
            type="button"
            onClick={() => setRefresh((value) => value + 1)}
            disabled={loading}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        }
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSearch();
        }}
        className="flex flex-col gap-4 lg:flex-row lg:items-center"
      >
        <div className="min-w-0 flex-1">
          <FormSearch
            value={searchInput}
            onChange={(event) =>
              setSearchInput(event.target.value)
            }
            placeholder="Search reservation, user or resource..."
            aria-label="Search reservations"
          />
        </div>

        <div className="w-full lg:w-56">
          <FormSelect
            value={statusInput}
            onChange={(event) =>
              setStatusInput(
                event.target.value as StatusFilter
              )
            }
            aria-label="Filter by status"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </FormSelect>
        </div>

        <button
          type="submit"
          className="h-11 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          Search
        </button>
      </form>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <GenericTable<Reservation>
        data={reservations}
        columns={columns}
        getRowKey={(reservation) =>
          reservation.reservationId
        }
        loading={loading}
        emptyMessage={
          error
            ? "Unable to display reservations."
            : "No reservations found."
        }
        searchable={false}
        pagination={false}
      />

      <div className="rounded-2xl border border-slate-200 bg-white px-5 pb-4 shadow-sm">
        <Pagination
          currentPage={pagination.page}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={setPage}
          showPageSize={false}
          showInfo
          disabled={loading}
        />
      </div>

      <Modal
        open={selectedReservation !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedReservation(null);
        }}
        title="Reservation Details"
        description="Complete booking information"
        size="lg"
        footer={
          <button
            type="button"
            onClick={() => setSelectedReservation(null)}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Close
          </button>
        }
      >
        {selectedReservation && (
          <dl className="divide-y divide-slate-100">
            {[
              ["Reservation ID",selectedReservation.reservationId,],
              ["Title",selectedReservation.reservationTitle,],
              ["User",selectedReservation.user.fullName,],
              ["Email",selectedReservation.user.email,],
              ["Resource",selectedReservation.resource.resourceName,],
              ["Resource Code",selectedReservation.resource.resourceCode,],
              ["Location",selectedReservation.resource.location || "—",],
              ["Start Time",formatDateTime(selectedReservation.startTime),],
              ["End Time",formatDateTime(selectedReservation.endTime),],
              ["Status",selectedReservation.reservationStatus,],
              ["Created At",formatDate(selectedReservation.createdAt),],
              ["Notes",selectedReservation.notes || "—",],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm"
              >
                <dt className="text-slate-500">{label}</dt>
                <dd className="max-w-full break-words text-right font-medium text-slate-900">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>
    </div>
  );
}
