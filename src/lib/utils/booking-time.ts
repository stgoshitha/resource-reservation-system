export function isValidInterval(interval: number): boolean {
  return (
    Number.isInteger(interval) &&
    interval > 0 &&
    interval <= 1440 &&
    1440 % interval === 0
  );
}

export function timeToMinutes(time: string): number | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function isAlignedTime(
  time: string,
  interval: number
): boolean {
  const minutes = timeToMinutes(time);

  return (
    isValidInterval(interval) &&
    minutes !== null &&
    minutes % interval === 0
  );
}

export function generateStartTimes(interval: number): string[] {
  if (!isValidInterval(interval)) return [];

  const slots: string[] = [];

  for (let minutes = 0; minutes < 1440; minutes += interval) {
    slots.push(minutesToTime(minutes));
  }

  return slots;
}

export function generateEndTimes(
  startTime: string,
  interval: number
): string[] {
  if (!isAlignedTime(startTime, interval)) return [];

  const startMinutes = timeToMinutes(startTime)!;
  const slots: string[] = [];

  for (
    let minutes = startMinutes + interval;
    minutes < 1440;
    minutes += interval
  ) {
    slots.push(minutesToTime(minutes));
  }

  // 24:00 represents midnight at the beginning of the next day.
  // It is handled separately when constructing the end datetime.
  if ((1440 - startMinutes) % interval === 0) {
    slots.push("24:00");
  }

  return slots;
}

export function combineLocalDateTime(
  date: string,
  time: string
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const [year, month, day] = date.split("-").map(Number);

  const base = new Date(year, month - 1, day);

  if (
    base.getFullYear() !== year ||
    base.getMonth() !== month - 1 ||
    base.getDate() !== day
  ) {
    return null;
  }

  if (time === "24:00") {
    base.setDate(base.getDate() + 1);
    return base.toISOString();
  }

  const minutes = timeToMinutes(time);
  if (minutes === null) return null;

  base.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);

  return base.toISOString();
}

export function getDurationMinutes(
  startTime: string,
  endTime: string
): number | null {
  const start = timeToMinutes(startTime);
  const end = endTime === "24:00" ? 1440 : timeToMinutes(endTime);

  if (start === null || end === null || end <= start) {
    return null;
  }

  return end - start;
}
