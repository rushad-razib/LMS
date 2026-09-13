import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError, type TeacherBatch } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";

export function TeacherDashboardPage() {
  const [batches, setBatches] = useState<TeacherBatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .teacherBatches()
      .then((r) => setBatches(r.batches))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My batches"
        description="Cohorts assigned to you. Post sessions, materials, and announcements from each batch."
      />

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {loading ? (
        <p className="text-ink-muted">Loading…</p>
      ) : batches.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-elevated p-6">
          <p className="text-ink-muted">
            No batches assigned yet. An admin will assign you when a cohort is ready.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {batches.map((batch) => (
            <li
              key={batch.id}
              className="rounded-xl border border-border bg-surface-elevated p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                    {batch.course.title}
                  </p>
                  <h2 className="mt-1 font-display text-lg font-semibold">
                    {batch.name}
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    {batch.status}
                    {batch.scheduleSummary ? ` · ${batch.scheduleSummary}` : ""}
                  </p>
                  <p className="mt-2 text-sm text-ink-muted">
                    {batch.studentCount} students · {batch.sessionCount} sessions ·{" "}
                    {batch.materialCount} materials · {batch.announcementCount}{" "}
                    announcements
                  </p>
                </div>
                <Link
                  to={`/teacher/batches/${batch.id}`}
                  className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
                >
                  Open batch
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
