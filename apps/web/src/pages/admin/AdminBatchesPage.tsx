import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import type { BatchStatus } from "@arva/shared";
import { api, type Batch, type Course, ApiError } from "@/lib/api";
import { DataTable } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";

const batchStatuses: BatchStatus[] = ["UPCOMING", "ONGOING", "CLOSED"];

export function AdminBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; fullName: string; email: string }[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [name, setName] = useState("");
  const [scheduleSummary, setScheduleSummary] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [status, setStatus] = useState<BatchStatus>("UPCOMING");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [b, c, t] = await Promise.all([
      api.adminListBatches(),
      api.adminListCourses(),
      api.adminListTeachers(),
    ]);
    setBatches(b.batches);
    setCourses(c.courses);
    setTeachers(t.teachers);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof ApiError ? err.message : "Failed"));
  }, []);

  function resetForm() {
    setCourseId("");
    setName("");
    setScheduleSummary("");
    setTeacherId("");
    setStatus("UPCOMING");
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
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
      {
        id: "course",
        header: "Course",
        accessorFn: (row) => row.course?.title ?? row.courseId,
      },
      { accessorKey: "status", header: "Status" },
      {
        id: "teacher",
        header: "Teacher",
        accessorFn: (row) => row.teacher?.fullName ?? "Unassigned",
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.course ? (
            <Link
              to={`/admin/courses/${row.original.course.id}`}
              className="text-xs text-accent hover:underline"
            >
              Manage
            </Link>
          ) : null,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches"
        description="All cohorts across courses."
        actionLabel="+ Create batch"
        onAction={() => {
          setError(null);
          setModalOpen(true);
        }}
      />

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <DataTable
        data={batches}
        columns={columns}
        filterPlaceholder="Search batches…"
        emptyMessage="No batches yet."
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
          <select
            className="rounded-lg border border-border bg-surface px-3 py-2"
            value={courseId}
            required
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">Select course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <input
            className="rounded-lg border border-border bg-surface px-3 py-2"
            placeholder="Batch name"
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
