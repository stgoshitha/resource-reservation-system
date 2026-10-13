
"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { DayPicker } from "react-day-picker";
import { format, isValid, parse } from "date-fns";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  X,
} from "lucide-react";
import "react-day-picker/style.css";

import type { FormInputProps } from "./FormInput";

export type FormDateTimeProps = Omit<
  FormInputProps,
  "type" | "onChange"
> & {
  mode?: "date" | "time" | "datetime-local";
  intervalMinutes?: number;
  minDateTime?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
};

type PickerMode = NonNullable<FormDateTimeProps["mode"]>;

function parseValue(value: string, mode: PickerMode) {
  if (!value) return undefined;

  const pattern =
    mode === "date"
      ? "yyyy-MM-dd"
      : mode === "time"
        ? "HH:mm"
        : "yyyy-MM-dd'T'HH:mm";

  const parsed = parse(value, pattern, new Date());

  return isValid(parsed) ? parsed : undefined;
}

function isValidInterval(interval?: number): boolean {
  return (
    interval !== undefined &&
    Number.isInteger(interval) &&
    interval > 0 &&
    interval <= 1440 &&
    1440 % interval === 0
  );
}

function toMinutes(value: string): number | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return null;
  }

  const [hour, minute] = value.split(":").map(Number);

  return hour * 60 + minute;
}

function formatTime(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return `${String(hour).padStart(2, "0")}:${String(
    minute
  ).padStart(2, "0")}`;
}

function formatDisplayTime(value: string) {
  const parsed = parseValue(value, "time");

  return parsed ? format(parsed, "hh:mm a") : value;
}

function generateTimeSlots(
  intervalMinutes?: number,
  minMinutes = 0
) {
  if (!isValidInterval(intervalMinutes)) return [];

  const slots: string[] = [];

  for (
    let minutes = 0;
    minutes < 1440;
    minutes += intervalMinutes!
  ) {
    if (minutes >= minMinutes) {
      slots.push(formatTime(minutes));
    }
  }

  return slots;
}

function getMinimumTime(
  selectedDate: Date | undefined,
  minDateTime: string | undefined,
  mode: PickerMode,
  intervalMinutes: number | undefined
): number {
  if (!minDateTime) return 0;

  const minimum = parseValue(
    minDateTime,
    mode === "time" ? "time" : "datetime-local"
  );

  if (!minimum) return 0;

  if (mode === "time") {
    return (
      minimum.getHours() * 60 +
      minimum.getMinutes() +
      (intervalMinutes ?? 0)
    );
  }

  if (!selectedDate) return 0;

  const selectedDay = format(selectedDate, "yyyy-MM-dd");
  const minimumDay = format(minimum, "yyyy-MM-dd");

  if (selectedDay !== minimumDay) return 0;

  return (
    minimum.getHours() * 60 +
    minimum.getMinutes() +
    (intervalMinutes ?? 0)
  );
}

const FormDateTime = forwardRef<
  HTMLInputElement,
  FormDateTimeProps
