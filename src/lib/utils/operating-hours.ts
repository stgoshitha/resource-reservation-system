import { timeToMinutes } from "./booking-time";

const OFFSET_MINUTES = 330;
const DAY_MS = 86_400_000;
const OFFSET_MS = OFFSET_MINUTES * 60_000;

type Schedule = {
  dayOfWeek: number;
  isClosed: boolean;
  openingTime: string;
  closingTime: string;
};

export type CategoryOperatingHours = {
  operatingHoursMode: "STANDARD" | "WEEKLY" | "ALWAYS_OPEN";
  openingTime: string;
  closingTime: string;
  weeklySchedules: Schedule[];
};

export type OperatingWindow = {
  startTime: string;
  endTime: string;
};

export function localDateForBooking(date: Date): string {
  return new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

export function localDayStart(date: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const start = new Date(`${date}T00:00:00+05:30`);
  if (!Number.isFinite(start.getTime()) || localDateForBooking(start) !== date) {
    return null;
  }
  return start;
}

function getWindowForDay(
  dayStart: Date,
  category: CategoryOperatingHours
): { start: number; end: number } | null {
  const mode = category.operatingHoursMode;
  if (mode === "ALWAYS_OPEN") {
    return { start: dayStart.getTime(), end: dayStart.getTime() + DAY_MS };
  }

  let opening = category.openingTime;
  let closing = category.closingTime;

  if (mode === "WEEKLY") {
    const dayOfWeek = new Date(dayStart.getTime() + OFFSET_MS).getUTCDay();
    const schedule = category.weeklySchedules.find((item) => item.dayOfWeek === dayOfWeek);
    if (!schedule || schedule.isClosed) return null;
    opening = schedule.openingTime;
    closing = schedule.closingTime;
  }

  const openMinutes = timeToMinutes(opening);
  const closeMinutes = timeToMinutes(closing);
  if (openMinutes === null || closeMinutes === null || openMinutes === closeMinutes) {
    return null;
  }

  const start = dayStart.getTime() + openMinutes * 60_000;
  const end =
    dayStart.getTime() +
    (closeMinutes <= openMinutes ? DAY_MS : 0) +
    closeMinutes * 60_000;
  return { start, end };
}

export function getOperatingWindowsForDate(
  date: string,
  category: CategoryOperatingHours
): OperatingWindow[] {
  const dayStart = localDayStart(date);
  if (!dayStart) return [];

  const dayEnd = dayStart.getTime() + DAY_MS;
  const windows = [dayStart.getTime() - DAY_MS, dayStart.getTime()]
    .map((time) => getWindowForDay(new Date(time), category))
    .filter((window): window is { start: number; end: number } => Boolean(window))
    .filter((window) => window.start < dayEnd && window.end > dayStart.getTime());

  return windows.map((window) => ({
    startTime: new Date(window.start).toISOString(),
    endTime: new Date(window.end).toISOString(),
  }));
}

export function isWithinOperatingHours(
  start: Date,
  end: Date,
  category: CategoryOperatingHours
): boolean {
  if (end.getTime() <= start.getTime()) return false;
  if (category.operatingHoursMode === "ALWAYS_OPEN") return true;

  const startDay = localDayStart(localDateForBooking(start));
  const endDay = localDayStart(localDateForBooking(end));
  if (!startDay || !endDay) return false;

  const windows: { start: number; end: number }[] = [];
  for (
    let day = startDay.getTime() - DAY_MS;
    day <= endDay.getTime();
    day += DAY_MS
  ) {
    const window = getWindowForDay(new Date(day), category);
    if (window) windows.push(window);
  }

  windows.sort((a, b) => a.start - b.start);
  let coveredUntil = start.getTime();
  for (const window of windows) {
    if (window.start > coveredUntil) break;
    if (window.end > coveredUntil) coveredUntil = window.end;
    if (coveredUntil >= end.getTime()) return true;
  }
  return false;
}
