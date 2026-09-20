import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CreateBlogPostInputSchema, UpdateBlogPostInputSchema } from "@arva/shared";
import { api, type BlogPost, ApiError } from "@/lib/api";
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
import { RichTextEditor } from "@/components/RichTextEditor";

export function AdminBlogPage() {
  const confirm = useConfirm();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [bodyHtml, setBodyHtml] = useState("<p></p>");
  const [published, setPublished] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await api.adminListBlog();
    setPosts(r.posts);
  }

  useEffect(() => {
    load().catch((err) =>
      setLoadError(err instanceof ApiError ? err.message : "Failed"),
    );
  }, []);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setExcerpt("");
    setBodyHtml("<p></p>");
    setPublished(false);
    setCoverFile(null);
    setCoverUrl(null);
    setFieldErrors({});
    setFormError(null);
  }

  function openCreate() {
    resetForm();
    setModalOpen(true);
  }

  function openEdit(post: BlogPost) {
    setEditingId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt);
    setBodyHtml(post.bodyHtml);
    setPublished(post.published);
    setCoverUrl(post.coverImageUrl);
    setCoverFile(null);
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
      title,
      slug: slug.trim() || undefined,
      excerpt,
      bodyHtml,
      published,
    };
    const parsed = parseWithSchema(
      editingId ? UpdateBlogPostInputSchema : CreateBlogPostInputSchema,
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
        ? await api.adminUpdateBlog(editingId, parsed.data)
        : await api.adminCreateBlog(parsed.data as {
            title: string;
            excerpt: string;
            bodyHtml: string;
            slug?: string;
            published?: boolean;
          });
      let post = result.post;
      if (coverFile) {
        const up = await api.adminUploadBlogCover(post.id, coverFile);
        post = up.post;
      }
      toast.success(editingId ? "Post updated" : "Post created");
      setModalOpen(false);
      await load();
      void post;
    } catch (err) {
      applyApiFormError(err, setFieldErrors, setFormError, "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo<ColumnDef<BlogPost>[]>(
    () => [
      { accessorKey: "title", header: "Title" },
      { accessorKey: "slug", header: "Slug" },
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
                  title: "Delete post?",
                  message: row.original.title,
                });
                if (!ok) return;
                await api.adminDeleteBlog(row.original.id);
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
        title="Blog"
        description="Publish articles on the public site."
        actionLabel="+ Create"
        onAction={openCreate}
      />
      {loadError ? <p className="text-sm text-red-400">{loadError}</p> : null}
      <DataTable columns={columns} data={posts} filterPlaceholder="Search posts…" />
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit post" : "Create post"}
      >
        <form noValidate onSubmit={onSubmit} className="space-y-3">
          <Field label="Title" error={fieldErrors.title}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            />
          </Field>
          <Field label="Slug (optional)" error={fieldErrors.slug}>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            />
          </Field>
          <Field label="Excerpt" error={fieldErrors.excerpt}>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            />
          </Field>
          <Field label="Body" error={fieldErrors.bodyHtml}>
            <RichTextEditor value={bodyHtml} onChange={setBodyHtml} />
          </Field>
          <Field label="Cover image">
            {coverUrl ? (
              <img src={coverUrl} alt="" className="mb-2 h-24 rounded object-cover" />
            ) : null}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
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
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
