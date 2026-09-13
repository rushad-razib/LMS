import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { api, ApiError, type TeacherAnnouncement } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/ConfirmProvider";
import { DataTable } from "@/components/DataTable";
import { Field } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";

const inputClass = "rounded-lg border border-border bg-surface px-3 py-2 text-ink";

export function TeacherAnnouncementsPage() {
  const { id } = useParams();
  const confirm = useConfirm();
  const [announcements, setAnnouncements] = useState<TeacherAnnouncement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await api.teacherAnnouncements(id);
    setAnnouncements(res.announcements);
  }, [id]);

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof ApiError ? err.message : "Failed to load"),
    );
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setBody("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await api.teacherUpdateAnnouncement(id, editingId, { title, body });
        toast.success("Announcement updated");
      } else {
        await api.teacherCreateAnnouncement(id, { title, body });
        toast.success("Announcement posted — students emailed");
      }
      setModalOpen(false);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const remove = useCallback(
    async (announcementId: string) => {
      if (!id) return;
      const ok = await confirm({
        title: "Delete announcement",
        message: "Remove this announcement from the batch?",
        confirmLabel: "Delete",
      });
      if (!ok) return;
      try {
        await api.teacherDeleteAnnouncement(id, announcementId);
        await load();
        toast.success("Announcement deleted");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Delete failed");
      }
    },
    [confirm, id, load],
  );

  const columns = useMemo<ColumnDef<TeacherAnnouncement, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Announcement",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.title}</p>
            <p className="line-clamp-2 text-xs text-ink-muted">{row.original.body}</p>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Posted",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-ink-muted">
            {new Date(row.original.createdAt).toLocaleString()}
          </span>
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
              onClick={() => {
                setError(null);
                setEditingId(row.original.id);
                setTitle(row.original.title);
                setBody(row.original.body);
                setModalOpen(true);
              }}
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
        title="Announcements"
        description="Creating an announcement emails every student in this batch."
        actionLabel="+ Post announcement"
        onAction={() => {
          setError(null);
          resetForm();
          setModalOpen(true);
        }}
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <DataTable
        data={announcements}
        columns={columns}
        filterPlaceholder="Search announcements…"
        emptyMessage="No announcements yet."
      />
      <Modal
        open={modalOpen}
        title={editingId ? "Edit announcement" : "Post announcement"}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
      >
        <form onSubmit={onSubmit} className="grid gap-3">
          <Field label="Title">
            <input
              className={inputClass}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Body">
            <textarea
              className={inputClass}
              required
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
          >
            {saving
              ? "Saving…"
              : editingId
                ? "Save announcement"
                : "Post and email students"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
