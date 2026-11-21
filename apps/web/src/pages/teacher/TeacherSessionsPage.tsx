import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CreateLiveSessionInputSchema,
  SESSION_TYPE_LABELS,
  SESSION_TYPES,
  SessionType,
  UpdateLiveSessionInputSchema,
  WEEKDAY_LABELS,
  WEEKDAYS,
  type Weekday,
} from "@arva/shared";
import { api, ApiError, type TeacherLiveSession } from "@/lib/api";
import {
  applyApiFormError,
  parseWithSchema,
  type FieldErrors,
} from "@/lib/formErrors";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/ConfirmProvider";
import { DataTable } from "@/components/DataTable";
import { DateField, DateTimeField } from "@/components/DateField";
import { TeacherAttendanceModal } from "./TeacherAttendanceModal";
import { Field } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { formatDateTime, formatTime } from "@/lib/dates";

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [sessionType, setSessionType] = useState<number>(SessionType.Online);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [weekdays, setWeekdays] = useState<Weekday[]>([WEEKDAYS[0]]);
  const [until, setUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [attendanceSessionId, setAttendanceSessionId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await api.teacherSessions(id);
    setSessions(res.sessions);
  }, [id]);

  useEffect(() => {
    load().catch((err) =>
      setLoadError(err instanceof ApiError ? err.message : "Failed to load"),
    );
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setStartsAt("");
    setEndsAt("");
    setSessionType(SessionType.Online);
    setMeetingUrl("");
    setRepeatWeekly(false);
    setWeekdays([WEEKDAYS[0]]);
    setUntil("");
    setNotes("");
    setFieldErrors({});
    setFormError(null);
  }

  function openCreate() {
    setLoadError(null);
    resetForm();
    setModalOpen(true);
  }

  function openEdit(session: TeacherLiveSession) {
    setLoadError(null);
    setFieldErrors({});
    setFormError(null);
    setEditingId(session.id);
    setTitle(session.title);
    setStartsAt(toDateTimeLocal(session.startsAt));
    setEndsAt(session.endsAt ? toDateTimeLocal(session.endsAt) : "");
    setSessionType(session.sessionType);
    setMeetingUrl(session.meetingUrl ?? "");
    setRepeatWeekly(false);
    setNotes(session.notes ?? "");
    setModalOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setFieldErrors({});
    setFormError(null);
    setSaving(true);

    if (!editingId && repeatWeekly && weekdays.length === 0) {
      setFieldErrors({ weekly: "Select at least one weekday" });
      setSaving(false);
      return;
    }
    if (!editingId && repeatWeekly && !until) {
      setFieldErrors({ "weekly.until": "Choose an end date" });
      setSaving(false);
      return;
    }

    const payload = {
      title,
      startsAt: fromDateTimeLocal(startsAt),
      endsAt: endsAt ? fromDateTimeLocal(endsAt) : null,
      sessionType,
      meetingUrl: sessionType === SessionType.Online ? meetingUrl : null,
      notes: notes.trim() || null,
      weekly:
        !editingId && repeatWeekly ? { weekdays, until } : null,
    };

    try {
      if (editingId) {
        const parsed = parseWithSchema(UpdateLiveSessionInputSchema, payload);
        if (!parsed.ok) {
          setFieldErrors(parsed.fieldErrors);
          setFormError(parsed.formError);
          return;
        }
        await api.teacherUpdateSession(id, editingId, parsed.data);
        toast.success("Session updated");
      } else {
        const parsed = parseWithSchema(CreateLiveSessionInputSchema, payload);
        if (!parsed.ok) {
          setFieldErrors(parsed.fieldErrors);
          setFormError(parsed.formError);
          return;
        }
        const created = await api.teacherCreateSession(id, parsed.data);
        toast.success(
          created.sessions.length > 1
            ? `${created.sessions.length} classes created`
            : "Session created",
        );
      }
      setModalOpen(false);
      resetForm();
      await load();
    } catch (err) {
      applyApiFormError(
        err,
        setFieldErrors,
        setFormError,
        editingId ? "Update failed" : "Create failed",
      );
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
            <p className="text-xs text-ink-muted">
              {row.original.sessionType === SessionType.Online
                ? SESSION_TYPE_LABELS[SessionType.Online]
                : SESSION_TYPE_LABELS[SessionType.Offline]}
            </p>
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
            {formatDateTime(row.original.startsAt)}
            {row.original.endsAt ? ` – ${formatTime(row.original.endsAt)}` : ""}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            {row.original.sessionType === SessionType.Online && row.original.meetingUrl ? (
              <a
                href={row.original.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-border px-2 py-1 text-xs hover:border-accent hover:bg-surface hover:text-accent"
              >
                Join
              </a>
            ) : null}
            <button
              type="button"
              className="rounded-lg border border-border px-2 py-1 text-xs hover:border-accent hover:bg-surface hover:text-accent"
              onClick={() => setAttendanceSessionId(row.original.id)}
            >
              Attendance
            </button>
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
        description="Online or offline classes for this batch. Ordered by start time."
        actionLabel="+ Add session"
        onAction={openCreate}
      />
      {loadError ? <p className="text-sm text-red-400">{loadError}</p> : null}
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
        <form noValidate onSubmit={onSubmit} className="grid gap-3">
          <Field label="Title" error={fieldErrors.title}>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Type" error={fieldErrors.sessionType}>
            <select
              className={inputClass}
              value={sessionType}
              onChange={(e) => setSessionType(Number(e.target.value))}
            >
              {SESSION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {SESSION_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Starts" error={fieldErrors.startsAt}>
            <DateTimeField className={inputClass} value={startsAt} onChange={setStartsAt} />
          </Field>
          <Field label="Ends (optional)" error={fieldErrors.endsAt}>
            <DateTimeField className={inputClass} value={endsAt} onChange={setEndsAt} />
          </Field>
          {!editingId ? (
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={repeatWeekly}
                onChange={(e) => setRepeatWeekly(e.target.checked)}
              />
              Repeat weekly
            </label>
          ) : null}
          {!editingId && repeatWeekly ? (
            <>
              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium text-ink-muted">Weekdays</legend>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => (
                    <label key={day} className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={weekdays.includes(day)}
                        onChange={(e) => {
                          setWeekdays((current) =>
                            e.target.checked
                              ? [...current, day]
                              : current.filter((value) => value !== day),
                          );
                        }}
                      />
                      {WEEKDAY_LABELS[day]}
                    </label>
                  ))}
                </div>
                {fieldErrors.weekly ? (
                  <p className="text-xs text-red-400">{fieldErrors.weekly}</p>
                ) : null}
              </fieldset>
              <Field label="Repeat until" error={fieldErrors["weekly.until"]}>
                <DateField className={inputClass} value={until} onChange={setUntil} />
              </Field>
            </>
          ) : null}
          {sessionType === SessionType.Online ? (
            <Field label="Meeting URL" error={fieldErrors.meetingUrl}>
              <input
                className={inputClass}
                placeholder="https://meet.google.com/…"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
              />
            </Field>
          ) : null}
          <Field label="Notes" error={fieldErrors.notes}>
            <textarea
              className={inputClass}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
          {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Save session" : "Create session"}
          </button>
        </form>
      </Modal>
      {id ? (
        <TeacherAttendanceModal
          batchId={id}
          sessionId={attendanceSessionId}
          onClose={() => setAttendanceSessionId(null)}
        />
      ) : null}
    </div>
  );
}
