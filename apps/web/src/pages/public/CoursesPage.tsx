import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { api, type Course, ApiError } from "@/lib/api";

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listPublicCourses()
      .then((r) => setCourses(r.courses))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Seo
        title="Courses"
        description="Browse practical programs from AR Visionary Academy — buy online, then get assigned to a live batch."
        path="/courses"
      />
      <h1 className="font-display text-3xl font-bold">Courses</h1>
      <p className="mt-2 text-ink-muted">
        Practical programs from AR Visionary Academy. Buy a course, then Admin assigns your
        live batch.
      </p>

      {loading ? <p className="mt-8 text-ink-muted">Loading courses…</p> : null}
      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Link
            key={course.id}
            to={`/courses/${course.slug}`}
            className="overflow-hidden rounded-xl border border-border bg-surface-elevated transition hover:border-accent"
          >
            {course.coverImageUrl ? (
              <img
                src={course.coverImageUrl}
                alt=""
                className="h-40 w-full object-cover"
              />
            ) : null}
            <div className="p-5">
              <h2 className="font-display text-lg font-semibold text-ink">{course.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{course.overview}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-ink-muted">{course.duration}</span>
                <span className="font-semibold text-accent">
                  ৳{course.priceBdt.toLocaleString("en-BD")}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {!loading && !error && courses.length === 0 ? (
        <p className="mt-8 text-ink-muted">No published courses yet.</p>
      ) : null}
    </div>
  );
}
