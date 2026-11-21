import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SESSION_TYPE_LABELS, SessionType, WEEKDAY_LABELS, WEEKDAYS } from "@arva/shared";
import { api, ApiError, type TeacherScheduleSession } from "@/lib/api";
import { formatTime } from "@/lib/dates";
import { PageHeader } from "@/components/PageHeader";

function monthKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function monthParts(key: string) {
  const [yearText, monthText] = key.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!yearText || !monthText || Number.isNaN(year) || Number.isNaN(month)) return null;
  return { year, monthIndex: month - 1 };
}

function shiftMonth(key: string, delta: number) {
  const parts = monthParts(key);
  if (!parts) return key;
  return monthKey(new Date(parts.year, parts.monthIndex + delta, 1));
}

function monthTitle(key: string) {
  const parts = monthParts(key);
  if (!parts) return key;
  return new Date(parts.year, parts.monthIndex, 1).toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function dayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function typeLabel(sessionType: number) {
  return sessionType === SessionType.Online
    ? SESSION_TYPE_LABELS[SessionType.Online]
    : SESSION_TYPE_LABELS[SessionType.Offline];
}

export function TeacherSchedulePage() {
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [sessions, setSessions] = useState<TeacherScheduleSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .teacherSchedule(month)
      .then((res) => setSessions(res.sessions))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load schedule"),
      )
      .finally(() => setLoading(false));
  }, [month]);

  const byDay = useMemo(() => {
    const grouped = new Map<string, TeacherScheduleSession[]>();
    for (const session of sessions) {
      const key = dayKey(new Date(session.startsAt));
      const list = grouped.get(key) ?? [];
      list.push(session);
      grouped.set(key, list);
    }
    return grouped;
  }, [sessions]);

  const cells = useMemo(() => {
    const parts = monthParts(month) ?? { year: new Date().getFullYear(), monthIndex: new Date().getMonth() };
    const { year, monthIndex } = parts;
    const first = new Date(year, monthIndex, 1);
    const leading = (first.getDay() + 6) % 7;
    const days = new Date(year, monthIndex + 1, 0).getDate();
    const slots: Array<number | null> = [
      ...Array.from({ length: leading }, () => null),
      ...Array.from({ length: days }, (_, index) => index + 1),
    ];
    while (slots.length % WEEKDAYS.length !== 0) slots.push(null);
    return { year, monthIndex, slots };
  }, [month]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        description="Classes across every batch assigned to you."
      />
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:border-accent"
          onClick={() => setMonth((current) => shiftMonth(current, -1))}
        >
          Previous
        </button>
        <h2 className="font-display text-lg font-semibold">{monthTitle(month)}</h2>
        <button
          type="button"
          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:border-accent"
          onClick={() => setMonth((current) => shiftMonth(current, 1))}
        >
          Next
        </button>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {loading ? <p className="text-ink-muted">Loading…</p> : null}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border text-sm">
        {WEEKDAYS.map((day) => (
          <div key={day} className="bg-surface px-2 py-2 text-xs font-medium text-ink-muted">
            {WEEKDAY_LABELS[day].slice(0, 3)}
          </div>
        ))}
        {cells.slots.map((day, index) => {
          const key =
            day === null
              ? `empty-${index}`
              : dayKey(new Date(cells.year, cells.monthIndex, day));
          const items = day === null ? [] : (byDay.get(key) ?? []);
          return (
            <div key={key} className="min-h-24 bg-surface p-2">
              {day !== null ? <p className="text-xs text-ink-muted">{day}</p> : null}
              <ul className="mt-1 space-y-1">
                {items.map((session) => (
                  <li key={session.id}>
                    <Link
                      to={`/teacher/batches/${session.batch.id}/sessions`}
                      className="block rounded-md bg-surface-elevated px-1.5 py-1 text-xs hover:text-accent"
                    >
                      <span className="font-medium">{formatTime(session.startsAt)}</span>{" "}
                      {session.title}
                      <span className="block text-ink-muted">
                        {session.batch.name} · {typeLabel(session.sessionType)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
