import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError, type StudentEnrollment } from "@/lib/api";

export function StudentDashboardPage() {
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .myEnrollments()
      .then((r) => setEnrollments(r.enrollments))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, []);

  const awaiting = enrollments.filter((e) => e.awaitingBatch).length;
  const active = enrollments.length - awaiting;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-ink-muted">
          Your enrollments and batch access at a glance.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-ink-muted">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Courses" value={enrollments.length} />
            <Stat label="Awaiting batch" value={awaiting} />
            <Stat label="Batch assigned" value={active} />
          </div>

          <div className="rounded-xl border border-border bg-surface-elevated p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">Recent courses</h2>
              <Link
                to="/student/courses"
                className="text-sm font-medium text-accent hover:underline"
              >
                View all
              </Link>
            </div>
            {enrollments.length === 0 ? (
              <p className="mt-3 text-ink-muted">
                No enrollments yet.{" "}
                <Link to="/courses" className="text-accent hover:underline">
                  Browse courses
                </Link>
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {enrollments.slice(0, 5).map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">{e.course.title}</p>
                      <p className="text-sm text-ink-muted">
                        {e.awaitingBatch
                          ? "Awaiting batch"
                          : e.batch?.name ?? "Batch assigned"}
                      </p>
                    </div>
                    <Link
                      to={`/student/courses/${e.course.slug}`}
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}
