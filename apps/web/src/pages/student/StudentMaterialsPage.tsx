import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, ApiError, type StudentMaterial } from "@/lib/api";
import { AwaitingBatchNotice } from "./AwaitingBatchNotice";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function StudentMaterialsPage() {
  const { slug } = useParams();
  const [materials, setMaterials] = useState<StudentMaterial[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [awaiting, setAwaiting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setAwaiting(false);
    api
      .studentCourseMaterials(slug)
      .then((r) => setMaterials(r.materials))
      .catch((err) => {
        if (err instanceof ApiError && err.code === "AWAITING_BATCH") {
          setAwaiting(true);
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load");
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (awaiting) return <AwaitingBatchNotice />;
  if (loading) return <p className="text-ink-muted">Loading…</p>;
  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (materials.length === 0) {
    return <p className="text-ink-muted">No materials uploaded yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {materials.map((m) => (
        <li
          key={m.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-elevated p-5"
        >
          <div>
            <h2 className="font-display text-lg font-semibold">{m.title}</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {m.fileName} · {formatBytes(m.sizeBytes)}
            </p>
          </div>
          <a
            href={m.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
          >
            Download
          </a>
        </li>
      ))}
    </ul>
  );
}
