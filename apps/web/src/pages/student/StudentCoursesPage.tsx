import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError, type StudentEnrollment } from "@/lib/api";

export function StudentCoursesPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">My Courses</h1>
        <p className="mt-1 text-ink-muted">
          Enrolled courses. Cohort content unlocks after batch assignment.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-ink-muted">Loading…</p>
      ) : enrollments.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-elevated p-6">
          <p className="text-ink-muted">
            You are not enrolled in any courses yet.{" "}
            <Link to="/courses" className="text-accent hover:underline">
              Browse the catalog
            </Link>
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {enrollments.map((e) => (
            <li
              key={e.id}
              className="rounded-xl border border-border bg-surface-elevated p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">
                    {e.course.title}
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    {e.course.duration} · ৳{e.course.priceBdt.toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm">
                    {e.awaitingBatch ? (
                      <span className="text-amber-700">Awaiting batch assignment</span>
                    ) : (
                      <span className="text-ink-muted">
                        Batch: {e.batch?.name}
                        {e.batch?.teacher
                          ? ` · Teacher: ${e.batch.teacher.fullName}`
                          : ""}
                      </span>
                    )}
                  </p>
                </div>
                <Link
                  to={`/student/courses/${e.course.slug}`}
                  className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
                >
                  Open course
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
