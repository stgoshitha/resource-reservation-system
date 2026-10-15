export type OperatingHoursMode = "STANDARD" | "WEEKLY" | "ALWAYS_OPEN";
export type WeeklySchedule = {
  dayOfWeek: number;
  isClosed: boolean;
  openingTime: string;
  closingTime: string;
};
export type Category = {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  description: string | null;
  bookingIntervalMinutes: number;
  openingTime: string;
  closingTime: string;
  operatingHoursMode: OperatingHoursMode;
  weeklySchedules: WeeklySchedule[];
  createdAt: string;
};
export type CategoryForm = {
  categoryCode: string;
  categoryName: string;
  description: string;
  bookingIntervalMinutes: string;
  openingTime: string;
  closingTime: string;
  operatingHoursMode: OperatingHoursMode;
  weeklySchedules: WeeklySchedule[];
};
export type CategoryListResponse = {
  message?: string;
  data?: Category[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
};
