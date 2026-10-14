export type Reservation = {
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

export type Filter = "upcoming" | "past" | "cancelled" | "all";

export const PAGE_SIZE = 6;

export const DATE_FORMAT = new Intl.DateTimeFormat("en-LK", {
  timeZone: "Asia/Colombo",
  dateStyle: "medium",
});

export const TIME_FORMAT = new Intl.DateTimeFormat("en-LK", {
  timeZone: "Asia/Colombo",
  hour: "numeric",
  minute: "2-digit",
});

export function getMessage(value: unknown, fallback: string) {
  if (value && typeof value === "object" && "message" in value) {
    const message = (value as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export function formatDuration(start: string, end: string) {
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

export function reservationStatus(reservation: Reservation, now: number) {
  if (reservation.reservationStatus === "CANCELLED") return "Cancelled";
  if (Date.parse(reservation.endTime) <= now) return "Completed";
  if (Date.parse(reservation.startTime) <= now) return "In progress";
  return "Confirmed";
}

export function statusClass(status: string) {
  if (status === "Cancelled") return "bg-rose-50 text-rose-700";
  if (status === "Completed") return "bg-slate-100 text-slate-600";
  if (status === "In progress") return "bg-blue-50 text-blue-700";
  return "bg-emerald-50 text-emerald-700";
}
