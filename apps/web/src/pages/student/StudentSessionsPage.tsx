import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, ApiError, type StudentLiveSession } from "@/lib/api";
import { AwaitingBatchNotice } from "./AwaitingBatchNotice";

export function StudentSessionsPage() {
  const { slug } = useParams();
  const [sessions, setSessions] = useState<StudentLiveSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [awaiting, setAwaiting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setAwaiting(false);
    api
      .studentCourseSessions(slug)
      .then((r) => setSessions(r.sessions))
      .catch((err) => {
        if (err instanceof ApiError && err.code === "AWAITING_BATCH") {
          setAwaiting(true);
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load");
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (awaiting) return <AwaitingBatchNotice />;
  if (loading) return <p className="text-ink-muted">Loading…</p>;
  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (sessions.length === 0) {
    return (
      <p className="text-ink-muted">No live sessions scheduled yet.</p>
    );
  }

  const now = Date.now();

  return (
    <ul className="space-y-3">
      {sessions.map((s) => {
        const start = new Date(s.startsAt);
        const past = start.getTime() < now;
        return (
          <li
            key={s.id}
            className="rounded-xl border border-border bg-surface-elevated p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                  {past ? "Past" : "Upcoming"}
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold">{s.title}</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {start.toLocaleString()}
                  {s.endsAt
                    ? ` – ${new Date(s.endsAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : ""}
                </p>
                {s.notes && <p className="mt-2 text-sm text-ink-muted">{s.notes}</p>}
              </div>
              <a
                href={s.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
              >
                Join link
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
