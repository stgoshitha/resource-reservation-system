"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Info,
} from "lucide-react";

import {
  combineLocalDateTime,
  generateEndTimes,
  generateStartTimes,
  getDurationMinutes,
  isAlignedTime,
  isValidInterval,
} from "@/src/lib/utils/booking-time";

interface ReservationTimeSelectorProps {
  intervalMinutes: number | null;
  date: string;
  startTime: string;
  endTime: string;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  disabled?: boolean;
}

export default function ReservationTimeSelector({
  intervalMinutes,
  date,
  startTime,
  endTime,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  disabled = false,
}: ReservationTimeSelectorProps) {
  const [manualMode, setManualMode] = useState(false);

  const validInterval =
    intervalMinutes !== null &&
    isValidInterval(intervalMinutes);

  const startOptions = useMemo(
    () =>
      validInterval
        ? generateStartTimes(intervalMinutes!)
        : [],
    [intervalMinutes, validInterval]
  );

  const startValid =
    validInterval &&
    isAlignedTime(startTime, intervalMinutes!);

  const endOptions = useMemo(
    () =>
      startValid
        ? generateEndTimes(startTime, intervalMinutes!)
        : [],
    [startTime, intervalMinutes, startValid]
  );

  const endValid = endOptions.includes(endTime);

  const duration =
    startValid && endValid
      ? getDurationMinutes(startTime, endTime)
      : null;

  const startISO =
    date && startValid
      ? combineLocalDateTime(date, startTime)
      : null;

  const endISO =
    date && endValid
      ? combineLocalDateTime(date, endTime)
      : null;

  const isPast =
    startISO !== null &&
    new Date(startISO).getTime() <= Date.now();

  const ready =
    Boolean(startISO && endISO) &&
    !isPast &&
    duration !== null;

  function changeStartTime(value: string) {
    onStartTimeChange(value);
    onEndTimeChange("");
  }

  function changeDate(value: string) {
    onDateChange(value);
    onEndTimeChange("");
  }

  return (
    <section className="space-y-5 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
          <CalendarDays size={21} />
        </div>

        <div>
          <h2 className="text-base font-bold text-[#0F172A]">
            Reservation Schedule
          </h2>

          <p className="mt-1 text-sm text-[#64748B]">
            Choose a date, start time and end time.
          </p>
        </div>
      </div>

      {validInterval ? (
        <div className="flex items-center gap-2 rounded-xl bg-[#EEF2FF] px-4 py-3 text-sm text-[#4338CA]">
          <Clock3 size={17} />
          <span>
            Booking interval:
            <strong className="ml-1">
              {intervalMinutes} minutes
            </strong>
          </span>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Select a resource with a valid booking interval.
        </div>
      )}

      <div>
        <label
          htmlFor="reservationDate"
          className="mb-2 block text-sm font-medium text-[#334155]"
        >
          Reservation Date
        </label>

        <input
          id="reservationDate"
          type="date"
          value={date}
          disabled={disabled || !validInterval}
          onChange={(event) =>
            changeDate(event.target.value)
          }
          className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm text-[#0F172A] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
        />
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="reservationStartTime"
            className="text-sm font-medium text-[#334155]"
          >
            Start Time
          </label>

          <button
            type="button"
            disabled={disabled || !validInterval}
            onClick={() => {
              setManualMode((current) => !current);
              changeStartTime("");
            }}
            className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] disabled:opacity-50"
          >
            {manualMode
              ? "Select from time slots"
              : "Type time manually"}
          </button>
        </div>

        {manualMode ? (
          <input
            id="reservationStartTime"
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="HH:mm (e.g. 09:30)"
            value={startTime}
            disabled={disabled || !validInterval}
            onChange={(event) =>
              changeStartTime(event.target.value)
            }
            className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
          />
        ) : (
          <select
            id="reservationStartTime"
            value={startTime}
            disabled={disabled || !validInterval}
            onChange={(event) =>
              changeStartTime(event.target.value)
            }
            className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
          >
            <option value="">Select start time</option>

            {startOptions.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        )}

        {startTime && !startValid && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            Enter a valid time aligned with the{" "}
            {intervalMinutes}-minute interval.
          </p>
        )}

        {isPast && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            Start time must be in the future.
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="reservationEndTime"
          className="mb-2 block text-sm font-medium text-[#334155]"
        >
          End Time
        </label>

        <select
          id="reservationEndTime"
          value={endValid ? endTime : ""}
          disabled={
            disabled ||
            !validInterval ||
            !startValid ||
            !date ||
            isPast
          }
          onChange={(event) =>
            onEndTimeChange(event.target.value)
          }
          className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
        >
          <option value="">Select end time</option>

          {endOptions.map((slot) => {
            const slotDuration = getDurationMinutes(
              startTime,
              slot
            );

            return (
              <option key={slot} value={slot}>
                {slot === "24:00" ? "12:00 AM (next day)" : slot}
                {" — "}
                {slotDuration} min
              </option>
            );
          })}
        </select>

        <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-[#64748B]">
          <Info size={14} className="mt-0.5 shrink-0" />
          End-time options are generated using the selected
          resource category's interval.
        </p>
      </div>

      {duration !== null && (
        <div className="rounded-xl border border-[#E0E7FF] bg-[#EEF2FF] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-[#475569]">
              Reservation Duration
            </span>

            <span className="text-sm font-bold text-[#4338CA]">
              {duration >= 60
                ? `${Math.floor(duration / 60)}h ${
                    duration % 60
                      ? `${duration % 60}m`
                      : ""
                  }`
                : `${duration} min`}
            </span>
          </div>
        </div>
      )}

      {ready && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0"
          />
          <span>
            Valid interval-based time selection. Availability
            must still be checked before booking.
          </span>
        </div>
      )}
    </section>
  );
}
