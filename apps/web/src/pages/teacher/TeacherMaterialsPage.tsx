import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { UploadMaterialMetaSchema } from "@arva/shared";
import { api, ApiError, type TeacherMaterial } from "@/lib/api";
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

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const inputClass = "rounded-lg border border-border bg-surface px-3 py-2 text-ink";

export function TeacherMaterialsPage() {
  const { id } = useParams();
  const confirm = useConfirm();
  const [materials, setMaterials] = useState<TeacherMaterial[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await api.teacherMaterials(id);
    setMaterials(res.materials);
  }, [id]);

  useEffect(() => {
    load().catch((err) =>
      setLoadError(err instanceof ApiError ? err.message : "Failed to load"),
    );
  }, [load]);

  function resetForm() {
    setTitle("");
    setFile(null);
    setFieldErrors({});
    setFormError(null);
  }

  function openUpload() {
    setLoadError(null);
    resetForm();
    setModalOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setFieldErrors({});
    setFormError(null);

    if (!file) {
      setFieldErrors({ file: "Choose a file to upload" });
      return;
    }

    const metaPayload = title.trim() ? { title: title.trim() } : {};
    const parsed = parseWithSchema(UploadMaterialMetaSchema, metaPayload);
    if (!parsed.ok) {
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.formError);
      return;
    }

    setSaving(true);
    try {
      const body = new FormData();
      if (parsed.data.title) body.append("title", parsed.data.title);
      body.append("file", file);
      await api.teacherUploadMaterial(id, body);
      toast.success("Material uploaded");
      setModalOpen(false);
      resetForm();
      await load();
    } catch (err) {
      applyApiFormError(err, setFieldErrors, setFormError, "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  const remove = useCallback(
    async (materialId: string) => {
      if (!id) return;
      const ok = await confirm({
        title: "Remove material",
        message: "Delete this file from the batch?",
        confirmLabel: "Delete",
      });
      if (!ok) return;
      try {
        await api.teacherDeleteMaterial(id, materialId);
        await load();
        toast.success("Material removed");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Delete failed");
      }
    },
    [confirm, id, load],
  );

  const columns = useMemo<ColumnDef<TeacherMaterial, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Material",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.title}</p>
            <p className="text-xs text-ink-muted">
              {row.original.fileName} · {formatBytes(row.original.sizeBytes)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Uploaded",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-ink-muted">
            {new Date(row.original.createdAt).toLocaleString()}
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
              href={row.original.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border px-2 py-1 text-xs hover:border-accent hover:bg-surface hover:text-accent"
            >
              Download
            </a>
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
        title="Materials"
        description="PDFs and images (png/jpg converted to WebP). Images max 2MB, documents max 10MB."
        actionLabel="+ Upload"
        onAction={openUpload}
      />
      {loadError ? <p className="text-sm text-red-400">{loadError}</p> : null}
      <DataTable
        data={materials}
        columns={columns}
        filterPlaceholder="Search materials…"
        emptyMessage="No materials uploaded yet."
      />
      <Modal
        open={modalOpen}
        title="Upload material"
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
      >
        <form noValidate onSubmit={onSubmit} className="grid gap-3">
          <Field label="Title" error={fieldErrors.title}>
            <input
              className={inputClass}
              placeholder="Defaults to file name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="File" error={fieldErrors.file}>
            <input
              type="file"
              className={inputClass}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>
          {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
          >
            {saving ? "Uploading…" : "Upload"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
