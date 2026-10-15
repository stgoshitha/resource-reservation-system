"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { type Reservation, type Filter, PAGE_SIZE, getMessage } from "./reservation-utils";

export function useMyReservations() {
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
  return { reservations, loading, error, search, setSearch, filter, setFilter, page, setPage, now, cancellingId, confirmId, setConfirmId, detailsId, setDetailsId, loadReservations, counts, filtered, totalPages, currentPage, visible, detailsReservation, cancelReservation };
}

export type MyReservationsModel = ReturnType<typeof useMyReservations>;
