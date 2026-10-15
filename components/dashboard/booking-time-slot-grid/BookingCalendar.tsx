"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import type { RefObject, Dispatch, SetStateAction } from "react";
import { WEEKDAYS, colomboToday, parseCalendarDate } from "./booking-time-utils";
interface BookingCalendarProps {
  calendarRef: RefObject<HTMLDivElement | null>;
  calendarOpen: boolean;
  setCalendarOpen: Dispatch<SetStateAction<boolean>>;
  visibleMonth: Date;
  setVisibleMonth: Dispatch<SetStateAction<Date>>;
  date: string;
  disabled?: boolean;
  selectedDateLabel: string;
  monthTitle: string;
  previousMonthDisabled: boolean;
  calendarDays: (string | null)[];
  today: string;
  selectDate: (value: string) => void;
  chooseToday: () => void;
  inline?: boolean;
}
export default function BookingCalendar({ calendarRef, calendarOpen, setCalendarOpen, visibleMonth, setVisibleMonth, date, disabled, selectedDateLabel, monthTitle, previousMonthDisabled, calendarDays, today, selectDate, chooseToday, inline = false }: BookingCalendarProps) {
  return (
      <div className={inline ? "w-full" : "relative max-w-sm"} ref={calendarRef}>
        {!inline && (
          <>
        <label
          id="booking-date-label"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Reservation Date
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
          </>
        )}
        {(inline || (calendarOpen && !disabled)) && (
          <div
            role="dialog"
            aria-label="Choose booking date"
            className={inline ? "w-full" : "absolute left-0 top-full z-50 mt-2 w-full min-w-[290px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 sm:p-5"}
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
                  className="flex h-9 items-center justify-center text-xs font-semibold text-slate-500"
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
                    className={`relative flex aspect-square min-h-10 items-center justify-center rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
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
            <div className={inline ? "mt-4 flex items-center justify-between border-t border-slate-100 pt-3" : "mt-4 flex items-center justify-between border-t border-slate-100 pt-3"}>
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
  );
}
