import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import type { CourseStatus } from "@arva/shared";
import { api, type Course, ApiError } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/ConfirmProvider";
import { DataTable } from "@/components/DataTable";
import { Field } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";

const statuses: CourseStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export function AdminCoursesPage() {
  const confirm = useConfirm();
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  const [duration, setDuration] = useState("");
  const [priceBdt, setPriceBdt] = useState(10000);
  const [outlineText, setOutlineText] = useState("");
  const [faqText, setFaqText] = useState("");
  const [status, setStatus] = useState<CourseStatus>("DRAFT");
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await api.adminListCourses();
    setCourses(r.courses);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof ApiError ? err.message : "Failed"));
  }, []);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setOverview("");
    setDuration("");
    setOutlineText("");
    setFaqText("");
    setPriceBdt(10000);
    setStatus("DRAFT");
  }

  function openCreate() {
    setError(null);
    resetForm();
    setModalOpen(true);
  }

  function openEdit(course: Course) {
    setError(null);
    setEditingId(course.id);
    setTitle(course.title);
    setOverview(course.overview);
    setDuration(course.duration);
    setPriceBdt(course.priceBdt);
    setOutlineText(course.outlineText ?? "");
    setFaqText(course.faqText ?? "");
    setStatus((course.status as CourseStatus) || "DRAFT");
    setModalOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload = {
      title,
      overview,
      duration,
      priceBdt,
      outlineText: outlineText || null,
      faqText: faqText || null,
      status,
    };
    try {
      if (editingId) {
        await api.adminUpdateCourse(editingId, payload);
        toast.success("Course updated");
      } else {
        await api.adminCreateCourse(payload);
        toast.success("Course created");
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

  const remove = useCallback(
    async (id: string) => {
      const ok = await confirm({
        title: "Delete course",
        message: "This also deletes its batches.",
        confirmLabel: "Delete",
      });
      if (!ok) return;
      try {
        await api.adminDeleteCourse(id);
        await load();
        toast.success("Course deleted");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Delete failed");
      }
    },
    [confirm],
  );

  const columns = useMemo<ColumnDef<Course, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.title}</p>
            <p className="text-xs text-ink-muted">{row.original.slug}</p>
          </div>
        ),
      },
      {
        accessorKey: "priceBdt",
        header: "Price",
        cell: ({ row }) => `৳${row.original.priceBdt.toLocaleString("en-BD")}`,
      },
      { accessorKey: "duration", header: "Duration" },
      { accessorKey: "status", header: "Status" },
      {
        id: "batches",
        header: "Batches",
        accessorFn: (row) => row.batchCount ?? 0,
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/admin/courses/${row.original.id}`}
              className="rounded-lg border border-border px-2 py-1 text-xs hover:border-accent hover:bg-surface hover:text-accent"
            >
              Batches
            </Link>
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
    [remove],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Admin CRUD · price in whole BDT · outline text"
        actionLabel="+ Create course"
        onAction={openCreate}
      />

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <DataTable
        data={courses}
        columns={columns}
        filterPlaceholder="Search courses…"
        emptyMessage="No courses yet."
      />

      <Modal
        open={modalOpen}
        title={editingId ? "Edit course" : "Create course"}
        wide
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
      >
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
          <Field label="Title">
            <input
              className="rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="e.g. Web Development"
              value={title}
              required
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Duration">
            <input
              className="rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="e.g. 3 months"
              value={duration}
              required
              onChange={(e) => setDuration(e.target.value)}
            />
          </Field>
          <Field label="Price (BDT)">
            <input
              type="number"
              min={0}
              className="rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="0"
              value={priceBdt}
              required
              onChange={(e) => setPriceBdt(Number(e.target.value))}
            />
          </Field>
          <Field label="Status">
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
          </Field>
          <Field label="Overview" className="md:col-span-2">
            <textarea
              className="rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="Short public description"
              rows={3}
              required
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
            />
          </Field>
          <Field label="Outline / syllabus" className="md:col-span-2">
            <textarea
              className="rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="Optional syllabus bullets"
              rows={3}
              value={outlineText}
              onChange={(e) => setOutlineText(e.target.value)}
            />
          </Field>
          <Field label="FAQ" className="md:col-span-2">
            <textarea
              className="rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="Optional questions and answers"
              rows={3}
              value={faqText}
              onChange={(e) => setFaqText(e.target.value)}
            />
          </Field>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60 md:col-span-2"
          >
            {saving ? "Saving…" : editingId ? "Save course" : "Create course"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
