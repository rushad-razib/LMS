import { useEffect, useState } from "react";
import { api, type GalleryItem, ApiError } from "@/lib/api";

export function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listPublicGallery()
      .then((r) => setItems(r.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed"));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Gallery</h1>
      <p className="mt-2 text-ink-muted">Moments from our academy.</p>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <figure key={item.id} className="overflow-hidden rounded-xl border border-border">
            <img src={item.imageUrl} alt={item.title ?? ""} className="h-56 w-full object-cover" />
            {item.title ? (
              <figcaption className="p-3 text-sm text-ink-muted">{item.title}</figcaption>
            ) : null}
          </figure>
        ))}
      </div>
      {!error && items.length === 0 ? (
        <p className="mt-6 text-ink-muted">Gallery coming soon.</p>
      ) : null}
    </div>
  );
}