>(function FormDateTime(
  {
    mode = "datetime-local",
    intervalMinutes,
    minDateTime,
    value,
    defaultValue,
    onChange,
    id,
    name,
    disabled,
    required,
    error = false,
    className = "",
    placeholder,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const controlled = value !== undefined;

  const [internalValue, setInternalValue] = useState(
    String(defaultValue ?? "")
  );

  const currentValue = controlled
    ? String(value ?? "")
    : internalValue;

  const selected = parseValue(currentValue, mode);

  const [open, setOpen] = useState(false);
  const [showTimeOptions, setShowTimeOptions] =
    useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const [typedTime, setTypedTime] = useState(
    selected ? format(selected, "HH:mm") : ""
  );

  const validInterval =
    intervalMinutes === undefined ||
    isValidInterval(intervalMinutes);

  const effectiveInterval = isValidInterval(intervalMinutes)
    ? intervalMinutes
    : undefined;

  useEffect(() => {
    setTypedTime(
      selected ? format(selected, "HH:mm") : ""
    );
  }, [currentValue, mode]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setShowTimeOptions(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setShowTimeOptions(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [open]);

  function emit(nextValue: string) {
    if (!controlled) {
      setInternalValue(nextValue);
    }

    if (onChange) {
      const event = {
        target: {
          value: nextValue,
          name: name ?? "",
          id: inputId,
        },
        currentTarget: {
          value: nextValue,
          name: name ?? "",
          id: inputId,
        },
      } as ChangeEvent<HTMLInputElement>;

      onChange(event);
    }
  }

  const minimumDate = minDateTime
    ? parseValue(
        minDateTime,
        mode === "time" ? "time" : "datetime-local"
      )
    : undefined;

  const minimumMinutes = getMinimumTime(
    selected,
    minDateTime,
    mode,
    effectiveInterval
  );

  const timeOptions = useMemo(
    () =>
      generateTimeSlots(
        effectiveInterval,
        minimumMinutes
      ),
    [effectiveInterval, minimumMinutes]
  );

  const timeIsValid = useMemo(() => {
    const minutes = toMinutes(typedTime);

    if (minutes === null) return false;

    if (!validInterval) return false;

    if (
      effectiveInterval !== undefined &&
      minutes % effectiveInterval !== 0
    ) {
      return false;
    }

    if (minutes < minimumMinutes) return false;

    return true;
  }, [
    typedTime,
    effectiveInterval,
    minimumMinutes,
    validInterval,
  ]);

  function updateTime(nextTime: string) {
    setTypedTime(nextTime);

    const minutes = toMinutes(nextTime);

    if (minutes === null || !validInterval) return;

    if (
      effectiveInterval !== undefined &&
      minutes % effectiveInterval !== 0
    ) {
      return;
    }

    if (minutes < minimumMinutes) return;

    if (mode === "time") {
      emit(nextTime);
      return;
    }

    if (selected) {
      emit(
        `${format(selected, "yyyy-MM-dd")}T${nextTime}`
      );
    }
  }

  function selectDate(date: Date | undefined) {
    if (!date) return;

    if (minimumDate && mode !== "time") {
      const selectedDay = format(date, "yyyy-MM-dd");
      const minDay = format(minimumDate, "yyyy-MM-dd");

      if (selectedDay < minDay) return;
    }

    const datePart = format(date, "yyyy-MM-dd");

    if (mode === "date") {
      emit(datePart);
      setOpen(false);
      return;
    }

    const nextMinimum = getMinimumTime(
      date,
      minDateTime,
      mode,
      effectiveInterval
    );

    const existingMinutes = toMinutes(typedTime);

    const existingTimeValid =
      existingMinutes !== null &&
      existingMinutes >= nextMinimum &&
      (effectiveInterval === undefined ||
        existingMinutes % effectiveInterval === 0);

    const nextTime = existingTimeValid
      ? typedTime
      : generateTimeSlots(
          effectiveInterval,
          nextMinimum
        )[0] ?? "";

    setTypedTime(nextTime);

    if (nextTime) {
      emit(`${datePart}T${nextTime}`);
    } else {
      // No valid time is available on this date.
      emit("");
    }
  }

  function clearValue() {
    emit("");
    setTypedTime("");
    setShowTimeOptions(false);
  }

  const displayValue = selected
    ? mode === "date"
      ? format(selected, "dd MMM yyyy")
      : mode === "time"
        ? format(selected, "hh:mm a")
        : format(selected, "dd MMM yyyy, hh:mm a")
    : "";

  const showInvalidTime =
    typedTime.length > 0 && !timeIsValid;

  const timeSlots =
    effectiveInterval !== undefined
      ? timeOptions
      : Array.from(
          { length: 1440 },
          (_, i) => formatTime(i)
        ).filter(
          (time) =>
            (toMinutes(time) ?? -1) >= minimumMinutes
        );

  return (
    <div ref={containerRef} className="relative">
      <input
        {...props}
        ref={ref}
        name={name}
        value={currentValue}
        readOnly
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />

      <div className="relative">
        <button
          id={inputId}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-invalid={error || undefined}
          onClick={() => {
            setOpen((current) => !current);
            setShowTimeOptions(false);
          }}
          className={[
            "flex h-11 w-full items-center gap-3 rounded-xl border bg-white px-4",
            "text-left text-sm outline-none transition",
            "focus-visible:ring-2 focus-visible:ring-indigo-100",
            "disabled:cursor-not-allowed disabled:bg-slate-50",
            error
              ? "border-red-400"
              : "border-[#E2E8F0] focus-visible:border-[#4F46E5]",
            currentValue && !disabled ? "pr-11" : "",
            className,
          ].join(" ")}
        >
          {mode === "time" ? (
            <Clock3
              size={18}
              className="shrink-0 text-[#4F46E5]"
            />
          ) : (
            <CalendarDays
              size={18}
              className="shrink-0 text-[#4F46E5]"
            />
          )}

          <span
            className={`flex-1 ${
              displayValue
                ? "text-[#0F172A]"
                : "text-[#94A3B8]"
            }`}
          >
            {displayValue ||
              placeholder ||
              (mode === "time"
                ? "Select time"
                : mode === "date"
                  ? "Select date"
                  : "Select date and time")}
          </span>
        </button>

        {currentValue && !disabled && (
          <button
            type="button"
            aria-label="Clear selection"
            onClick={clearValue}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#94A3B8] hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Choose date and time"
          className="absolute left-0 top-full z-50 mt-2 w-max max-w-[calc(100vw-2rem)] rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xl shadow-slate-900/10"
        >
          {mode !== "time" && (
            <div className="reservehub-calendar">
              <DayPicker
                mode="single"
                selected={selected}
                onSelect={selectDate}
                showOutsideDays
                disabled={
                  minimumDate
                    ? { before: minimumDate }
                    : undefined
                }
                classNames={{
                  selected:
                    "bg-[#4F46E5] text-white rounded-lg",
                  today: "font-bold text-[#4F46E5]",
                }}
              />
            </div>
          )}

          {mode !== "date" && (
            <div
              className={
                mode === "time"
                  ? ""
                  : "mt-3 border-t border-[#E2E8F0] pt-4"
              }
            >
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#334155]">
                <Clock3
                  size={16}
                  className="text-[#4F46E5]"
                />
                Select or Type Time
              </div>

              <div className="relative">
                <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 focus-within:border-[#4F46E5] focus-within:ring-2 focus-within:ring-indigo-100">
                  <Clock3
                    size={17}
                    className="shrink-0 text-[#64748B]"
                  />

                  <input
                    type="text"
                    inputMode="numeric"
                    value={typedTime}
                    maxLength={5}
                    placeholder="HH:mm"
                    aria-label="Type time"
                    aria-invalid={showInvalidTime || undefined}
                    onChange={(event) =>
                      updateTime(event.target.value)
                    }
                    className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[#0F172A] outline-none"
                  />

                  <button
                    type="button"
                    aria-label="Show time options"
                    aria-expanded={showTimeOptions}
                    onClick={() =>
                      setShowTimeOptions(
                        (current) => !current
                      )
                    }
                    className="rounded-md p-1 text-[#64748B] hover:bg-[#EEF2FF] hover:text-[#4F46E5]"
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>

                {showTimeOptions && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[#E2E8F0] bg-white p-1 shadow-lg">
                    {timeSlots.length === 0 ? (
                      <p className="p-3 text-xs text-[#64748B]">
                        No valid time slots available.
                      </p>
                    ) : (
                      timeSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => {
                            updateTime(time);
                            setShowTimeOptions(false);
                          }}
                          className={[
                            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition",
                            typedTime === time
                              ? "bg-[#EEF2FF] font-semibold text-[#4338CA]"
                              : "text-[#334155] hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <span>
                            {formatDisplayTime(time)}
                          </span>

                          {typedTime === time && (
                            <Check size={16} />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {showInvalidTime && (
                <p
                  role="alert"
                  className="mt-2 text-xs text-red-600"
                >
                  {effectiveInterval !== undefined
                    ? `Enter a valid time aligned with the ${effectiveInterval}-minute interval and minimum time.`
                    : "Enter a valid time in HH:mm format."}
                </p>
              )}

              {effectiveInterval !== undefined && (
                <p className="mt-2 text-xs text-[#64748B]">
                  Booking interval: {effectiveInterval} minutes
                </p>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setShowTimeOptions(false);
              }}
              className="rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#4338CA]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default FormDateTime;
