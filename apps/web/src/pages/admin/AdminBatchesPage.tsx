import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Batch, ApiError } from "@/lib/api";

export function AdminBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .adminListBatches()
      .then((r) => setBatches(r.batches))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed"));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Batches</h1>
        <p className="text-sm text-ink-muted">
          All cohorts across courses. Manage teacher assignment from a course’s batch page.
        </p>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <div className="space-y-3">
        {batches.map((batch) => (
          <div
            key={batch.id}
            className="rounded-xl border border-border bg-surface-elevated p-4"
          >
            <p className="font-semibold">{batch.name}</p>
            <p className="text-sm text-ink-muted">
              {batch.course?.title ?? batch.courseId} · {batch.status} · teacher{" "}
              {batch.teacher?.fullName ?? "unassigned"}
            </p>
            {batch.course ? (
              <Link
                to={`/admin/courses/${batch.course.id}`}
                className="mt-2 inline-block text-sm text-accent hover:underline"
              >
                Manage
              </Link>
            ) : null}
          </div>
        ))}
        {batches.length === 0 && !error ? (
          <p className="text-ink-muted">No batches yet. Create them under a course.</p>
        ) : null}
      </div>
    </div>
  );
}
