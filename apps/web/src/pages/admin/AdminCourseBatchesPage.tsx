import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

export function AdminCourseBatchesPage() {
  const confirm = useConfirm();
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; fullName: string; email: string }[]>(
    [],
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    setEditingId(null);
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
    setName(batch.name);
    setScheduleSummary(batch.scheduleSummary ?? "");
    setTeacherId(batch.teacherId ?? "");
    setStatus((batch.status as BatchStatus) || "UPCOMING");
    setModalOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!courseId) return;
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

  async function reassign(batchId: string, nextTeacherId: string) {
    setError(null);
    try {
      await api.adminAssignBatchTeacher(batchId, nextTeacherId || null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Assign failed");
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
  }, [confirm, courseId]);

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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-border px-2 py-1 text-xs hover:border-accent hover:bg-surface hover:text-accent"
              onClick={() => openEdit(row.original)}
            >
              Edit
            </button>
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
    [teachers, remove],
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
            onAction={openCreate}
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
        title={editingId ? "Edit batch" : "Create batch"}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
      >
        <form onSubmit={onSubmit} className="grid gap-3">
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
