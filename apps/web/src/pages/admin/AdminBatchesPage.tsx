import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import type { BatchStatus } from "@arva/shared";
import { api, type Batch, type Course, ApiError } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/ConfirmProvider";
import { DataTable } from "@/components/DataTable";
import { Field } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";

const batchStatuses: BatchStatus[] = ["UPCOMING", "ONGOING", "CLOSED"];

export function AdminBatchesPage() {
  const confirm = useConfirm();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; fullName: string; email: string }[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    setEditingId(null);
    setCourseId("");
    setName("");
    setScheduleSummary("");
    setTeacherId("");
    setStatus("UPCOMING");
  }

  function openCreate() {
    setError(null);
    resetForm();
    setModalOpen(true);
  }

  function openEdit(batch: Batch) {
    setError(null);
    setEditingId(batch.id);
    setCourseId(batch.courseId);
    setName(batch.name);
    setScheduleSummary(batch.scheduleSummary ?? "");
    setTeacherId(batch.teacherId ?? "");
    setStatus((batch.status as BatchStatus) || "UPCOMING");
    setModalOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (editingId) {
        await api.adminUpdateBatch(editingId, {
          name,
          scheduleSummary: scheduleSummary || null,
          status,
          teacherId: teacherId || null,
        });
        toast.success("Batch updated");
      } else {
        await api.adminCreateBatch({
          courseId,
          name,
          scheduleSummary: scheduleSummary || null,
          status,
          teacherId: teacherId || null,
        });
        toast.success("Batch created");
      }
      resetForm();
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : editingId ? "Update failed" : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  const remove = useCallback(async (id: string) => {
    const ok = await confirm({
      title: "Delete batch",
      message: "Delete this batch?",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await api.adminDeleteBatch(id);
      await load();
      toast.success("Batch deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }, [confirm]);

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
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-border px-2 py-1 text-xs hover:border-accent hover:bg-surface hover:text-accent"
              onClick={() => openEdit(row.original)}
            >
              Edit
            </button>
            {row.original.course ? (
              <Link
                to={`/admin/courses/${row.original.course.id}`}
                className="rounded-lg border border-border px-2 py-1 text-xs hover:border-accent hover:bg-surface hover:text-accent"
              >
                Manage
              </Link>
            ) : null}
            <button
              type="button"
              className="rounded-lg border border-red-500/40 px-2 py-1 text-xs text-red-300 hover:border-red-400 hover:bg-red-500/15 hover:text-red-200"
              onClick={() => remove(row.original.id)}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [remove],
  );

  const editingCourseTitle = courses.find((c) => c.id === courseId)?.title;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches"
        description="All cohorts across courses."
        actionLabel="+ Create batch"
        onAction={openCreate}
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
        title={editingId ? "Edit batch" : "Create batch"}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
      >
        <form onSubmit={onSubmit} className="grid gap-3">
          {editingId ? (
            <Field label="Course">
              <p className="rounded-lg border border-border bg-surface px-3 py-2 text-ink">
                {editingCourseTitle ?? "—"}
              </p>
            </Field>
          ) : (
            <Field label="Course">
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
            </Field>
          )}
          <Field label="Batch name">
            <input
              className="rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="e.g. Evening A"
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Status">
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
          </Field>
          <Field label="Teacher">
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
          </Field>
          <Field label="Schedule summary">
            <textarea
              className="rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="Optional, e.g. Sun/Tue 7pm"
              rows={2}
              value={scheduleSummary}
              onChange={(e) => setScheduleSummary(e.target.value)}
            />
          </Field>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Save batch" : "Create batch"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
