"use client";

import GenericTable from "@/components/ui/table/GenericTable";

import type { GenericTableColumn } from
  "@/components/ui/table/GenericTable.types";

export interface RecentReservation {
  reservationId: string;
  reservationTitle: string;
  resourceName: string;
  userName: string;
  startTime: string;
  reservationStatus: "CONFIRMED" | "CANCELLED";
}

interface RecentReservationsTableProps {
  reservations: RecentReservation[];
}

const columns: GenericTableColumn<RecentReservation>[] = [
  {
    key: "title",
    header: "Reservation",
    accessor: "reservationTitle",
  },
  {
    key: "resource",
    header: "Resource",
    accessor: "resourceName",
  },
  {
    key: "user",
    header: "Reserved By",
    accessor: "userName",
  },
  {
    key: "startTime",
    header: "Start Time",
    accessor: "startTime",
    render: (row) =>
      new Intl.DateTimeFormat("en-LK", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Colombo",
      }).format(new Date(row.startTime)),
  },
  {
    key: "status",
    header: "Status",
    accessor: "reservationStatus",
    render: (row) => {
      const confirmed =
        row.reservationStatus === "CONFIRMED";

      return (
        <span
          className={[
            "inline-flex rounded-full px-2.5 py-1",
            "text-xs font-semibold",
            confirmed
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-600",
          ].join(" ")}
        >
          {row.reservationStatus}
        </span>
      );
    },
  },
];

export default function RecentReservationsTable({
  reservations,
}: RecentReservationsTableProps) {
  return (
    <GenericTable<RecentReservation>
      data={reservations}
      columns={columns}
      getRowKey={(row) => row.reservationId}
      searchable={false}
      pagination={false}
      emptyMessage="No reservations found."
    />
  );
}