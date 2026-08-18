import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { UserRole } from "@arva/shared";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useAuth } from "@/features/auth/AuthProvider";
import { useConfirm } from "@/components/ConfirmProvider";
import { TeacherDeleteDialog } from "@/components/TeacherDeleteDialog";
import { DataTable } from "@/components/DataTable";
import { Field } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";

type AdminUserRow = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  taughtBatchCount: number;
  taughtBatches: { id: string; name: string; courseTitle: string }[];
};

type TeacherOption = { id: string; fullName: string; email: string };

function deleteConfirmCopy(user: AdminUserRow) {
  if (user.role === "TEACHER") {
    return {
      title: "Delete teacher",
      message: "Delete this teacher?",
    };
  }
  if (user.role === "ADMIN") {
    return {
      title: "Delete admin",
      message: "Delete this admin? They will lose access immediately.",
    };
  }
  return {
    title: "Delete student",
    message: "Delete this student? Their account and login sessions will be removed.",
  };
}

export function AdminUsersPage() {
  const confirm = useConfirm();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [teacherDelete, setTeacherDelete] = useState<AdminUserRow | null>(null);
  const [otherTeachers, setOtherTeachers] = useState<TeacherOption[]>([]);
  const [teacherDeleting, setTeacherDeleting] = useState(false);

  async function load() {
    const r = await api.adminListUsers();
    setUsers(r.users);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof ApiError ? err.message : "Failed"));
  }, []);

  function resetForm() {
    setFullName("");
    setEmail("");
    setRole("STUDENT");
    setPassword("");
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.adminCreateUser({
        fullName,
        email,
        role,
        password: password || undefined,
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

  const deleteUser = useCallback(async (id: string, reassignTeacherId?: string | null) => {
    await api.adminDeleteUser(
      id,
      reassignTeacherId ? { reassignTeacherId } : {},
    );
    await load();
    toast.success("User deleted");
  }, []);

  const remove = useCallback(
    async (row: AdminUserRow) => {
      if (row.role === "TEACHER" && row.taughtBatches.length > 0) {
        try {
          const r = await api.adminListTeachers();
          setOtherTeachers(r.teachers.filter((t) => t.id !== row.id));
          setTeacherDelete(row);
        } catch (err) {
          toast.error(err instanceof ApiError ? err.message : "Failed to load teachers");
        }
        return;
      }

      const copy = deleteConfirmCopy(row);
      const ok = await confirm({
        title: copy.title,
        message: copy.message,
        confirmLabel: "Delete",
      });
      if (!ok) return;
      try {
        await deleteUser(row.id);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Delete failed");
      }
    },
    [confirm, deleteUser],
  );

  async function confirmTeacherDelete(reassignTeacherId: string | null) {
    if (!teacherDelete) return;
    setTeacherDeleting(true);
    try {
      await deleteUser(teacherDelete.id, reassignTeacherId);
      setTeacherDelete(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setTeacherDeleting(false);
    }
  }

  const columns = useMemo<ColumnDef<AdminUserRow, unknown>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Name",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.fullName}</p>
            <p className="text-xs text-ink-muted">{row.original.email}</p>
          </div>
        ),
      },
      { accessorKey: "role", header: "Role" },
      { accessorKey: "status", header: "Status" },
      {
        id: "verified",
        header: "Verified",
        accessorFn: (row) => (row.emailVerifiedAt ? "Yes" : "No"),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.id === currentUser?.id ? null : (
            <button
              type="button"
              className="rounded-lg border border-red-500/40 px-2 py-1 text-xs text-red-300 hover:border-red-400 hover:bg-red-500/15 hover:text-red-200"
              onClick={() => remove(row.original)}
            >
              Delete
            </button>
          ),
      },
    ],
    [currentUser?.id, remove],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Students, teachers, and admins."
        actionLabel="+ Create user"
        onAction={() => {
          setError(null);
          setModalOpen(true);
        }}
      />

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <DataTable
        data={users}
        columns={columns}
        filterPlaceholder="Search users…"
        emptyMessage="No users found."
      />

      <TeacherDeleteDialog
        open={teacherDelete !== null}
        teacherName={teacherDelete?.fullName ?? ""}
        batches={teacherDelete?.taughtBatches ?? []}
        teachers={otherTeachers}
        saving={teacherDeleting}
        onCancel={() => setTeacherDelete(null)}
        onConfirm={confirmTeacherDelete}
      />

      <Modal
        open={modalOpen}
        title="Create user"
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
      >
        <form onSubmit={onCreate} className="grid gap-3">
          <Field label="Full name">
            <input
              className="rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="e.g. Ayesha Rahman"
              value={fullName}
              required
              onChange={(e) => setFullName(e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              className="rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="name@example.com"
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Role">
            <select
              className="rounded-lg border border-border bg-surface px-3 py-2"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              <option value="ADMIN">Admin</option>
            </select>
          </Field>
          <Field label="Password">
            <input
              className="rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="Optional — sends set-password email if empty"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create user"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
