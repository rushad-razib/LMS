import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, ApiError, type BatchStudent } from "@/lib/api";

function formatParticipation(value: number | null) {
  return value === null ? "—" : `${value}%`;
}

export function TeacherBatchStudentsPage() {
  const { id } = useParams();
  const [students, setStudents] = useState<BatchStudent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .teacherStudents(id)
      .then((res) => setStudents(res.students))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load students"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-ink-muted">Loading…</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (students.length === 0) {
    return <p className="text-ink-muted">No students are assigned to this batch yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Student</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Participation</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.userId} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium">{student.fullName}</td>
              <td className="px-4 py-3 text-ink-muted">{student.email}</td>
              <td className="px-4 py-3">{formatParticipation(student.participationPercent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
