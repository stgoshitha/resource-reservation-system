"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { isBookingTimeAligned } from "@/src/lib/config/booking-timezone";

export type Resource = {
  resourceId: string;
  resourceCode: string;
  resourceName: string;
  location: string | null;
  capacity: number | null;
  category: {
    categoryId: string;
    categoryName: string;
    bookingIntervalMinutes: number;
  };
};
export type ReservationHold = { holdId: string; expiresAt: string; resourceId: string; startTime: string; endTime: string };
const PAGE_SIZE = 6;
const DRAFT_KEY = "reservehub:active-booking:v1";
type BookingDraft = {
  hold: ReservationHold;
  title: string;
  notes: string;
  step: 3 | 4;
};

async function readResponse(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
function messageOf(data: Record<string, unknown>, fallback: string) {
  return typeof data.message === "string" ? data.message : fallback;
}
export default function useResourceBooking() {
  const [restoring, setRestoring] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [resourceId, setResourceId] = useState("");
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [scheduleRefresh, setScheduleRefresh] = useState(0);
  const [step, setStep] = useState(1);
  const [hold, setHold] = useState<ReservationHold | null>(null);
  const [holdSecondsLeft, setHoldSecondsLeft] = useState(0);
  const holdRef = useRef<ReservationHold | null>(null);
  const holdingRef = useRef(false);
  const confirmingRef = useRef(false);
  const holdRequestRef = useRef(0);
  const holdExpiredRef = useRef(false);
  const warnedHoldRef = useRef({ holdId: "", twoMinutes: false, thirtySeconds: false });

  function setActiveHold(value: ReservationHold | null) {
    // Keep the current hold available after a full browser refresh.
    // Server verification is always required before restoring it.
    holdRef.current = value;
    setHold(value);
    if (!value) {
      try { window.sessionStorage.removeItem(DRAFT_KEY); } catch { /* Storage disabled */ }
    }
    setHoldSecondsLeft(value ? Math.max(0, Math.ceil((new Date(value.expiresAt).getTime() - Date.now()) / 1000)) : 0);
  }

  // Recover only a hold that still exists, belongs to this user, and has not expired.
  useEffect(() => {
    let cancelled = false;
    async function recover() {
      try {
        const raw = window.sessionStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        const draft = JSON.parse(raw) as BookingDraft;
        if (!draft?.hold?.holdId || !draft.hold.resourceId ||
            !draft.hold.startTime || !draft.hold.endTime ||
            new Date(draft.hold.expiresAt).getTime() <= Date.now()) {
          window.sessionStorage.removeItem(DRAFT_KEY);
          return;
        }
        const response = await fetch(
          `/api/reservation-holds/${encodeURIComponent(draft.hold.holdId)}`,
          { cache: "no-store", credentials: "same-origin" },
        );
        if (!response.ok) {
          if (response.status === 404 || response.status === 410) {
            window.sessionStorage.removeItem(DRAFT_KEY);
          }
          return;
        }
        const data = await readResponse(response);
        const verified = data.hold as ReservationHold | undefined;
        if (cancelled || !verified ||
            verified.resourceId !== draft.hold.resourceId ||
            verified.startTime !== draft.hold.startTime ||
            verified.endTime !== draft.hold.endTime ||
            new Date(verified.expiresAt).getTime() <= Date.now()) {
          window.sessionStorage.removeItem(DRAFT_KEY);
          return;
        }
        holdExpiredRef.current = false;
        setResourceId(verified.resourceId);
        setStartTime(verified.startTime);
        setEndTime(verified.endTime);
        setTitle(typeof draft.title === "string" ? draft.title : "");
        setNotes(typeof draft.notes === "string" ? draft.notes : "");
        setActiveHold(verified);
        const validDetails = typeof draft.title === "string" &&
          draft.title.trim().length >= 2 && draft.title.trim().length <= 150 &&
          typeof draft.notes === "string" && draft.notes.length <= 1000;
        setStep(draft.step === 4 && validDetails ? 4 : 3);
        toast.success("Your active reservation hold was restored.");
      } catch {
        // A transient network error must not delete a potentially valid server hold.
      } finally {
        if (!cancelled) setRestoring(false);
      }
    }
    void recover();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (restoring || !hold) return;
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
        hold, title, notes, step: step === 4 ? 4 : 3,
      } satisfies BookingDraft));
    } catch { /* Storage disabled */ }
  }, [restoring, hold, title, notes, step]);

  // Release the server-side hold before allowing a different time selection.

  // If deletion fails, keep the hold so the UI does not claim the slot is free.

  async function releaseHold(): Promise<boolean> {
    holdRequestRef.current += 1;
    const current = holdRef.current;
    if (!current) return true;
    try {
      const response = await fetch(
        `/api/reservation-holds/${encodeURIComponent(current.holdId)}`,
        { method: "DELETE", credentials: "same-origin", cache: "no-store" }
      );
      // 404 means this hold is already gone.
      if (!response.ok && response.status !== 404) {
        const data = await readResponse(response);
        throw new Error(messageOf(data, "Could not release the time slot. Please try again."));
      }
      if (holdRef.current?.holdId === current.holdId) setActiveHold(null);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not release the time slot.");
      return false;
    }
  }

  // Back from booking details to the time grid: release first, then refresh.

  async function goBack(targetStep = step - 1) {
    if (saving || targetStep < 1 || targetStep >= step) return;
    if (targetStep <= 2 && holdRef.current) {
      setSaving(true);
      try {
        if (!(await releaseHold())) return;
        setStartTime("");
        setEndTime("");
        setScheduleRefresh((value) => value + 1);
      } finally {
        setSaving(false);
      }
    }
    setStep(targetStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    if (!hold) return;
    const update = () => {
      const seconds = Math.max(0, Math.ceil((new Date(hold.expiresAt).getTime() - Date.now()) / 1000));
      setHoldSecondsLeft(seconds);
      if (seconds === 0 && !holdExpiredRef.current && !confirmingRef.current) {
        holdExpiredRef.current = true;
        holdRequestRef.current += 1;
        setActiveHold(null);
        setStartTime("");
        setEndTime("");
        setScheduleRefresh((value) => value + 1);
        setStep(2);
        toast.error("Your 5-minute hold expired. Please choose a time slot again.");
      }
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [hold]);
  const countdown = `${String(Math.floor(holdSecondsLeft / 60)).padStart(2, "0")}:${String(holdSecondsLeft % 60).padStart(2, "0")}`;

  // Notify once at each threshold, even if the timer skips a second in a background tab.

  useEffect(() => {
    if (!hold || holdSecondsLeft <= 0 || confirmingRef.current) return;
    if (warnedHoldRef.current.holdId !== hold.holdId) {
      warnedHoldRef.current = { holdId: hold.holdId, twoMinutes: false, thirtySeconds: false };
    }
    if (holdSecondsLeft <= 120 && !warnedHoldRef.current.twoMinutes) {
      warnedHoldRef.current.twoMinutes = true;
      toast.warning("Only 2 minutes left to confirm your reservation!", {
        description: "Your selected time slot will be released when the countdown ends.",
        duration: 6000,
      });
    }
    if (holdSecondsLeft <= 30 && !warnedHoldRef.current.thirtySeconds) {
      warnedHoldRef.current.thirtySeconds = true;
      toast.error("Only 30 seconds remaining!", {
        description: "Please confirm your reservation now.",
        duration: 8000,
      });
    }
  }, [hold, holdSecondsLeft]);
  const holdProgress = Math.max(0, Math.min(100, (holdSecondsLeft / 300) * 100));
  const progressColor = holdSecondsLeft <= 30 ? "bg-red-600" : holdSecondsLeft <= 120 ? "bg-amber-500" : "bg-emerald-600";
  const timerColor = holdSecondsLeft <= 30
    ? "border-red-200 bg-red-50 text-red-800"
    : holdSecondsLeft <= 120
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : "border-emerald-200 bg-emerald-50 text-emerald-900";

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/resources", { cache: "no-store" });
        const data = await readResponse(response);
        if (!response.ok) throw new Error(messageOf(data, "Could not load resources"));
        if (active) {
          setResources(Array.isArray(data.resources) ? (data.resources as Resource[]) : []);
        }
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : "Could not load resources");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => {
    const unique = new Map<string, string>();
    resources.forEach((resource) => {
      unique.set(resource.category.categoryId, resource.category.categoryName);
    });
    return [...unique.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [resources]);

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesCategory = categoryId === "all" || resource.category.categoryId === categoryId;
      const matchesSearch = !query || [
        resource.resourceName,
        resource.resourceCode,
        resource.location ?? "",
        resource.category.categoryName,
      ].some((value) => value.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [resources, categoryId, search]);
  const totalPages = Math.max(1, Math.ceil(filteredResources.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleResources = filteredResources.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = resources.find((resource) => resource.resourceId === resourceId);

  function resetAvailability() {
    setSuccess(false);
  }

  async function selectResource(id: string) {
    if (saving) return;
    if (id !== resourceId) {
      setSaving(true);
      const released = await releaseHold();
      setSaving(false);
      if (!released) return;
      setScheduleRefresh((value) => value + 1);
      setResourceId(id);
      setStartTime("");
      setEndTime("");
      resetAvailability();
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const handleGridSelection = useCallback((start: string, end: string) => {
    const current = holdRef.current;
    if (current && (current.startTime !== start || current.endTime !== end)) {
      void releaseHold();
    }
    setStartTime(start);
    setEndTime(end);
    setSuccess(false);
  }, []);

  function getTimeRange() {
    if (!resourceId || !startTime || !endTime) {
      throw new Error("Select a resource, start time and end time.");
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      throw new Error("Invalid date or time.");
    }
    if (start.getTime() <= Date.now()) throw new Error("Start time must be in the future.");
    if (end.getTime() <= start.getTime()) throw new Error("End time must be after start time.");
    const interval = selected?.category.bookingIntervalMinutes ?? 15;
    const duration = end.getTime() - start.getTime();
    if (duration < interval * 60_000) {
      throw new Error(`Minimum booking duration is ${interval} minutes.`);
    }
    if (
      !isBookingTimeAligned(start, interval) ||
      !isBookingTimeAligned(end, interval)
    ) {
      throw new Error(`Choose times aligned to ${interval}-minute intervals.`);
    }
    return { startTime: start.toISOString(), endTime: end.toISOString() };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== 4) return;
    if (title.trim().length < 2 || title.trim().length > 150) {
      return toast.error("Title must be 2–150 characters.");
    }
    if (notes.trim().length > 1000) return toast.error("Notes cannot exceed 1000 characters.");
    try {
      const times = getTimeRange();
      if (!hold || holdSecondsLeft <= 0 || new Date(hold.expiresAt).getTime() <= Date.now()) {
        throw new Error("Your booking hold expired. Please select a time again.");
      }
      if (hold.resourceId !== resourceId || hold.startTime !== times.startTime || hold.endTime !== times.endTime) {
        throw new Error("Booking details changed. Please select a time again.");
      }
      setSaving(true);
      confirmingRef.current = true;
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId,
          holdId: hold.holdId,
          title: title.trim(),
          ...times,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        }),
      });
      const data = await readResponse(response);
      if (!response.ok) {
        if (response.status === 409) {
          void releaseHold();
          setScheduleRefresh((value) => value + 1);
          setStep(2);
          window.scrollTo({ top: 0, behavior: "smooth" });
          throw new Error(messageOf(data, "This time slot is no longer available. Please select another slot."));
        }
        throw new Error(messageOf(data, "Reservation could not be created"));
      }
      holdRequestRef.current += 1;
      setActiveHold(null);
      toast.success("Reservation confirmed successfully!");
      setSuccess(true);
      setScheduleRefresh((value) => value + 1);
      setTitle("");
      setNotes("");
      setStartTime("");
      setEndTime("");
      setResourceId("");
      setStep(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reservation could not be created");
    } finally {
      confirmingRef.current = false;
      setSaving(false);
    }
  }
  const steps = ["Select Resource", "Date & Time", "Booking Details", "Review & Confirm"];
  const validSelection = Boolean(startTime && endTime);
  const validDetails = title.trim().length >= 2 && title.trim().length <= 150 && notes.trim().length <= 1000;
  const formatTime = (value: string) => value ? new Intl.DateTimeFormat("en-LK", {
    timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short",
  }).format(new Date(value)) : "Not selected";

  async function nextStep() {
    if (step === 1 && !selected) return toast.error("Select a resource first.");
    if (step === 2) {
      if (!validSelection) return toast.error("Select a date and available time slots.");
      let times: { startTime: string; endTime: string };
      try { times = getTimeRange(); } catch (error) {
        return toast.error(error instanceof Error ? error.message : "Invalid time range");
      }
      if (holdingRef.current) return;
      holdingRef.current = true;
      setSaving(true);
      const requestId = ++holdRequestRef.current;
      try {
        const response = await fetch("/api/reservation-holds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceId, ...times }),
        });
        const data = await readResponse(response);
        if (!response.ok) {
          if (response.status === 409) setScheduleRefresh((value) => value + 1);
          throw new Error(messageOf(data, "Could not hold the selected time slot"));
        }
        const result = data.hold as ReservationHold | undefined;
        if (!result?.holdId || !result?.expiresAt) throw new Error("Invalid hold response");
        if (requestId !== holdRequestRef.current) {
          void fetch(`/api/reservation-holds/${encodeURIComponent(result.holdId)}`, { method: "DELETE" });
          return;
        }
        holdExpiredRef.current = false;
        setActiveHold({ ...result, resourceId, ...times });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not hold time slot");
        return;
      } finally {
        holdingRef.current = false;
        setSaving(false);
      }
    }
    if (step === 3 && !validDetails) return toast.error("Enter a title (2–150 characters) and keep notes within 1000 characters.");
    setStep((value) => Math.min(4, value + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return {
    resources,
    loading,
    restoring,
    categoryId,
    setCategoryId,
    search,
    setSearch,
    page,
    setPage,
    resourceId,
    title,
    setTitle,
    startTime,
    endTime,
    notes,
    setNotes,
    saving,
    success,
    scheduleRefresh,
    step,
    hold,
    holdSecondsLeft,
    countdown,
    holdProgress,
    progressColor,
    timerColor,
    categories,
    filteredResources,
    totalPages,
    currentPage,
    visibleResources,
    selected,
    selectResource,
    handleGridSelection,
    resetAvailability,
    submit,
    steps,
    validSelection,
    validDetails,
    formatTime,
    nextStep,
    goBack,
  };
}

export type BookingModel = ReturnType<typeof useResourceBooking>;
