import { Link } from "react-router-dom";

export function AwaitingBatchNotice({ courseTitle }: { courseTitle?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-6">
      <h2 className="font-display text-xl font-semibold">Awaiting batch assignment</h2>
      <p className="mt-2 text-ink-muted">
        {courseTitle
          ? `You are enrolled in ${courseTitle}, but an admin has not assigned your batch yet.`
          : "You are enrolled, but an admin has not assigned your batch yet."}{" "}
        Materials, announcements, and live sessions unlock after assignment.
      </p>
      <Link
        to="/student/courses"
        className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
      >
        Back to My Courses
      </Link>
    </div>
  );
}
