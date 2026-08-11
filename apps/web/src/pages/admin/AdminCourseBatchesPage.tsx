import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import type { BatchStatus } from "@arva/shared";
import { api, type Batch, type Course, ApiError } from "@/lib/api";
import { DataTable } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";

const batchStatuses: BatchStatus[] = ["UPCOMING", "ONGOING", "CLOSED"];

export function AdminCourseBatchesPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; fullName: string; email: string }[]>(
    [],
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [scheduleSummary, setScheduleSummary] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [status, setStatus] = useState<BatchStatus>("UPCOMING");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  function resetForm() {
    setName("");
    setScheduleSummary("");
    setTeacherId("");
    setStatus("UPCOMING");
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!courseId) return;
    setError(null);
    setSaving(true);
    try {
      await api.adminCreateBatch({
        courseId,
        name,
        scheduleSummary: scheduleSummary || null,
        status,
        teacherId: teacherId || null,
      });
      resetForm();
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setSaving(false);
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

  const columns = useMemo<ColumnDef<Batch, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Batch",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            {row.original.scheduleSummary ? (
              <p className="text-xs text-ink-muted">{row.original.scheduleSummary}</p>
            ) : null}
          </div>
        ),
      },
      { accessorKey: "status", header: "Status" },
      {
        id: "teacher",
        header: "Teacher",
        enableSorting: false,
        cell: ({ row }) => (
          <select
            className="min-w-[12rem] rounded-lg border border-border bg-surface px-2 py-1 text-xs"
            value={row.original.teacherId ?? ""}
            onChange={(e) => reassign(row.original.id, e.target.value)}
          >
            <option value="">Unassigned</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </select>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <button
            type="button"
            className="text-xs text-red-300"
            onClick={() => remove(row.original.id)}
          >
            Delete
          </button>
        ),
      },
    ],
    [teachers],
  );

  if (!course) {
    return <p className="text-ink-muted">{error ?? "Loading…"}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/courses" className="text-sm text-accent hover:underline">
          ← Courses
        </Link>
        <div className="mt-2">
          <PageHeader
            title={`${course.title} — batches`}
            description="One primary teacher per batch. Admin can assign/reassign."
            actionLabel="+ Create batch"
            onAction={() => {
              setError(null);
              setModalOpen(true);
            }}
          />
        </div>
      </div>

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

      <DataTable
        data={batches}
        columns={columns}
        filterPlaceholder="Search batches…"
        emptyMessage="No batches for this course."
      />

      <Modal
        open={modalOpen}
        title="Create batch"
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
      >
        <form onSubmit={onCreate} className="grid gap-3">
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
            className="rounded-lg border border-border bg-surface px-3 py-2"
            placeholder="Schedule summary (optional)"
            rows={2}
            value={scheduleSummary}
            onChange={(e) => setScheduleSummary(e.target.value)}
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create batch"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
