import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, ApiError, type StudentAnnouncement } from "@/lib/api";
import { AwaitingBatchNotice } from "./AwaitingBatchNotice";

export function StudentAnnouncementsPage() {
  const { slug } = useParams();
  const [announcements, setAnnouncements] = useState<StudentAnnouncement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [awaiting, setAwaiting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setAwaiting(false);
    api
      .studentCourseAnnouncements(slug)
      .then((r) => setAnnouncements(r.announcements))
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

  if (announcements.length === 0) {
    return <p className="text-ink-muted">No announcements yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {announcements.map((a) => (
        <li
          key={a.id}
          className="rounded-xl border border-border bg-surface-elevated p-5"
        >
          <p className="text-xs text-ink-muted">
            {new Date(a.createdAt).toLocaleString()}
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold">{a.title}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">{a.body}</p>
        </li>
      ))}
    </ul>
  );
}
