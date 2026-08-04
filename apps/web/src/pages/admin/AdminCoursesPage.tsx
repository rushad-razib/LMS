import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CourseStatus } from "@arva/shared";
import { api, type Course, ApiError } from "@/lib/api";

const statuses: CourseStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  const [duration, setDuration] = useState("");
  const [priceBdt, setPriceBdt] = useState(10000);
  const [outlineText, setOutlineText] = useState("");
  const [status, setStatus] = useState<CourseStatus>("DRAFT");

  async function load() {
    const r = await api.adminListCourses();
    setCourses(r.courses);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof ApiError ? err.message : "Failed"));
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await api.adminCreateCourse({
        title,
        overview,
        duration,
        priceBdt,
        outlineText: outlineText || null,
        status,
      });
      setTitle("");
      setOverview("");
      setDuration("");
      setOutlineText("");
      setPriceBdt(10000);
      setStatus("DRAFT");
      setMessage("Course created.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  async function setCourseStatus(id: string, next: CourseStatus) {
    setError(null);
    try {
      await api.adminUpdateCourse(id, { status: next });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this course and its batches?")) return;
    await api.adminDeleteCourse(id);
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Courses</h1>
        <p className="text-sm text-ink-muted">Admin CRUD · price in whole BDT · outline text</p>
      </div>

      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-xl border border-border bg-surface-elevated p-4 md:grid-cols-2"
      >
        <input
          className="rounded-lg border border-border bg-surface px-3 py-2"
          placeholder="Title"
          value={title}
          required
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="rounded-lg border border-border bg-surface px-3 py-2"
          placeholder="Duration (e.g. 3 months)"
          value={duration}
          required
          onChange={(e) => setDuration(e.target.value)}
        />
        <input
          type="number"
          min={0}
          className="rounded-lg border border-border bg-surface px-3 py-2"
          placeholder="Price BDT"
          value={priceBdt}
          required
          onChange={(e) => setPriceBdt(Number(e.target.value))}
        />
        <select
          className="rounded-lg border border-border bg-surface px-3 py-2"
          value={status}
          onChange={(e) => setStatus(e.target.value as CourseStatus)}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <textarea
          className="md:col-span-2 rounded-lg border border-border bg-surface px-3 py-2"
          placeholder="Overview"
          rows={3}
          required
          value={overview}
          onChange={(e) => setOverview(e.target.value)}
        />
        <textarea
          className="md:col-span-2 rounded-lg border border-border bg-surface px-3 py-2"
          placeholder="Outline / syllabus (optional)"
          rows={3}
          value={outlineText}
          onChange={(e) => setOutlineText(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg md:col-span-2"
        >
          Create course
        </button>
      </form>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {message ? <p className="text-sm text-green-400">{message}</p> : null}

      <div className="space-y-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface-elevated p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-semibold">{course.title}</p>
              <p className="text-xs text-ink-muted">
                {course.slug} · ৳{course.priceBdt} · {course.status} · batches{" "}
                {course.batchCount ?? 0}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/admin/courses/${course.id}`}
                className="rounded-lg border border-border px-3 py-1.5 text-sm"
              >
                Batches
              </Link>
              {statuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="rounded-lg border border-border px-2 py-1 text-xs"
                  onClick={() => setCourseStatus(course.id, s)}
                >
                  {s}
                </button>
              ))}
              <button
                type="button"
                className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-300"
                onClick={() => remove(course.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
