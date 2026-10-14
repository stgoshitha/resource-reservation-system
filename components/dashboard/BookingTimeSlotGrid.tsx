"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
type BusyRange = { startTime: string; endTime: string; status?: "RESERVED" | "HELD" };
type OperatingWindow = { startTime: string; endTime: string };
type ScheduleResponse = {
  date: string;
  busy: BusyRange[];
  operatingWindows: OperatingWindow[];
  operatingHoursMode: "STANDARD" | "WEEKLY" | "ALWAYS_OPEN";
  bookingIntervalMinutes: number;
  message?: string;
};
type Props = {
  resourceId: string;
  intervalMinutes: number;
  disabled?: boolean;
  refreshKey?: number;
  onSelectionChange: (startTime: string, endTime: string) => void;
};
const OFFSET = "+05:30";
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
function colomboToday(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
function parseCalendarDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day || 1);
}
function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function timeText(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour % 12 || 12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}
function instant(date: string, minutes: number) {
  return new Date(
    new Date(`${date}T00:00:00${OFFSET}`).getTime() + minutes * 60_000,
  );
}
export default function BookingTimeSlotGrid({
  resourceId,
  intervalMinutes,
  disabled,
  refreshKey,
  onSelectionChange,
}: Props) {
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState<BusyRange[]>([]);
  const [operatingWindows, setOperatingWindows] = useState<OperatingWindow[]>([]);
  const [operatingMode, setOperatingMode] = useState<
    ScheduleResponse["operatingHoursMode"] | null
  >(null);
  const [serverInterval, setServerInterval] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startIndex, setStartIndex] = useState<number | null>(null);
  const [endIndex, setEndIndex] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [mobilePeriod, setMobilePeriod] = useState<
    "morning" | "afternoon" | "evening" | "night"
  >("morning");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = parseCalendarDate(colomboToday());
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const calendarRef = useRef<HTMLDivElement>(null);
  const lastScheduleContextRef = useRef("");
  const selectionRef = useRef<{
    start: number | null;
    end: number | null;
  }>({ start: null, end: null });
  const onSelectionChangeRef = useRef(onSelectionChange);
  const today = colomboToday();
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);
  // Automatically refresh availability every 5 seconds while the page is visible.
  useEffect(() => {
    if (!date || disabled) return;
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setRefresh((current) => current + 1);
      }
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [date, disabled]);
  useEffect(() => {
    if (!calendarOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setCalendarOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setCalendarOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [calendarOpen]);
  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const leading = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: leading }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) =>
        dateKey(year, month, index + 1),
      ),
    ];
  }, [visibleMonth]);
  const monthTitle = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);
  const selectedDateLabel = date
    ? new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(parseCalendarDate(date))
    : "Select a booking date";
  const currentMonth = parseCalendarDate(today);
  const previousMonthDisabled =
    visibleMonth.getFullYear() === currentMonth.getFullYear() &&
    visibleMonth.getMonth() === currentMonth.getMonth();
  function selectDate(value: string) {
    if (disabled || value < colomboToday()) return;
    setDate(value);
    setCalendarOpen(false);
  }
  function chooseToday() {
    const value = colomboToday();
    const parsed = parseCalendarDate(value);
    setVisibleMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    selectDate(value);
  }
  const interval =
    serverInterval && 1440 % serverInterval === 0
      ? serverInterval
      : intervalMinutes;
  const validInterval =
    Number.isInteger(interval) &&
    interval > 0 &&
    interval <= 1440 &&
    1440 % interval === 0;
  const total = validInterval ? 1440 / interval : 0;
  const slots = useMemo(() => {
    if (!date || !validInterval) return [];
    return Array.from({ length: total }, (_, i) => {
      const minutes = i * interval;
      const start = instant(date, minutes);
      const end = new Date(start.getTime() + interval * 60_000);
      const availableHours = operatingWindows.some(
        (window) =>
          new Date(window.startTime).getTime() <= start.getTime() &&
          new Date(window.endTime).getTime() >= end.getTime(),
      );
      const overlapping = busy.filter(
        (range) =>
          new Date(range.startTime).getTime() < end.getTime() &&
          new Date(range.endTime).getTime() > start.getTime(),
      );
      const reserved = overlapping.some((range) => range.status !== "HELD");
      const held = !reserved && overlapping.some((range) => range.status === "HELD");
      const booked = reserved || held;
      const past = start.getTime() <= Date.now();
      return {
        index: i,
        booked,
        reserved,
        held,
        past,
        closed: !availableHours,
        label: timeText(minutes),
      };
    });
  }, [busy, date, interval, operatingWindows, total, validInterval]);
  // Reset the selection whenever the resource, date or interval changes.
  useEffect(() => {
    selectionRef.current = { start: null, end: null };
    setStartIndex(null);
    setEndIndex(null);
    onSelectionChangeRef.current("", "");
  }, [resourceId, date, intervalMinutes, serverInterval]);
  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();
    const contextKey = `${resourceId}:${date}`;
    const contextChanged = lastScheduleContextRef.current !== contextKey;
    lastScheduleContextRef.current = contextKey;
    if (contextChanged) {
      setLoading(true);
      setBusy([]);
      selectionRef.current = { start: null, end: null };
      setStartIndex(null);
      setEndIndex(null);
      onSelectionChangeRef.current("", "");
      setOperatingWindows([]);
      setOperatingMode(null);
      setServerInterval(null);
    }
    setError("");
    fetch(
      `/api/resources/${encodeURIComponent(resourceId)}/schedule?date=${encodeURIComponent(date)}`,
      {
        cache: "no-store",
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        const data = (await response.json()) as ScheduleResponse;
        if (!response.ok) {
          throw new Error(
            data.message ?? "Could not load daily availability",
          );
        }
        if (controller.signal.aborted) return;
        const nextBusy = Array.isArray(data.busy) ? data.busy : [];
        const nextWindows = Array.isArray(data.operatingWindows)
          ? data.operatingWindows
          : [];
        const nextInterval = data.bookingIntervalMinutes ?? intervalMinutes;
        const selected = selectionRef.current;
        if (selected.start !== null && selected.end !== null) {
          const selectionUnavailable = Array.from(
            { length: selected.end - selected.start },
            (_, index) => selected.start! + index,
          ).some((slotIndex) => {
            const start = instant(date, slotIndex * nextInterval);
            const end = new Date(
              start.getTime() + nextInterval * 60_000,
            );
            const withinHours = nextWindows.some(
              (window) =>
                new Date(window.startTime).getTime() <= start.getTime() &&
                new Date(window.endTime).getTime() >= end.getTime(),
            );
            const booked = nextBusy.some(
              (range) =>
                new Date(range.startTime).getTime() < end.getTime() &&
                new Date(range.endTime).getTime() > start.getTime(),
            );
            return !withinHours || booked || start.getTime() <= Date.now();
          });
          if (selectionUnavailable) {
            selectionRef.current = { start: null, end: null };
            setStartIndex(null);
            setEndIndex(null);
            onSelectionChangeRef.current("", "");
          }
        }
        setBusy(nextBusy);
        setOperatingWindows(nextWindows);
        setOperatingMode(data.operatingHoursMode ?? null);
        setServerInterval(data.bookingIntervalMinutes ?? null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Could not load daily availability",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [resourceId, date, refresh, refreshKey, intervalMinutes]);
  function updateSelection(start: number | null, end: number | null) {
    selectionRef.current = { start, end };
    setStartIndex(start);
    setEndIndex(end);
    if (start === null || end === null) {
      onSelectionChange("", "");
      return;
    }
    onSelectionChange(
      instant(date, start * interval).toISOString(),
      instant(date, end * interval).toISOString(),
    );
  }
  function choose(i: number) {
    if (
      disabled ||
      loading ||
      error ||
      slots[i]?.booked ||
      slots[i]?.past ||
      slots[i]?.closed
    ) {
      return;
    }
    if (startIndex !== null && endIndex === i) {
      updateSelection(startIndex, i + 1);
    } else {
      updateSelection(i, i + 1);
    }
  }
  function extend() {
    if (startIndex === null || endIndex === null || endIndex >= total) return;
    if (slots[endIndex]?.booked || slots[endIndex]?.past || slots[endIndex]?.closed)
      return;
    updateSelection(startIndex, endIndex + 1);
  }
  const selectedMinutes =
    startIndex !== null && endIndex !== null
      ? (endIndex - startIndex) * interval
      : 0;
  const freeCount = slots.filter(
    (slot) => !slot.booked && !slot.past && !slot.closed,
  ).length;
  const canExtend =
    endIndex !== null &&
    endIndex < total &&
    !slots[endIndex]?.booked &&
    !slots[endIndex]?.past &&
    !slots[endIndex]?.closed;
  // Show only the operating span. Closed gaps inside that span become one separator.
  const visibleSlots = useMemo(() => {
    if (!date || !operatingWindows.length) return [];
    const dayStart = instant(date, 0).getTime();
    const dayEnd = dayStart + 86_400_000;
    const windows = operatingWindows
      .map((window) => ({
        start: Math.max(dayStart, new Date(window.startTime).getTime()),
        end: Math.min(dayEnd, new Date(window.endTime).getTime()),
      }))
      .filter((window) => window.end > window.start);
    if (!windows.length) return [];
    const first = Math.min(...windows.map((window) => window.start));
    const last = Math.max(...windows.map((window) => window.end));
    return slots.filter((slot) => {
      const start = dayStart + slot.index * interval * 60_000;
      const end = start + interval * 60_000;
      return end > first && start < last;
    });
  }, [date, interval, operatingWindows, slots]);
  const periods = [
    { id: "morning", label: "Morning", start: 6 * 60, end: 12 * 60 },
    { id: "afternoon", label: "Afternoon", start: 12 * 60, end: 17 * 60 },
    { id: "evening", label: "Evening", start: 17 * 60, end: 22 * 60 },
    { id: "night", label: "Night", start: 22 * 60, end: 30 * 60 },
  ] as const;
  const displayedSlots =
    operatingMode === "ALWAYS_OPEN"
      ? visibleSlots.filter((slot) => {
          const minutes = slot.index * interval;
          if (mobilePeriod === "night") {
            return minutes >= 22 * 60 || minutes < 6 * 60;
          }
          const period = periods.find(
            (item) => item.id === mobilePeriod,
          )!;
          return minutes >= period.start && minutes < period.end;
        })
      : visibleSlots;
  type GridItem =
    | { kind: "slot"; slot: (typeof slots)[number] }
    | { kind: "gap"; start: number; end: number };
  const gridItems: GridItem[] = [];
  let gapStart: number | null = null;
  for (const slot of displayedSlots) {
    if (slot.closed) {
      if (gapStart === null) gapStart = slot.index * interval;
      continue;
    }
    if (gapStart !== null) {
      gridItems.push({
        kind: "gap",
        start: gapStart,
        end: slot.index * interval,
      });
      gapStart = null;
    }
    gridItems.push({ kind: "slot", slot });
  }
  if (gapStart !== null && displayedSlots.length) {
    gridItems.push({
      kind: "gap",
      start: gapStart,
      end:
        (displayedSlots[displayedSlots.length - 1].index + 1) *
        interval,
    });
  }
  function renderGrid(compact: boolean) {
    return gridItems.map((item) =>
      item.kind === "slot" ? (
        renderSlot(item.slot, compact)
      ) : (
        <div
          key={`closed-${item.start}`}
          className="col-span-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs font-medium text-slate-500"
        >
          <Clock3 size={14} />
          Closed · {timeText(item.start)} – {timeText(item.end)}
        </div>
      ),
    );
  }
  function renderSlot(
    slot: (typeof slots)[number],
    compact = false,
  ) {
    const active =
      startIndex !== null &&
      endIndex !== null &&
      slot.index >= startIndex &&
      slot.index < endIndex;
    const unavailable = slot.booked || slot.past || slot.closed;
    return (
      <button
        key={slot.index}
        type="button"
        disabled={disabled || loading || Boolean(error) || unavailable}
        onClick={() => choose(slot.index)}
        aria-pressed={active}
        aria-label={`${slot.label}, ${
          slot.closed
            ? "Closed"
            : slot.reserved
              ? "Reserved"
              : slot.held
                ? "Temporarily Held"
              : slot.past
                ? "Past"
                : active
                  ? "Selected"
                  : "Available"
        }`}
        className={`rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed ${
          compact
            ? "min-h-12 px-2 py-2 text-center"
            : "min-h-20 p-3"
        } ${
          slot.closed
            ? "border-slate-200 bg-slate-50 text-slate-400"
            : slot.reserved
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : slot.held
                ? "border-amber-300 bg-amber-50 text-amber-800"
              : slot.past
                ? "border-slate-200 bg-slate-100 text-slate-400"
                : active
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-200 bg-white text-slate-800 hover:border-indigo-400 hover:bg-indigo-50"
        }`}
      >
        <span
          className={`block font-semibold ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {slot.label}
        </span>
        {!compact && (
          <span
            className={`mt-2 block text-xs ${
              active
                ? "text-indigo-100"
                : slot.reserved
                  ? "text-rose-600"
                  : slot.held
                    ? "text-amber-700"
                  : slot.past
                    ? "text-slate-400"
                    : "text-emerald-700"
            }`}
          >
            {slot.closed
              ? "— Closed"
              : slot.reserved
                ? "● Reserved"
                : slot.held
                  ? "◷ Temporarily Held"
                : slot.past
                  ? "— Past"
                  : active
                    ? "✓ Selected"
                    : "○ Available"}
          </span>
        )}
        {compact && (slot.booked || slot.closed || active) && (
          <span className="mt-1 block text-[10px]">
            {slot.closed
              ? "Closed"
              : slot.reserved
                ? "Reserved"
                : slot.held
                  ? "Held"
                : "Selected"}
          </span>
        )}
      </button>
    );
  }
  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Step 2 · Choose your time
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">
            Daily availability
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {operatingMode === "ALWAYS_OPEN"
              ? "Open 24 hours"
              : operatingWindows.length
                ? "Category operating hours"
                : "Closed / no operating hours"}{" "}
            · {interval}-minute slots · Sri Lanka time
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          {loading
            ? "Loading..."
            : date
              ? `${freeCount} free slots`
              : "Select date"}
        </span>
      </div>
      <div className="relative max-w-sm" ref={calendarRef}>
        <label
          id="booking-date-label"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Booking date
        </label>
        <button
          type="button"
          aria-labelledby="booking-date-label"
          aria-expanded={calendarOpen}
          aria-haspopup="dialog"
          disabled={disabled}
          onClick={() => {
            if (!calendarOpen) {
              const base = parseCalendarDate(date || colomboToday());
              setVisibleMonth(
                new Date(base.getFullYear(), base.getMonth(), 1),
              );
            }
            setCalendarOpen((open) => !open);
          }}
          className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3.5 text-left shadow-sm transition focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 ${
            calendarOpen
              ? "border-indigo-500 ring-4 ring-indigo-50"
              : "border-slate-200 hover:border-indigo-300"
          }`}
        >
          <span
            className={`text-sm font-medium ${
              date ? "text-slate-900" : "text-slate-400"
            }`}
          >
            {selectedDateLabel}
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <CalendarDays size={18} />
          </span>
        </button>
        {calendarOpen && !disabled && (
          <div
            role="dialog"
            aria-label="Choose booking date"
            className="absolute left-0 top-full z-50 mt-2 w-full min-w-[290px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                {monthTitle}
              </h4>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous month"
                  disabled={previousMonthDisabled}
                  onClick={() =>
                    setVisibleMonth(
                      (month) =>
                        new Date(
                          month.getFullYear(),
                          month.getMonth() - 1,
                          1,
                        ),
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() =>
                    setVisibleMonth(
                      (month) =>
                        new Date(
                          month.getFullYear(),
                          month.getMonth() + 1,
                          1,
                        ),
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((weekday) => (
                <div
                  key={weekday}
                  className="flex h-8 items-center justify-center text-[11px] font-semibold text-slate-400"
                >
                  {weekday}
                </div>
              ))}
              {calendarDays.map((value, index) =>
                value ? (
                  <button
                    key={value}
                    type="button"
                    disabled={value < today}
                    aria-label={new Intl.DateTimeFormat("en-US", {
                      dateStyle: "full",
                    }).format(parseCalendarDate(value))}
                    aria-pressed={date === value}
                    onClick={() => selectDate(value)}
                    className={`relative flex aspect-square min-h-9 items-center justify-center rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                      date === value
                        ? "bg-indigo-600 font-bold text-white shadow-sm shadow-indigo-200"
                        : value < today
                          ? "cursor-not-allowed text-slate-300"
                          : value === today
                            ? "bg-indigo-50 font-bold text-indigo-700 hover:bg-indigo-100"
                            : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                    }`}
                  >
                    {Number(value.slice(-2))}
                    {value === today && date !== value && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-indigo-600" />
                    )}
                  </button>
                ) : (
                  <div key={`empty-${index}`} />
                ),
              )}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock3 size={13} /> Sri Lanka time
              </span>
              <button
                type="button"
                onClick={chooseToday}
                className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                Today
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded bg-slate-50 ring-1 ring-slate-200" />
          Closed
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-300" />
          Available
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded bg-amber-100 ring-1 ring-amber-300" />
          Temporarily Held
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded bg-rose-100 ring-1 ring-rose-300" />
          Reserved
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded bg-indigo-600" />
          Selected
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded bg-slate-200" />
          Past
        </span>
      </div>
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-bold text-slate-900">
            Your selected time
          </h4>
          {selectedMinutes > 0 && (
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              {selectedMinutes} minutes
            </span>
          )}
        </div>
        {startIndex !== null && endIndex !== null ? (
          <>
            <p className="mt-3 rounded-xl border border-indigo-100 bg-white p-4 text-lg font-bold text-indigo-700">
              {timeText(startIndex * interval)}{" "}
              <span className="text-slate-400">→</span>{" "}
              {timeText(endIndex * interval)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={disabled || !canExtend}
                onClick={extend}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
              >
                + Add {interval} minutes
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => updateSelection(null, null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Clear selection
              </button>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Choose an available time slot below to start your reservation.
          </p>
        )}
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
          <button
            type="button"
            className="ml-2 font-semibold underline"
            onClick={() => setRefresh((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      )}
      {!date ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          Choose a date to load the real reservation schedule.
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          Loading reserved time slots...
        </div>
      ) : (
        !error && (
          <>
            {operatingWindows.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                This category is closed on the selected date. Please choose
                another date.
              </p>
            ) : (
              <>
                {operatingMode === "ALWAYS_OPEN" && (
                  <div
                    className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1"
                    role="group"
                    aria-label="Time of day"
                  >
                    {periods.map((period) => (
                      <button
                        key={period.id}
                        type="button"
                        aria-pressed={mobilePeriod === period.id}
                        onClick={() => setMobilePeriod(period.id)}
                        className={`rounded-lg px-2 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
                          mobilePeriod === period.id
                            ? "bg-white text-indigo-700 shadow-sm"
                            : "text-slate-600"
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 md:hidden">
                  {renderGrid(true)}
                </div>
                <div className="hidden grid-cols-4 gap-2 md:grid lg:grid-cols-5">
                  {renderGrid(false)}
                </div>
                {gridItems.length === 0 && (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                    No slots in this time period.
                  </p>
                )}
              </>
            )}
          </>
        )
      )}
      <p className="text-xs text-slate-500">
        Availability may change before confirmation. The server checks for
        overlapping bookings when you confirm. Times shown are in Sri Lanka
        time and follow category operating hours.
      </p>
    </section>
  );
}
