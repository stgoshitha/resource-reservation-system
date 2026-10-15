"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import BookingCalendar from "./booking-time-slot-grid/BookingCalendar";
import TimeSlotButton from "./booking-time-slot-grid/TimeSlotButton";
import { colomboToday, parseCalendarDate, dateKey, timeText, instant } from "./booking-time-slot-grid/booking-time-utils";
import type { BusyRange, OperatingWindow, ScheduleResponse, BookingTimeSlotGridProps } from "./booking-time-slot-grid/booking-time-utils";
export default function BookingTimeSlotGrid({
  resourceId,
  intervalMinutes,
  disabled,
  refreshKey,
  onSelectionChange,
}: BookingTimeSlotGridProps) {
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
    : "Select a reservation date";
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
        <TimeSlotButton
          key={item.slot.index}
          slot={item.slot}
          compact={compact}
          active={startIndex !== null && endIndex !== null && item.slot.index >= startIndex && item.slot.index < endIndex}
          disabled={disabled}
          loading={loading}
          error={error}
          onChoose={choose}
        />
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
  const operatingLabel =
    operatingMode === "ALWAYS_OPEN"
      ? "Open 24 hours"
      : operatingWindows.length
        ? operatingWindows.map((window) => {
            const format = (value: string) => new Intl.DateTimeFormat("en-GB", {
              timeZone: "Asia/Colombo", hour: "2-digit", minute: "2-digit", hour12: false,
            }).format(new Date(value));
            return `${format(window.startTime)} – ${format(window.endTime)}`;
          }).join(", ")
        : "Closed";
  const formattedDate = date
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone: "Asia/Colombo" }).format(instant(date, 12 * 60))
    : "";
  return (
    <section className="space-y-5">
      <div className="grid gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 sm:grid-cols-3 sm:p-5">
        <div className="flex items-center gap-3"><Clock3 className="h-6 w-6 shrink-0 text-slate-500" /><div><p className="font-semibold text-slate-900">{interval} minutes</p><p className="text-xs text-slate-500">per slot</p></div></div>
        <div className="flex items-center gap-3"><Clock3 className="h-6 w-6 shrink-0 text-slate-500" /><div><p className="font-semibold text-slate-900">{operatingLabel}</p><p className="text-xs text-slate-500">Operating hours</p></div></div>
        <div className="flex items-center gap-3"><MapPin className="h-6 w-6 shrink-0 text-slate-500" /><div><p className="font-semibold text-slate-900">Sri Lanka time</p><p className="text-xs text-slate-500">Time zone</p></div></div>
      </div>
      <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="min-w-0 border-b border-slate-200 p-4 sm:p-6 lg:border-b-0 lg:border-r">
          <h3 className="mb-5 text-lg font-bold text-slate-900">1. Choose a date</h3>
          <BookingCalendar
            inline
            calendarRef={calendarRef}
            calendarOpen={calendarOpen}
            setCalendarOpen={setCalendarOpen}
            visibleMonth={visibleMonth}
            setVisibleMonth={setVisibleMonth}
            date={date}
            disabled={disabled}
            selectedDateLabel={selectedDateLabel}
            monthTitle={monthTitle}
            previousMonthDisabled={previousMonthDisabled}
            calendarDays={calendarDays}
            today={today}
            selectDate={selectDate}
            chooseToday={chooseToday}
          />
        </div>
        <div className="min-w-0 p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-slate-900">2. Choose a time</h3>
            <span className="text-sm text-slate-500">{formattedDate}</span>
          </div>
          {error && <div role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error} <button type="button" className="font-semibold underline" onClick={() => setRefresh((value) => value + 1)}>Retry</button></div>}
          {!date ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Choose a date to see available time slots.</div>
          ) : loading ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Loading available time slots...</div>
          ) : !error && (
            <>
              {operatingMode === "ALWAYS_OPEN" && (
                <div className="mb-4 grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Time of day">
                  {periods.map((period) => <button key={period.id} type="button" aria-pressed={mobilePeriod === period.id} onClick={() => setMobilePeriod(period.id)} className={`rounded-lg px-1 py-2 text-xs font-semibold transition-colors ${mobilePeriod === period.id ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"}`}>{period.label}</button>)}
                </div>
              )}
              {operatingWindows.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">This category is closed on the selected date. Please choose another date.</div>
              ) : (
                <div className="grid max-h-[480px] grid-cols-2 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
                  {renderGrid(false)}
                  {gridItems.length === 0 && <p className="col-span-full rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No slots in this time period.</p>}
                </div>
              )}
            </>
          )}
          <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600"><CalendarDays size={20} /></span>
              <div className="min-w-0 flex-1"><h4 className="text-sm font-bold text-slate-900">Your selected reservation time</h4><p className="mt-1 text-xs text-slate-500">{selectedMinutes ? `${selectedMinutes} minutes selected` : "Choose an available time slot to start your reservation."}</p></div>
              <span className="rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm font-semibold text-indigo-700">{startIndex !== null && endIndex !== null ? `${timeText(startIndex * interval)} – ${timeText(endIndex * interval)}` : "—"}</span>
            </div>
            {startIndex !== null && endIndex !== null && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-indigo-100 pt-3">
                <button type="button" disabled={disabled || !canExtend} onClick={extend} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40">+ Add {interval} minutes</button>
                <button type="button" disabled={disabled} onClick={() => updateSelection(null, null)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">Clear selection</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs text-slate-600">
        {[
          ["Available", "bg-emerald-200"],
          ["Reserved", "bg-rose-200"],
          ["Closed / Past", "bg-slate-200"],
          ["Temporarily Held", "bg-amber-300"],
          ["Selected", "bg-indigo-400"],
        ].map(([label, color]) => <span key={label} className="inline-flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${color}`} />{label}</span>)}
      </div>
      <p className="text-xs text-slate-500">Availability may change before confirmation. The server checks for overlapping bookings when you confirm. Times shown are in Sri Lanka time and follow category operating hours.</p>
    </section>
  );
}
