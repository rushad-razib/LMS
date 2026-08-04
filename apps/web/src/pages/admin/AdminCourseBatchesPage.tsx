import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { BatchStatus } from "@arva/shared";
import { api, type Batch, type Course, ApiError } from "@/lib/api";

const batchStatuses: BatchStatus[] = ["UPCOMING", "ONGOING", "CLOSED"];

export function AdminCourseBatchesPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; fullName: string; email: string }[]>(
    [],
  );
  const [name, setName] = useState("");
  const [scheduleSummary, setScheduleSummary] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [status, setStatus] = useState<BatchStatus>("UPCOMING");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!courseId) return;
    const [c, b, t] = await Promise.all([
      api.adminGetCourse(courseId),
      api.adminListBatches(courseId),
      api.adminListTeachers(),
    ]);
    setCourse(c.course);
    setBatches(b.batches);
    setTeachers(t.teachers);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof ApiError ? err.message : "Failed"));
  }, [courseId]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!courseId) return;
    setError(null);
    try {
      await api.adminCreateBatch({
        courseId,
        name,
        scheduleSummary: scheduleSummary || null,
        status,
        teacherId: teacherId || null,
      });
      setName("");
      setScheduleSummary("");
      setTeacherId("");
      setStatus("UPCOMING");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  async function reassign(batchId: string, nextTeacherId: string) {
    setError(null);
    try {
      await api.adminAssignBatchTeacher(batchId, nextTeacherId || null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Assign failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this batch?")) return;
    await api.adminDeleteBatch(id);
    await load();
  }

  if (!course) {
    return <p className="text-ink-muted">{error ?? "Loading…"}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/courses" className="text-sm text-accent hover:underline">
          ← Courses
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold">{course.title} — batches</h1>
        <p className="text-sm text-ink-muted">
          One primary teacher per batch. Admin can assign/reassign.
        </p>
      </div>

      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-xl border border-border bg-surface-elevated p-4 md:grid-cols-2"
      >
        <input
          className="rounded-lg border border-border bg-surface px-3 py-2"
          placeholder="Batch name (e.g. Evening A)"
          value={name}
          required
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="rounded-lg border border-border bg-surface px-3 py-2"
          value={status}
          onChange={(e) => setStatus(e.target.value as BatchStatus)}
        >
          {batchStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-border bg-surface px-3 py-2"
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
        >
          <option value="">No teacher yet</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.fullName} ({t.email})
            </option>
          ))}
        </select>
        <textarea
          className="md:col-span-2 rounded-lg border border-border bg-surface px-3 py-2"
          placeholder="Schedule summary (optional)"
          rows={2}
          value={scheduleSummary}
          onChange={(e) => setScheduleSummary(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg md:col-span-2"
        >
          Create batch
        </button>
      </form>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {teachers.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No teachers yet — create a TEACHER from{" "}
          <Link to="/admin/users" className="text-accent hover:underline">
            Users
          </Link>
          .
        </p>
      ) : null}

      <div className="space-y-3">
        {batches.map((batch) => (
          <div
            key={batch.id}
            className="space-y-3 rounded-xl border border-border bg-surface-elevated p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{batch.name}</p>
                <p className="text-xs text-ink-muted">
                  {batch.status}
                  {batch.scheduleSummary ? ` · ${batch.scheduleSummary}` : ""}
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-red-300"
                onClick={() => remove(batch.id)}
              >
                Delete
              </button>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-ink-muted">Primary teacher</span>
              <select
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                value={batch.teacherId ?? ""}
                onChange={(e) => reassign(batch.id, e.target.value)}
              >
                <option value="">Unassigned</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.email})
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
