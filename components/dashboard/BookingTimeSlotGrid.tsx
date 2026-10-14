"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";

type BusyRange = { startTime: string; endTime: string };

type ScheduleResponse = { date: string; busy: BusyRange[]; message?: string };

type Props = {
  resourceId: string;
  intervalMinutes: number;
  disabled?: boolean;
  refreshKey?: number;
  onSelectionChange: (startTime: string, endTime: string) => void;
};

const OPEN_MINUTES = 8 * 60;

const CLOSE_MINUTES = 18 * 60;

const OFFSET = "+05:30";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function colomboToday(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
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
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return new Date(`${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00${OFFSET}`);
}

export default function BookingTimeSlotGrid({ resourceId, intervalMinutes, disabled, refreshKey, onSelectionChange }: Props) {
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState<BusyRange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startIndex, setStartIndex] = useState<number | null>(null);
  const [endIndex, setEndIndex] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [mobilePeriod, setMobilePeriod] = useState<"morning" | "afternoon">("morning");

  // Calendar presentation state only; booking behavior remains unchanged.
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = parseCalendarDate(colomboToday());
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const calendarRef = useRef<HTMLDivElement>(null);
  const today = colomboToday();
  useEffect(() => {
    if (!calendarOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
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
      ...Array.from({ length: daysInMonth }, (_, index) => dateKey(year, month, index + 1)),
    ];
  }, [visibleMonth]);
  const monthTitle = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(visibleMonth);
  const selectedDateLabel = date
    ? new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric" }).format(parseCalendarDate(date))
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
  const interval = [15, 30, 60].includes(intervalMinutes) ? intervalMinutes : 30;
  const total = (CLOSE_MINUTES - OPEN_MINUTES) / interval;
  const slots = useMemo(() => Array.from({ length: total }, (_, i) => {
    const start = instant(date, OPEN_MINUTES + i * interval);
    const end = instant(date, OPEN_MINUTES + (i + 1) * interval);
    const booked = busy.some((range) => new Date(range.startTime).getTime() < end.getTime() && new Date(range.endTime).getTime() > start.getTime());
    const past = start.getTime() <= Date.now();
    return { index: i, booked, past, label: timeText(OPEN_MINUTES + i * interval) };
  }), [busy, date, interval, total]);

  // Reset the selection whenever the resource, date or interval changes.
  useEffect(() => {
    setStartIndex(null);
    setEndIndex(null);
    onSelectionChange("", "");
  }, [resourceId, date, intervalMinutes]); // Parent callback intentionally excluded, matching existing behavior.
  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setBusy([]);
    fetch(`/api/resources/${encodeURIComponent(resourceId)}/schedule?date=${encodeURIComponent(date)}`, {
      cache: "no-store", signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as ScheduleResponse;
        if (!response.ok) throw new Error(data.message ?? "Could not load daily availability");
        setBusy(Array.isArray(data.busy) ? data.busy : []);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load daily availability");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [resourceId, date, refresh, refreshKey]);
  function updateSelection(start: number | null, end: number | null) {
    setStartIndex(start);
    setEndIndex(end);
    if (start === null || end === null) {
      onSelectionChange("", "");
      return;
    }
    onSelectionChange(
      instant(date, OPEN_MINUTES + start * interval).toISOString(),
      instant(date, OPEN_MINUTES + end * interval).toISOString()
    );
  }
  function choose(i: number) {
    if (disabled || loading || error || slots[i]?.booked || slots[i]?.past) return;
    if (startIndex !== null && endIndex === i) {
      updateSelection(startIndex, i + 1);
    } else {
      updateSelection(i, i + 1);
    }
  }
  function extend() {
    if (startIndex === null || endIndex === null || endIndex >= total) return;
    if (slots[endIndex]?.booked || slots[endIndex]?.past) return;
    updateSelection(startIndex, endIndex + 1);
  }
  const selectedMinutes = startIndex !== null && endIndex !== null ? (endIndex - startIndex) * interval : 0;
  const freeCount = slots.filter((slot) => !slot.booked && !slot.past).length;
  const canExtend = endIndex !== null && endIndex < total && !slots[endIndex]?.booked && !slots[endIndex]?.past;
  const mobileSlots = slots.filter((slot) => {
    const slotMinutes = OPEN_MINUTES + slot.index * interval;
    return mobilePeriod === "morning" ? slotMinutes < 12 * 60 : slotMinutes >= 12 * 60;
  });
  function renderSlot(slot: (typeof slots)[number], compact = false) {
    const active = startIndex !== null && endIndex !== null && slot.index >= startIndex && slot.index < endIndex;
    const unavailable = slot.booked || slot.past;
    return (
      <button
        key={slot.index}
        type="button"
        disabled={disabled || loading || Boolean(error) || unavailable}
        onClick={() => choose(slot.index)}
        aria-pressed={active}
        aria-label={`${slot.label}, ${slot.booked ? "Reserved" : slot.past ? "Past" : active ? "Selected" : "Available"}`}
        className={`rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed ${
          compact ? "min-h-12 px-2 py-2 text-center" : "min-h-20 p-3"
        } ${
          slot.booked
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : slot.past
              ? "border-slate-200 bg-slate-100 text-slate-400"
              : active
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-800 hover:border-indigo-400 hover:bg-indigo-50"
        }`}
      >
        <span className={`block font-semibold ${compact ? "text-xs" : "text-sm"}`}>{slot.label}</span>
        {!compact && (
          <span className={`mt-2 block text-xs ${active ? "text-indigo-100" : slot.booked ? "text-rose-600" : slot.past ? "text-slate-400" : "text-emerald-700"}`}>
            {slot.booked ? "● Reserved" : slot.past ? "— Past" : active ? "✓ Selected" : "○ Available"}
          </span>
        )}
        {compact && (slot.booked || active) && (
          <span className="mt-1 block text-[10px]">{slot.booked ? "Reserved" : "Selected"}</span>
        )}
      </button>
    );
  }
  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Step 2 · Choose your time</p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">Daily availability</h3>
          <p className="mt-1 text-xs text-slate-500">8:00 AM – 6:00 PM · {interval}-minute slots · Sri Lanka time</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">{loading ? "Loading..." : `${freeCount} free slots`}</span>
      </div>
      <div className="relative max-w-sm" ref={calendarRef}>
        <label id="booking-date-label" className="mb-2 block text-sm font-semibold text-slate-700">Booking date</label>
        <button
          type="button"
          aria-labelledby="booking-date-label"
          aria-expanded={calendarOpen}
          aria-haspopup="dialog"
          disabled={disabled}
          onClick={() => {
            if (!calendarOpen) {
              const base = parseCalendarDate(date || colomboToday());
              setVisibleMonth(new Date(base.getFullYear(), base.getMonth(), 1));
            }
            setCalendarOpen((open) => !open);
          }}
          className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3.5 text-left shadow-sm transition focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 ${calendarOpen ? "border-indigo-500 ring-4 ring-indigo-50" : "border-slate-200 hover:border-indigo-300"}`}
        >
          <span className={`text-sm font-medium ${date ? "text-slate-900" : "text-slate-400"}`}>{selectedDateLabel}</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><CalendarDays size={18} /></span>
        </button>
        {calendarOpen && !disabled && (
          <div role="dialog" aria-label="Choose booking date" className="absolute left-0 top-full z-50 mt-2 w-full min-w-[290px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-900">{monthTitle}</h4>
              <div className="flex items-center gap-1">
                <button type="button" aria-label="Previous month" disabled={previousMonthDisabled} onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft size={18} /></button>
                <button type="button" aria-label="Next month" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"><ChevronRight size={18} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((weekday) => <div key={weekday} className="flex h-8 items-center justify-center text-[11px] font-semibold text-slate-400">{weekday}</div>)}
              {calendarDays.map((value, index) => value ? (
                <button
                  key={value}
                  type="button"
                  disabled={value < today}
                  aria-label={new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(parseCalendarDate(value))}
                  aria-pressed={date === value}
                  onClick={() => selectDate(value)}
                  className={`relative flex aspect-square min-h-9 items-center justify-center rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400 ${date === value ? "bg-indigo-600 font-bold text-white shadow-sm shadow-indigo-200" : value < today ? "cursor-not-allowed text-slate-300" : value === today ? "bg-indigo-50 font-bold text-indigo-700 hover:bg-indigo-100" : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"}`}
                >
                  {Number(value.slice(-2))}
                  {value === today && date !== value && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-indigo-600" />}
                </button>
              ) : <div key={`empty-${index}`} />)}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><Clock3 size={13} /> Sri Lanka time</span>
              <button type="button" onClick={chooseToday} className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100">Today</button>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-300" />Available</span>
        <span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-rose-100 ring-1 ring-rose-300" />Reserved</span>
        <span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-indigo-600" />Selected</span>
        <span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-slate-200" />Past</span>
      </div>
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-bold text-slate-900">Your selected time</h4>
          {selectedMinutes > 0 && <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">{selectedMinutes} minutes</span>}
        </div>
        {startIndex !== null && endIndex !== null ? (
          <>
            <p className="mt-3 rounded-xl border border-indigo-100 bg-white p-4 text-lg font-bold text-indigo-700">
              {timeText(OPEN_MINUTES + startIndex * interval)} <span className="text-slate-400">→</span> {timeText(OPEN_MINUTES + endIndex * interval)}
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button type="button" disabled={disabled || !canExtend} onClick={extend} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 sm:w-auto">+ Add {interval} minutes</button>
              <button type="button" disabled={disabled} onClick={() => updateSelection(null, null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 sm:w-auto">Clear selection</button>
            </div>
          </>
        ) : <p className="mt-3 text-sm text-slate-500">Choose an available time slot below to start your reservation.</p>}
      </div>
      {error && <div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error} <button type="button" className="ml-2 font-semibold underline" onClick={() => setRefresh((v) => v + 1)}>Retry</button></div>}
      {!date ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Choose a date to load the real reservation schedule.</div>
      ) : loading ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Loading reserved time slots...</div>
      ) : !error && (
        <>
          {/* Mobile: show one half-day at a time to reduce scrolling. */}
          <div className="space-y-3 md:hidden">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1" role="group" aria-label="Time of day">
              {(["morning", "afternoon"] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  aria-pressed={mobilePeriod === period}
                  onClick={() => setMobilePeriod(period)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${mobilePeriod === period ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"}`}
                >
                  {period === "morning" ? "Morning" : "Afternoon"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {mobileSlots.map((slot) => renderSlot(slot, true))}
            </div>
            <p className="text-xs text-slate-500">Pink slots are reserved. Grey slots are in the past. Your selection stays saved when switching periods.</p>
          </div>
          {/* Desktop: retain the full availability grid. */}
          <div className="hidden grid-cols-4 gap-2 md:grid lg:grid-cols-5">
            {slots.map((slot) => renderSlot(slot))}
          </div>
        </>
      )}
      <p className="text-xs text-slate-500">Availability may change before confirmation. The server checks for overlapping bookings when you confirm. Times shown are in Sri Lanka time (8 AM–6 PM).</p>
    </section>
  );
}
