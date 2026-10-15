import type { WeeklySchedule, CategoryForm } from "./category.types";

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
export function defaultSchedules(): WeeklySchedule[] {
  return DAYS.map((_, dayOfWeek) => ({
    dayOfWeek,
    isClosed: false,
    openingTime: "08:00",
    closingTime: "18:00",
  }));
}
export function emptyCategoryForm(): CategoryForm {
  return {
    categoryCode: "",
    categoryName: "",
    description: "",
    bookingIntervalMinutes: "15",
    openingTime: "08:00",
    closingTime: "18:00",
    operatingHoursMode: "STANDARD",
    weeklySchedules: defaultSchedules(),
  };
}
export async function readResponse(response: Response): Promise<Record<string, unknown>> {
  const body: unknown = await response.json().catch(() => ({}));
  return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
}
export function getErrorMessage(result: Record<string, unknown>, fallback: string): string {
  const errors = result.errors;
  if (errors && typeof errors === "object") {
    const first = Object.values(errors).flat().find((item) => typeof item === "string");
    if (typeof first === "string") return first;
  }
  return typeof result.message === "string" ? result.message : fallback;
}
export function validTimeRange(openingTime: string, closingTime: string): boolean {
  return (
    TIME_PATTERN.test(openingTime) &&
    TIME_PATTERN.test(closingTime) &&
    openingTime !== closingTime
  );
}
