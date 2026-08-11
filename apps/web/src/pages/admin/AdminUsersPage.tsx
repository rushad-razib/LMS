import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { UserRole } from "@arva/shared";
import { api, ApiError } from "@/lib/api";
import { DataTable } from "@/components/DataTable";
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
};

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

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
    ],
    [],
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

      <Modal
        open={modalOpen}
        title="Create user"
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
      >
        <form onSubmit={onCreate} className="grid gap-3">
          <input
            className="rounded-lg border border-border bg-surface px-3 py-2"
            placeholder="Full name"
            value={fullName}
            required
            onChange={(e) => setFullName(e.target.value)}
          />
          <input
            className="rounded-lg border border-border bg-surface px-3 py-2"
            placeholder="Email"
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            className="rounded-lg border border-border bg-surface px-3 py-2"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
            <option value="ADMIN">Admin</option>
          </select>
          <input
            className="rounded-lg border border-border bg-surface px-3 py-2"
            placeholder="Password (optional — sends set-password email if empty)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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
