import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import type { UserRole } from "@arva/shared";
import { AdminCreateUserInputSchema } from "@arva/shared";
import { api, ApiError } from "@/lib/api";
import {
  applyApiFormError,
  parseWithSchema,
  type FieldErrors,
} from "@/lib/formErrors";
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [teacherDelete, setTeacherDelete] = useState<AdminUserRow | null>(null);
  const [otherTeachers, setOtherTeachers] = useState<TeacherOption[]>([]);
  const [teacherDeleting, setTeacherDeleting] = useState(false);

  async function load() {
    const r = await api.adminListUsers();
    setUsers(r.users);
  }

  useEffect(() => {
    load().catch((err) =>
      setLoadError(err instanceof ApiError ? err.message : "Failed"),
    );
  }, []);

  function resetForm() {
    setFullName("");
    setEmail("");
    setRole("STUDENT");
    setPassword("");
    setPhone("");
    setFieldErrors({});
    setFormError(null);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setSaving(true);

    const parsed = parseWithSchema(AdminCreateUserInputSchema, {
      fullName,
      email,
      role,
      password: password || undefined,
      phone: phone.trim() || undefined,
    });
    if (!parsed.ok) {
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.formError);
      setSaving(false);
      return;
    }

    try {
      await api.adminCreateUser(parsed.data);
      resetForm();
      setModalOpen(false);
      await load();
      toast.success("User created");
    } catch (err) {
      applyApiFormError(err, setFieldErrors, setFormError, "Create failed");
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
        if (err instanceof ApiError && err.code === "ACCOUNT_HAS_ENROLLMENTS") {
          toast.error(
            "This student has orders or enrollments and cannot be deleted.",
          );
        } else {
          toast.error(err instanceof ApiError ? err.message : "Delete failed");
        }
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
            {row.original.role === "STUDENT" ? (
              <Link
                to={`/admin/students/${row.original.id}`}
                className="font-medium text-accent hover:underline"
              >
                {row.original.fullName}
              </Link>
            ) : row.original.role === "TEACHER" ? (
              <Link
                to={`/admin/teachers/${row.original.id}`}
                className="font-medium text-accent hover:underline"
              >
                {row.original.fullName}
              </Link>
            ) : (
              <p className="font-medium">{row.original.fullName}</p>
            )}
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
          setFieldErrors({});
          setFormError(null);
          setModalOpen(true);
        }}
      />

      {loadError ? <p className="text-sm text-red-400">{loadError}</p> : null}

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
        <form noValidate onSubmit={onCreate} className="grid gap-3">
          <Field label="Full name" error={fieldErrors.fullName}>
            <input
              className="rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="e.g. Ayesha Rahman"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </Field>
          <Field label="Email" error={fieldErrors.email}>
            <input
              className="rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="name@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Role" error={fieldErrors.role}>
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
          {role === "STUDENT" || role === "TEACHER" ? (
            <Field
              label={role === "STUDENT" ? "Phone" : "Phone (optional)"}
              error={fieldErrors.phone}
            >
              <input
                className="rounded-lg border border-border bg-surface px-3 py-2"
                placeholder="+8801…"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
          ) : null}
          <Field label="Password" error={fieldErrors.password}>
            <input
              className="rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="Optional — sends set-password email if empty"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
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
