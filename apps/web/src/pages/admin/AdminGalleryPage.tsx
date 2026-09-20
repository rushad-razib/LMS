import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { api, type GalleryItem, ApiError } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/ConfirmProvider";
import { DataTable } from "@/components/DataTable";
import { Field } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";

export function AdminGalleryPage() {
  const confirm = useConfirm();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await api.adminListGallery();
    setItems(r.items);
  }

  useEffect(() => {
    load().catch((err) =>
      setLoadError(err instanceof ApiError ? err.message : "Failed"),
    );
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setFormError("Image is required");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await api.adminCreateGallery(file, {
        title: title.trim() || null,
        sortOrder,
      });
      toast.success("Gallery item added");
      setModalOpen(false);
      setTitle("");
      setSortOrder(0);
      setFile(null);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo<ColumnDef<GalleryItem>[]>(
    () => [
      {
        id: "preview",
        header: "Image",
        cell: ({ row }) => (
          <img
            src={row.original.imageUrl}
            alt=""
            className="h-12 w-16 rounded object-cover"
          />
        ),
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => row.original.title || "—",
      },
      { accessorKey: "sortOrder", header: "Order" },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <button
            type="button"
            className="text-sm text-red-400"
            onClick={async () => {
              const ok = await confirm({
                title: "Delete image?",
                message: row.original.title || row.original.id,
              });
              if (!ok) return;
              await api.adminDeleteGallery(row.original.id);
              toast.success("Deleted");
              await load();
            }}
          >
            Delete
          </button>
        ),
      },
    ],
    [confirm],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Gallery"
        description="Public gallery images."
        actionLabel="+ Upload"
        onAction={() => setModalOpen(true)}
      />
      {loadError ? <p className="text-sm text-red-400">{loadError}</p> : null}
      <DataTable columns={columns} data={items} filterPlaceholder="Search…" />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Upload image">
        <form noValidate onSubmit={onSubmit} className="space-y-3">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
          <Field label="Image">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>
          {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
          >
            {saving ? "Uploading…" : "Upload"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
