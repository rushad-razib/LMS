import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import {
  api,
  ApiError,
  type TeacherLiveSession,
  type TeacherSessionInput,
} from "@/lib/api";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/ConfirmProvider";
import { DataTable } from "@/components/DataTable";
import { Field } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";

function toDateTimeLocal(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDateTimeLocal(value: string) {
  return new Date(value).toISOString();
}

const inputClass = "rounded-lg border border-border bg-surface px-3 py-2 text-ink";

export function TeacherSessionsPage() {
  const { id } = useParams();
  const confirm = useConfirm();
  const [sessions, setSessions] = useState<TeacherLiveSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await api.teacherSessions(id);
    setSessions(res.sessions);
  }, [id]);

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof ApiError ? err.message : "Failed to load"),
    );
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setStartsAt("");
    setEndsAt("");
    setMeetingUrl("");
    setNotes("");
  }

  function openCreate() {
    setError(null);
    resetForm();
    setModalOpen(true);
  }

  function openEdit(session: TeacherLiveSession) {
    setError(null);
    setEditingId(session.id);
    setTitle(session.title);
    setStartsAt(toDateTimeLocal(session.startsAt));
    setEndsAt(session.endsAt ? toDateTimeLocal(session.endsAt) : "");
    setMeetingUrl(session.meetingUrl);
    setNotes(session.notes ?? "");
    setModalOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    const body: TeacherSessionInput = {
      title,
      startsAt: fromDateTimeLocal(startsAt),
      endsAt: endsAt ? fromDateTimeLocal(endsAt) : null,
      meetingUrl,
      notes: notes.trim() || null,
    };
    try {
      if (editingId) {
        await api.teacherUpdateSession(id, editingId, body);
        toast.success("Session updated");
      } else {
        await api.teacherCreateSession(id, body);
        toast.success("Session created");
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
    async (sessionId: string) => {
      if (!id) return;
      const ok = await confirm({
        title: "Delete session",
        message: "Remove this live session from the batch schedule?",
        confirmLabel: "Delete",
      });
      if (!ok) return;
      try {
        await api.teacherDeleteSession(id, sessionId);
        await load();
        toast.success("Session deleted");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Delete failed");
      }
    },
    [confirm, id, load],
  );

  const columns = useMemo<ColumnDef<TeacherLiveSession, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Session",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.title}</p>
            {row.original.notes ? (
              <p className="text-xs text-ink-muted">{row.original.notes}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: "when",
        header: "Starts",
        accessorFn: (row) => row.startsAt,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-ink-muted">
            {new Date(row.original.startsAt).toLocaleString()}
            {row.original.endsAt
              ? ` – ${new Date(row.original.endsAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : ""}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <a
              href={row.original.meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border px-2 py-1 text-xs hover:border-accent hover:bg-surface hover:text-accent"
            >
              Join
            </a>
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
        title="Live sessions"
        description="Dated Meet/Zoom classes for this batch. Ordered by start time."
        actionLabel="+ Add session"
        onAction={openCreate}
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <DataTable
        data={sessions}
        columns={columns}
        filterPlaceholder="Search sessions…"
        emptyMessage="No sessions yet."
      />
      <Modal
        open={modalOpen}
        title={editingId ? "Edit session" : "Add session"}
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
          <Field label="Starts">
            <input
              type="datetime-local"
              className={inputClass}
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </Field>
          <Field label="Ends (optional)">
            <input
              type="datetime-local"
              className={inputClass}
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </Field>
          <Field label="Meeting URL">
            <input
              className={inputClass}
              required
              placeholder="https://meet.google.com/…"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
            />
          </Field>
          <Field label="Notes">
            <textarea
              className={inputClass}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Save session" : "Create session"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
