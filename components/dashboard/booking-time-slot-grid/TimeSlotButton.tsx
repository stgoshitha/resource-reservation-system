"use client";
import type { TimeSlot } from "./booking-time-utils";
interface TimeSlotButtonProps {
  slot: TimeSlot;
  compact?: boolean;
  active: boolean;
  disabled?: boolean;
  loading: boolean;
  error: string;
  onChoose: (index: number) => void;
}
export default function TimeSlotButton({ slot, compact = false, active, disabled, loading, error, onChoose }: TimeSlotButtonProps) {
    const unavailable = slot.booked || slot.past || slot.closed;
    return (
      <button
        type="button"
        disabled={disabled || loading || Boolean(error) || unavailable}
        onClick={() => onChoose(slot.index)}
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
