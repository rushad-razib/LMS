import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Course, ApiError } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useAuth } from "@/features/auth/AuthProvider";

export function CourseDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .getPublicCourse(slug)
      .then((r) => setCourse(r.course))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  async function onBuy() {
    if (!course) return;
    if (!user) {
      toast.message("Please log in or register before purchasing.");
      return;
    }
    if (user.role !== "STUDENT") {
      toast.message("Only student accounts can purchase courses.");
      return;
    }
    if (!user.canAccessStudentPortal) {
      toast.error("Verify your email before purchasing.");
      return;
    }

    setBuying(true);
    try {
      const result = await api.checkout(course.id);
      if (result.kind === "enrolled") {
        toast.success("Enrolled — awaiting batch assignment.");
        return;
      }
      if (result.gatewayUrl) {
        window.location.href = result.gatewayUrl;
        return;
      }
      toast.error("Payment gateway did not return a redirect URL.");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "ALREADY_ENROLLED") {
          toast.message("You are already enrolled in this course.");
        } else if (err.code === "EMAIL_NOT_VERIFIED") {
          toast.error("Verify your email before purchasing.");
        } else if (err.code === "PAYMENT_NOT_CONFIGURED") {
          toast.error("Online payments are not configured yet.");
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("Checkout failed");
      }
    } finally {
      setBuying(false);
    }
  }

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
      {course.coverImageUrl ? (
        <img
          src={course.coverImageUrl}
          alt=""
          className="mt-4 h-56 w-full rounded-xl object-cover"
        />
      ) : null}
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
          disabled={buying}
          className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-fg disabled:opacity-60"
          onClick={() => void onBuy()}
        >
          {buying
            ? "Please wait…"
            : course.priceBdt === 0
              ? "Enroll free"
              : "Buy / Enroll"}
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
        No batch selection at checkout — Admin assigns your batch after purchase.
      </p>
    </div>
  );
}
