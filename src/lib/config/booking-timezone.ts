export const BOOKING_TIMEZONE = {
  name: "Asia/Colombo",
  offsetMinutes: 330, // UTC +05:30
} as const;

export function isBookingTimeAligned(
  date: Date,
  intervalMinutes: number
): boolean {
  if (
    !Number.isFinite(date.getTime()) ||
    !Number.isInteger(intervalMinutes) ||
    intervalMinutes <= 0
  ) {
    return false;
  }

  const intervalMs = intervalMinutes * 60_000;
  const offsetMs = BOOKING_TIMEZONE.offsetMinutes * 60_000;

  return (date.getTime() + offsetMs) % intervalMs === 0;
}