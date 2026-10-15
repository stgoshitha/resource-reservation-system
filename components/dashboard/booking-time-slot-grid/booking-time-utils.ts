export type BusyRange = { startTime: string; endTime: string; status?: "RESERVED" | "HELD" };
export type OperatingWindow = { startTime: string; endTime: string };
export type ScheduleResponse = {
  date: string;
  busy: BusyRange[];
  operatingWindows: OperatingWindow[];
  operatingHoursMode: "STANDARD" | "WEEKLY" | "ALWAYS_OPEN";
  bookingIntervalMinutes: number;
  message?: string;
};
export type BookingTimeSlotGridProps = {
  resourceId: string;
  intervalMinutes: number;
  disabled?: boolean;
  refreshKey?: number;
  onSelectionChange: (startTime: string, endTime: string) => void;
};
const OFFSET = "+05:30";
export const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
export function colomboToday(): string {
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
export function parseCalendarDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day || 1);
}
export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
export function timeText(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour % 12 || 12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}
export function instant(date: string, minutes: number) {
  return new Date(
    new Date(`${date}T00:00:00${OFFSET}`).getTime() + minutes * 60_000,
  );
}

export type TimeSlot = {
  index: number;
  booked: boolean;
  reserved: boolean;
  held: boolean;
  past: boolean;
  closed: boolean;
  label: string;
};
