import { useEffect, useState } from "react";
import { api, type GlobalNotice, ApiError } from "@/lib/api";

export function StudentNoticesPage() {
  const [notices, setNotices] = useState<GlobalNotice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .studentNotices()
      .then((r) => setNotices(r.notices))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed"));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold">Notices</h1>
      <p className="text-ink-muted">Academy-wide announcements.</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="space-y-3">
        {notices.map((n) => (
          <article
            key={n.id}
            className="rounded-xl border border-border bg-surface-elevated p-4"
          >
            <h2 className="font-display text-lg font-semibold">{n.title}</h2>
            {n.publishedAt ? (
              <p className="mt-1 text-xs text-ink-muted">
                {new Date(n.publishedAt).toLocaleString()}
              </p>
            ) : null}
            <p className="mt-3 whitespace-pre-wrap text-sm">{n.body}</p>
          </article>
        ))}
        {!error && notices.length === 0 ? (
          <p className="text-ink-muted">No notices right now.</p>
        ) : null}
      </div>
    </div>
  );
}
