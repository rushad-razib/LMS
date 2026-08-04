import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Course, ApiError } from "@/lib/api";
import { useAuth } from "@/features/auth/AuthProvider";

export function CourseDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .getPublicCourse(slug)
      .then((r) => setCourse(r.course))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-12 text-ink-muted">Loading…</div>;
  }

  if (error || !course) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-red-600">{error ?? "Course not found"}</p>
        <Link to="/courses" className="mt-4 inline-block text-accent hover:underline">
          Back to courses
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link to="/courses" className="text-sm text-accent hover:underline">
        ← Courses
      </Link>
      <h1 className="mt-4 font-display text-4xl font-bold">{course.title}</h1>
      <p className="mt-2 text-ink-muted">
        {course.duration} · ৳{course.priceBdt.toLocaleString("en-BD")}
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-xl font-semibold">Overview</h2>
        <p className="whitespace-pre-wrap text-ink-muted">{course.overview}</p>
      </section>

      {course.outlineText ? (
        <section className="mt-8 space-y-3">
          <h2 className="font-display text-xl font-semibold">Syllabus / outline</h2>
          <pre className="whitespace-pre-wrap rounded-xl border border-border bg-surface-elevated p-4 font-sans text-sm text-ink-muted">
            {course.outlineText}
          </pre>
        </section>
      ) : null}

      {course.faqText ? (
        <section className="mt-8 space-y-3">
          <h2 className="font-display text-xl font-semibold">FAQ</h2>
          <pre className="whitespace-pre-wrap rounded-xl border border-border bg-surface-elevated p-4 font-sans text-sm text-ink-muted">
            {course.faqText}
          </pre>
        </section>
      ) : null}

      <div className="mt-10 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-fg"
          onClick={() => {
            alert(
              "Checkout with SSLCommerz arrives in Phase 3. You can register/login now; purchase comes next.",
            );
          }}
        >
          Buy / Enroll
        </button>
        {!user ? (
          <Link
            to="/register"
            className="rounded-lg border border-border bg-surface-elevated px-5 py-3 text-sm font-semibold"
          >
            Register first
          </Link>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-ink-muted">
        No batch selection at checkout — Admin assigns your batch after purchase (Phase 3).
      </p>
    </div>
  );
}
