import { useEffect, useState } from "react";
import { api, type MarketingTrainer, ApiError } from "@/lib/api";

export function TrainersPage() {
  const [trainers, setTrainers] = useState<MarketingTrainer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listPublicTrainers()
      .then((r) => setTrainers(r.trainers))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed"));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Trainers</h1>
      <p className="mt-2 text-ink-muted">Meet our teaching team.</p>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {trainers.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-border bg-surface-elevated p-5"
          >
            {t.photoUrl ? (
              <img
                src={t.photoUrl}
                alt=""
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-gray font-display text-2xl">
                {t.fullName.slice(0, 1)}
              </div>
            )}
            <h2 className="mt-4 font-display text-xl font-semibold">{t.fullName}</h2>
            {t.title ? <p className="text-sm text-accent">{t.title}</p> : null}
            {t.bio ? <p className="mt-2 text-sm text-ink-muted">{t.bio}</p> : null}
          </div>
        ))}
      </div>
      {!error && trainers.length === 0 ? (
        <p className="mt-6 text-ink-muted">Trainer profiles coming soon.</p>
      ) : null}
    </div>
  );
}
