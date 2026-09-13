import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { api, ApiError, type TeacherBatchHub } from "@/lib/api";

export function TeacherBatchHubPage() {
  const { id } = useParams();
  const [batch, setBatch] = useState<TeacherBatchHub | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .teacherBatchHub(id)
      .then((r) => setBatch(r.batch))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-ink-muted">Loading…</p>;

  if (error || !batch) {
    return (
      <div className="rounded-xl border border-border bg-surface-elevated p-6">
        <p className="text-ink-muted">{error ?? "Batch not found"}</p>
        <Link
          to="/teacher"
          className="mt-3 inline-block text-sm text-accent hover:underline"
        >
          Back to my batches
        </Link>
      </div>
    );
  }

  const base = `/teacher/batches/${batch.id}`;
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
          <Link to="/teacher" className="hover:underline">
            My batches
          </Link>{" "}
          / {batch.course.title}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold">{batch.name}</h1>
        <p className="mt-1 text-ink-muted">
          {batch.status}
          {batch.scheduleSummary ? ` · ${batch.scheduleSummary}` : ""}
          {` · ${batch.studentCount} students`}
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
                  : "text-ink-muted hover:bg-surface hover:text-ink",
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

export function TeacherBatchOverview() {
  const { id } = useParams();
  const [batch, setBatch] = useState<TeacherBatchHub | null>(null);

  useEffect(() => {
    if (!id) return;
    api.teacherBatchHub(id).then((r) => setBatch(r.batch));
  }, [id]);

  if (!batch) return <p className="text-ink-muted">Loading…</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-surface-elevated p-6">
        <h2 className="font-display text-lg font-semibold">Next session</h2>
        {batch.upcomingSession ? (
          <>
            <p className="mt-2 font-medium">{batch.upcomingSession.title}</p>
            <p className="mt-1 text-sm text-ink-muted">
              {new Date(batch.upcomingSession.startsAt).toLocaleString()}
            </p>
            <Link
              to={`/teacher/batches/${batch.id}/sessions`}
              className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
            >
              Manage sessions
            </Link>
          </>
        ) : (
          <p className="mt-2 text-ink-muted">No upcoming sessions scheduled.</p>
        )}
      </div>
      <div className="rounded-xl border border-border bg-surface-elevated p-6">
        <h2 className="font-display text-lg font-semibold">Latest announcement</h2>
        {batch.latestAnnouncement ? (
          <>
            <p className="mt-2 font-medium">{batch.latestAnnouncement.title}</p>
            <p className="mt-1 line-clamp-3 text-sm text-ink-muted">
              {batch.latestAnnouncement.body}
            </p>
            <Link
              to={`/teacher/batches/${batch.id}/announcements`}
              className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
            >
              Manage announcements
            </Link>
          </>
        ) : (
          <p className="mt-2 text-ink-muted">No announcements yet.</p>
        )}
      </div>
    </div>
  );
}
