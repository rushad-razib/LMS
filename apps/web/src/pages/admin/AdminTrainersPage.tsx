import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CreateMarketingTrainerInputSchema,
  UpdateMarketingTrainerInputSchema,
} from "@arva/shared";
import { api, type MarketingTrainer, ApiError } from "@/lib/api";
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

export function AdminTrainersPage() {
  const confirm = useConfirm();
  const [trainers, setTrainers] = useState<MarketingTrainer[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [published, setPublished] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await api.adminListTrainers();
    setTrainers(r.trainers);
  }

  useEffect(() => {
    load().catch((err) =>
      setLoadError(err instanceof ApiError ? err.message : "Failed"),
    );
  }, []);

  function openCreate() {
    setEditingId(null);
    setFullName("");
    setTitle("");
    setBio("");
    setSortOrder(0);
    setPublished(true);
    setPhotoFile(null);
    setPhotoUrl(null);
    setFieldErrors({});
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(t: MarketingTrainer) {
    setEditingId(t.id);
    setFullName(t.fullName);
    setTitle(t.title ?? "");
    setBio(t.bio ?? "");
    setSortOrder(t.sortOrder);
    setPublished(t.published);
    setPhotoUrl(t.photoUrl);
    setPhotoFile(null);
    setFieldErrors({});
    setFormError(null);
    setModalOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormError(null);
    const payload = {
      fullName,
      title: title.trim() || null,
      bio: bio.trim() || null,
      sortOrder,
      published,
    };
    const parsed = parseWithSchema(
      editingId
        ? UpdateMarketingTrainerInputSchema
        : CreateMarketingTrainerInputSchema,
      payload,
    );
    if (!parsed.ok) {
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.formError);
      setSaving(false);
      return;
    }
    try {
      const result = editingId
        ? await api.adminUpdateTrainer(editingId, parsed.data)
        : await api.adminCreateTrainer(
            parsed.data as {
              fullName: string;
              title?: string | null;
              bio?: string | null;
              sortOrder?: number;
              published?: boolean;
            },
          );
      if (photoFile) {
        await api.adminUploadTrainerPhoto(result.trainer.id, photoFile);
      }
      toast.success("Saved");
      setModalOpen(false);
      await load();
    } catch (err) {
      applyApiFormError(err, setFieldErrors, setFormError, "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo<ColumnDef<MarketingTrainer>[]>(
    () => [
      { accessorKey: "fullName", header: "Name" },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => row.original.title || "—",
      },
      {
        accessorKey: "published",
        header: "Status",
        cell: ({ row }) => (row.original.published ? "Public" : "Hidden"),
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
                  title: "Delete trainer?",
                  message: row.original.fullName,
                });
                if (!ok) return;
                await api.adminDeleteTrainer(row.original.id);
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
        title="Trainers"
        description="Marketing trainer profiles on the public site."
        actionLabel="+ Create"
        onAction={openCreate}
      />
      {loadError ? <p className="text-sm text-red-400">{loadError}</p> : null}
      <DataTable columns={columns} data={trainers} filterPlaceholder="Search…" />
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit trainer" : "Create trainer"}
      >
        <form noValidate onSubmit={onSubmit} className="space-y-3">
          <Field label="Full name" error={fieldErrors.fullName}>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            />
          </Field>
          <Field label="Title" error={fieldErrors.title}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            />
          </Field>
          <Field label="Bio" error={fieldErrors.bio}>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            />
          </Field>
          <Field label="Sort order">
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            />
          </Field>
          <Field label="Photo">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt=""
                className="mb-2 h-20 w-20 rounded-full object-cover"
              />
            ) : null}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
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
