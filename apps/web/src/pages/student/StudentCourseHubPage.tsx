import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { api, ApiError, type StudentEnrollment } from "@/lib/api";
import { AwaitingBatchNotice } from "./AwaitingBatchNotice";

export function StudentCourseHubPage() {
  const { slug } = useParams();
  const [enrollment, setEnrollment] = useState<StudentEnrollment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .studentCourseHub(slug)
      .then((r) => setEnrollment(r.enrollment))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <p className="text-ink-muted">Loading…</p>;
  }

  if (error || !enrollment) {
    return (
      <div className="rounded-xl border border-border bg-surface-elevated p-6">
        <p className="text-ink-muted">{error ?? "Course not found"}</p>
        <Link
          to="/student/courses"
          className="mt-3 inline-block text-sm text-accent hover:underline"
        >
          Back to My Courses
        </Link>
      </div>
    );
  }

  if (enrollment.accessBlocked) {
    return (
      <div className="rounded-xl border border-border bg-surface-elevated p-6">
        <h1 className="font-display text-xl font-semibold">{enrollment.course.title}</h1>
        <p className="mt-3 text-ink-muted">
          Access to this course is currently blocked. Please contact the academy office.
        </p>
        <Link
          to="/student/courses"
          className="mt-4 inline-block text-sm text-accent hover:underline"
        >
          Back to My Courses
        </Link>
      </div>
    );
  }

  if (enrollment.awaitingBatch) {
    return <AwaitingBatchNotice courseTitle={enrollment.course.title} />;
  }

  const base = `/student/courses/${enrollment.course.slug}`;
  const tabs = [
    { to: base, label: "Overview", end: true },
    { to: `${base}/sessions`, label: "Sessions" },
    { to: `${base}/materials`, label: "Materials" },
    { to: `${base}/announcements`, label: "Announcements" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ink-muted">
          <Link to="/student/courses" className="hover:underline">
            My Courses
          </Link>{" "}
          / {enrollment.course.title}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold">
          {enrollment.course.title}
        </h1>
        <p className="mt-1 text-ink-muted">
          Batch {enrollment.batch?.name}
          {enrollment.batch?.teacher
            ? ` · ${enrollment.batch.teacher.fullName}`
            : ""}
        </p>
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-border pb-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              [
                "rounded-lg px-3 py-2 text-sm font-medium",
                isActive
                  ? "bg-accent text-accent-fg"
                  : "text-ink-muted hover:bg-brand-gray hover:text-ink",
              ].join(" ")
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}

export function StudentCourseOverview() {
  const { slug } = useParams();
  const [enrollment, setEnrollment] = useState<StudentEnrollment | null>(null);

  useEffect(() => {
    if (!slug) return;
    api.studentCourseHub(slug).then((r) => setEnrollment(r.enrollment));
  }, [slug]);

  if (!enrollment) {
    return <p className="text-ink-muted">Loading…</p>;
  }

  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-6">
      <h2 className="font-display text-lg font-semibold">Batch overview</h2>
      {enrollment.batch?.scheduleSummary && (
        <p className="mt-2 text-ink-muted">{enrollment.batch.scheduleSummary}</p>
      )}
      <p className="mt-3 text-sm text-ink-muted line-clamp-4">
        {enrollment.course.overview}
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link
          to={`/student/courses/${enrollment.course.slug}/sessions`}
          className="font-medium text-accent hover:underline"
        >
          Live sessions
        </Link>
        <Link
          to={`/student/courses/${enrollment.course.slug}/materials`}
          className="font-medium text-accent hover:underline"
        >
          Materials
        </Link>
        <Link
          to={`/student/courses/${enrollment.course.slug}/announcements`}
          className="font-medium text-accent hover:underline"
        >
          Announcements
        </Link>
      </div>
    </div>
  );
}
