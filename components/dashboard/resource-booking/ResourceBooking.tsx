"use client";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import BookingTimeSlotGrid from "@/components/dashboard/BookingTimeSlotGrid";
import { FormField, FormInput, FormTextarea } from "@/components/ui/form";
import useResourceBooking from "./useResourceBooking";
import ResourceSelectionStep from "./ResourceSelectionStep";

export default function ResourceBooking() {
  const booking = useResourceBooking();
  const { success, hold, step, timerColor, holdSecondsLeft, countdown, holdProgress, progressColor, steps, saving, goBack, selected, scheduleRefresh, handleGridSelection, title, setTitle, resetAvailability, notes, setNotes, startTime, endTime, formatTime, submit, validSelection, validDetails, nextStep } = booking;
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {success && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Reservation created successfully. <Link href="/dashboard/reservations" className="font-semibold underline">View My Reservations</Link>
        </div>
      )}
      {hold && step >= 3 && (
        <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${timerColor}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2"><Clock3 size={17} /> {holdSecondsLeft <= 30 ? "Urgent: your hold is about to expire!" : holdSecondsLeft <= 120 ? "Please confirm soon — your hold is running out." : "Your selected slot is held for 5 minutes."}</span>
            <span className="font-mono text-lg font-bold tabular-nums">{countdown}</span>
          </div>
          <div role="progressbar" aria-label="Reservation hold time remaining" aria-valuemin={0} aria-valuemax={300} aria-valuenow={holdSecondsLeft} className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200/80">
            <div className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${progressColor}`} style={{ width: `${holdProgress}%` }} />
          </div>
          <p className="mt-1.5 text-right text-xs opacity-80">{Math.ceil(holdProgress)}% time remaining</p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reserve a Resource</h1>
            <p className="mt-1 text-sm text-slate-500">Reserve a resource in four simple steps.</p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
            Step {step} of 4
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Reservation progress"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={step}
          className="mb-6 flex gap-2"
        >
          {steps.map((label, index) => (
            <div
              key={label}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"
            >
              <div
                className={[
                  "h-full rounded-full bg-indigo-600",
                  "transition-all duration-500 ease-in-out",
                  index < step ? "w-full" : "w-0",
                ].join(" ")}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {steps.map((label, index) => {
            const number = index + 1;
            const completed = number < step;
            const active = number === step;

            return (
              <button
                key={label}
                type="button"
                disabled={number >= step || saving}
                onClick={() => {
                  void goBack(number);
                }}
                aria-current={active ? "step" : undefined}
                className={[
                  "group flex min-w-0 flex-col items-center gap-2.5",
                  "rounded-xl px-1 py-2 text-center",
                  "transition-colors duration-200",
                  "enabled:hover:bg-slate-50",
                  "enabled:cursor-pointer",
                  "disabled:cursor-default",
                  "focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-indigo-500",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center",
                    "rounded-full text-sm font-semibold",
                    "transition-all duration-300 ease-out",
                    "motion-safe:group-enabled:group-hover:scale-105",
                    "motion-reduce:transition-none",
                    completed
                      ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                      : active
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-4 ring-indigo-50"
                        : "bg-slate-100 text-slate-400 ring-1 ring-slate-200/70",
                  ].join(" ")}
                >
                  {completed ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                  ) : (
                    number
                  )}
                </span>

                <span
                  className={[
                    "max-w-full text-[11px] leading-snug sm:text-xs",
                    "transition-colors duration-200",
                    active
                      ? "font-semibold text-indigo-700"
                      : completed
                        ? "font-medium text-slate-700"
                        : "font-medium text-slate-400",
                  ].join(" ")}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {step === 1 && <ResourceSelectionStep booking={booking} />}
      {selected && (
        <section hidden={step !== 2} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div>
            <p className="text-lg font-semibold uppercase tracking-wider text-indigo-600">Step 2 · Select Date & Time</p>
            <p className="mt-1 text-sm text-slate-500">{selected.resourceName} · {selected.category.categoryName}</p>
          </div>
          <BookingTimeSlotGrid
            key={`${selected.resourceId}-${scheduleRefresh}`}
            resourceId={selected.resourceId}
            intervalMinutes={selected.category.bookingIntervalMinutes}
            refreshKey={scheduleRefresh}
            disabled={saving || Boolean(hold)}
            onSelectionChange={handleGridSelection}
          />
        </section>
      )}
      {step === 3 && selected && (
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div>
            <p className="text-lg font-semibold uppercase tracking-wider text-indigo-600">Step 3 · Reservation Details</p>
            <h2 className="mt-1 text-sm text-slate-500">Tell us about your reservation</h2>
            <p className="mt-1 text-sm text-slate-500">{selected.resourceName} · {formatTime(startTime)} – {formatTime(endTime)}</p>
          </div>
          <FormField id="reservation-title" label="Reservation title" required>
            <FormInput id="reservation-title" value={title} onChange={(event) => { setTitle(event.target.value); resetAvailability(); }} maxLength={150} placeholder="e.g. Team meeting" required disabled={saving} />
          </FormField>
          <FormField id="booking-notes" label="Notes (optional)">
            <FormTextarea id="booking-notes" value={notes} onChange={(event) => { setNotes(event.target.value); resetAvailability(); }} maxLength={1000} rows={4} placeholder="Additional information" disabled={saving} />
          </FormField>
        </section>
      )}
      {step === 4 && selected && (
        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div>
            <p className="text-lg font-semibold uppercase tracking-wider text-indigo-600">Step 4 · Review & Confirm reservation</p>
            <p className="mt-1 text-sm text-slate-500">Check your booking details before confirming.</p>
          </div>
          <dl className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
            {[
              ["Resource", selected.resourceName],
              ["Code", selected.resourceCode],
              ["Category", selected.category.categoryName],
              ["Start", formatTime(startTime)],
              ["End", formatTime(endTime)],
              ["Duration", `${Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)} minutes`],
              ["Title", title.trim()],
              ["Notes", notes.trim() || "None"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-wrap justify-between gap-2 py-3 px-1 text-sm">
                <dt className="text-slate-500">{label}</dt><dd className="font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={saving} disabled={saving || !hold || holdSecondsLeft <= 0}>Confirm Reservation</Button>
          </div>
          <p className="text-xs text-slate-500">The server verifies availability when you confirm and prevents overlapping bookings.</p>
        </form>
      )}
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" disabled={step === 1 || saving}
          onClick={() => { void goBack(); }}>← Back</Button>
        {step < 4 && (
          <Button type="button" disabled={saving || (step === 1 && !selected) || (step === 2 && !validSelection) || (step === 3 && !validDetails)} onClick={nextStep}>
            Continue →
          </Button>
        )}
      </div>
    </div>
  );
}
