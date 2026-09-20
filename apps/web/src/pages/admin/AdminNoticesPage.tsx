import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CreateGlobalNoticeInputSchema,
  UpdateGlobalNoticeInputSchema,
} from "@arva/shared";
import { api, type GlobalNotice, ApiError } from "@/lib/api";
import {
  applyApiFormError,
  parseWithSchema,
  type FieldErrors,
} from "@/lib/formErrors";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/ConfirmProvider";
import { DataTable } from "@/components/DataTable";
import { Field } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";

export function AdminNoticesPage() {
  const confirm = useConfirm();
  const [notices, setNotices] = useState<GlobalNotice[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [published, setPublished] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await api.adminListNotices();
    setNotices(r.notices);
  }

  useEffect(() => {
    load().catch((err) =>
      setLoadError(err instanceof ApiError ? err.message : "Failed"),
    );
  }, []);

  function openCreate() {
    setEditingId(null);
    setTitle("");
    setBody("");
    setPublished(false);
    setFieldErrors({});
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(n: GlobalNotice) {
    setEditingId(n.id);
    setTitle(n.title);
    setBody(n.body);
    setPublished(n.published);
    setFieldErrors({});
    setFormError(null);
    setModalOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormError(null);
    const payload = { title, body, published };
    const parsed = parseWithSchema(
      editingId ? UpdateGlobalNoticeInputSchema : CreateGlobalNoticeInputSchema,
      payload,
    );
    if (!parsed.ok) {
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.formError);
      setSaving(false);
      return;
    }
    try {
      if (editingId) await api.adminUpdateNotice(editingId, parsed.data);
      else
        await api.adminCreateNotice(
          parsed.data as { title: string; body: string; published?: boolean },
        );
      toast.success("Saved");
      setModalOpen(false);
      await load();
    } catch (err) {
      applyApiFormError(err, setFieldErrors, setFormError, "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo<ColumnDef<GlobalNotice>[]>(
    () => [
      { accessorKey: "title", header: "Title" },
      {
        accessorKey: "published",
        header: "Status",
        cell: ({ row }) => (row.original.published ? "Published" : "Draft"),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              type="button"
              className="text-sm text-accent"
              onClick={() => openEdit(row.original)}
            >
              Edit
            </button>
            <button
              type="button"
              className="text-sm text-red-400"
              onClick={async () => {
                const ok = await confirm({
                  title: "Delete notice?",
                  message: row.original.title,
                });
                if (!ok) return;
                await api.adminDeleteNotice(row.original.id);
                toast.success("Deleted");
                await load();
              }}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [confirm],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notices"
        description="Global notices for students."
        actionLabel="+ Create"
        onAction={openCreate}
      />
      {loadError ? <p className="text-sm text-red-400">{loadError}</p> : null}
      <DataTable columns={columns} data={notices} filterPlaceholder="Search…" />
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit notice" : "Create notice"}
      >
        <form noValidate onSubmit={onSubmit} className="space-y-3">
          <Field label="Title" error={fieldErrors.title}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            />
          </Field>
          <Field label="Body" error={fieldErrors.body}>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            Published
          </label>
          {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
