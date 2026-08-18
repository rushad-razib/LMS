import { useEffect, useState } from "react";
import { Modal } from "./Modal";

export type TaughtBatch = {
  id: string;
  name: string;
  courseTitle: string;
};

type TeacherOption = {
  id: string;
  fullName: string;
  email: string;
};

type TeacherDeleteDialogProps = {
  open: boolean;
  teacherName: string;
  batches: TaughtBatch[];
  teachers: TeacherOption[];
  saving?: boolean;
  onCancel: () => void;
  onConfirm: (reassignTeacherId: string | null) => void;
};

export function TeacherDeleteDialog({
  open,
  teacherName,
  batches,
  teachers,
  saving = false,
  onCancel,
  onConfirm,
}: TeacherDeleteDialogProps) {
  const [showReassign, setShowReassign] = useState(false);
  const [reassignTeacherId, setReassignTeacherId] = useState("");

  useEffect(() => {
    if (!open) {
      setShowReassign(false);
      setReassignTeacherId("");
    }
  }, [open]);

  return (
    <Modal open={open} title="Delete teacher" onClose={onCancel} showClose={false}>
      <p className="text-sm text-ink-muted">
        Delete {teacherName}? These batches will remain but become unassigned unless
        you reassign them:
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink">
        {batches.map((batch) => (
          <li key={batch.id}>
            {batch.courseTitle} — {batch.name}
          </li>
        ))}
      </ul>

      {teachers.length > 0 ? (
        <div className="mt-4">
          {showReassign ? (
            <label className="grid gap-1 text-sm">
              <span className="text-ink-muted">Reassign all listed batches to</span>
              <select
                className="rounded-lg border border-border bg-surface px-3 py-2"
                value={reassignTeacherId}
                onChange={(e) => setReassignTeacherId(e.target.value)}
              >
                <option value="">Select a teacher…</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.email})
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <button
              type="button"
              className="text-sm font-semibold text-accent hover:underline"
              onClick={() => setShowReassign(true)}
            >
              Reassign
            </button>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-muted">No other teachers available to reassign to.</p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="button"
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
          disabled={saving}
          onClick={() => onConfirm(reassignTeacherId || null)}
        >
          {saving ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
