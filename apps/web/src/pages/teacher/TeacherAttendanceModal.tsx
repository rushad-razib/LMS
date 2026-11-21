import { useEffect, useState } from "react";
import { api, ApiError, type SessionAttendanceStudent } from "@/lib/api";
import { Modal } from "@/components/Modal";

function formatParticipation(value: number | null) {
  return value === null ? "—" : `${value}%`;
}

type TeacherAttendanceModalProps = {
  batchId: string;
  sessionId: string | null;
  onClose: () => void;
};

export function TeacherAttendanceModal({
  batchId,
  sessionId,
  onClose,
}: TeacherAttendanceModalProps) {
  const [students, setStudents] = useState<SessionAttendanceStudent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    api
      .teacherSessionAttendance(batchId, sessionId)
      .then((res) => setStudents(res.students))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load attendance"),
      )
      .finally(() => setLoading(false));
  }, [batchId, sessionId]);

  async function save() {
    if (!sessionId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.teacherSaveAttendance(
        batchId,
        sessionId,
        students.map((student) => ({ userId: student.userId, present: student.present })),
      );
      setStudents(res.students);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={Boolean(sessionId)} title="Attendance" onClose={onClose}>
      {loading ? <p className="text-sm text-ink-muted">Loading…</p> : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {!loading && students.length === 0 ? (
        <p className="text-sm text-ink-muted">No students are assigned to this batch.</p>
      ) : null}
      {students.length > 0 ? (
        <div className="grid gap-3">
          <ul className="divide-y divide-border">
            {students.map((student) => (
              <li key={student.userId} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <p className="font-medium">{student.fullName}</p>
                  <p className="text-xs text-ink-muted">
                    {student.email} · {formatParticipation(student.participationPercent)}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-ink-muted">{student.present ? "Present" : "Absent"}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={student.present}
                    aria-label={`${student.fullName} ${student.present ? "present" : "absent"}`}
                    className={[
                      "relative h-6 w-11 rounded-full transition-colors",
                      student.present ? "bg-accent" : "bg-border",
                    ].join(" ")}
                    onClick={() =>
                      setStudents((current) =>
                        current.map((row) =>
                          row.userId === student.userId ? { ...row, present: !row.present } : row,
                        ),
                      )
                    }
                  >
                    <span
                      className={[
                        "absolute top-0.5 h-5 w-5 rounded-full bg-surface transition-transform",
                        student.present ? "translate-x-5" : "translate-x-0.5",
                      ].join(" ")}
                    />
                  </button>
                </label>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
            onClick={() => void save()}
          >
            {saving ? "Saving…" : "Save attendance"}
          </button>
        </div>
      ) : null}
    </Modal>
  );
}
