import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { APP_NAME } from "@arva/shared";

export function HomePage() {
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/v1/health")
      .then((r) => r.json())
      .then((data) => setApiOk(Boolean(data?.ok)))
      .catch(() => setApiOk(false));
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.12),_transparent_55%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">
          {APP_NAME}
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-tight text-ink md:text-5xl">
          Build Future-Ready Skills with AR Visionary Academy
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-muted">
          Practical training in AI, Computer Skills, Web Development, Graphic Design,
          IELTS, and Freelancing.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/courses"
            className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-fg"
          >
            Explore Courses
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-border bg-surface-elevated px-5 py-3 text-sm font-semibold text-ink"
          >
            Register
          </Link>
        </div>
        <p className="mt-10 text-sm text-ink-muted">
          API health:{" "}
          {apiOk === null ? "checking…" : apiOk ? "connected" : "offline (start api)"}
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link className="text-accent hover:underline" to="/admin">
            Admin shell
          </Link>
          <Link className="text-accent hover:underline" to="/teacher">
            Teacher shell
          </Link>
          <Link className="text-accent hover:underline" to="/student">
            Student shell
          </Link>
        </div>
      </div>
    </section>
  );
}
