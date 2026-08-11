import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import type { CourseStatus } from "@arva/shared";
import { api, type Course, ApiError } from "@/lib/api";
import { DataTable } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";

const statuses: CourseStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  const [duration, setDuration] = useState("");
  const [priceBdt, setPriceBdt] = useState(10000);
  const [outlineText, setOutlineText] = useState("");
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
    setTitle("");
    setOverview("");
    setDuration("");
    setOutlineText("");
    setPriceBdt(10000);
    setStatus("DRAFT");
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.adminCreateCourse({
        title,
        overview,
        duration,
        priceBdt,
        outlineText: outlineText || null,
        status,
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
              className="rounded-lg border border-border px-2 py-1 text-xs"
            >
              Batches
            </Link>
            {statuses.map((s) => (
              <button
                key={s}
                type="button"
                className="rounded-lg border border-border px-2 py-1 text-xs"
                onClick={() => setCourseStatus(row.original.id, s)}
              >
                {s}
              </button>
            ))}
            <button
              type="button"
              className="rounded-lg border border-red-500/40 px-2 py-1 text-xs text-red-300"
              onClick={() => remove(row.original.id)}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Admin CRUD · price in whole BDT · outline text"
        actionLabel="+ Create course"
        onAction={() => {
          setError(null);
          setModalOpen(true);
        }}
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
        title="Create course"
        wide
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
      >
        <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-2">
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
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60 md:col-span-2"
          >
            {saving ? "Creating…" : "Create course"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
