// Published-hours evaluation (FC-05, T05).
// "Open according to published hours" is never "has space available".
// When reliable hours are missing the answer is "unknown" → "Call to confirm".

import type { Schedule } from "./types.js";

export type HoursStatus =
  | { state: "open"; closesAt: string; exceptionLabel?: string }
  | { state: "closed"; exceptionLabel?: string }
  | { state: "unknown" };

interface LocalNow {
  date: string; // YYYY-MM-DD
  day: number; // 0-6
  minutes: number; // minutes since local midnight
}

export function localNow(now: Date, timeZone: string): LocalNow {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    day: days.indexOf(get("weekday")),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

function previousDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Periods for one local calendar date, honoring exceptions. */
function periodsFor(schedule: Schedule, date: string, day: number) {
  const ex = schedule.exceptions.find((e) => e.date === date);
  if (ex) {
    if (ex.closed || !ex.hours) return { periods: [], label: ex.label ?? undefined };
    return { periods: [ex.hours], label: ex.label ?? undefined };
  }
  return { periods: schedule.regular.filter((r) => r.day === day), label: undefined };
}

export function hoursStatus(schedule: Schedule | null, now: Date = new Date()): HoursStatus {
  if (!schedule || schedule.regular.length === 0) return { state: "unknown" };
  const t = localNow(now, schedule.time_zone);

  // Today's periods that have started.
  const today = periodsFor(schedule, t.date, t.day);
  for (const p of today.periods) {
    const o = toMin(p.opens);
    const c = toMin(p.closes);
    const overnight = c <= o;
    if (t.minutes >= o && (overnight || t.minutes < c)) {
      return { state: "open", closesAt: p.closes, exceptionLabel: today.label };
    }
  }
  // Yesterday's overnight periods still running after midnight.
  const yDate = previousDate(t.date);
  const yesterday = periodsFor(schedule, yDate, (t.day + 6) % 7);
  for (const p of yesterday.periods) {
    const o = toMin(p.opens);
    const c = toMin(p.closes);
    if (c <= o && t.minutes < c) {
      return { state: "open", closesAt: p.closes, exceptionLabel: yesterday.label };
    }
  }
  return { state: "closed", exceptionLabel: today.label };
}

/** Format "18:30" as "6:30 PM" / "18:30" depending on locale. */
export function formatTime(hhmm: string, locale: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(Date.UTC(2000, 0, 1, h ?? 0, m ?? 0));
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(d);
}
