import { Link, useSearchParams } from "react-router-dom";
import { Seo } from "@/components/Seo";

type Kind = "success" | "fail" | "cancel";

const copy: Record<
  Kind,
  { title: string; body: string; tone: string }
> = {
  success: {
    title: "Payment received",
    body: "If payment succeeded, your enrollment is being confirmed. An admin will assign your batch next.",
    tone: "text-emerald-700",
  },
  fail: {
    title: "Payment failed",
    body: "The payment did not complete. You can try again from the course page.",
    tone: "text-red-600",
  },
  cancel: {
    title: "Payment cancelled",
    body: "You cancelled the payment. No charge was completed.",
    tone: "text-ink-muted",
  },
};

export function CheckoutResultPage({ kind }: { kind: Kind }) {
  const [params] = useSearchParams();
  const tranId = params.get("tran_id");
  const c = copy[kind];

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <Seo title={c.title} path={`/checkout/${kind}`} noindex />
      <h1 className={`font-display text-3xl font-bold ${c.tone}`}>{c.title}</h1>
      <p className="mt-3 text-ink-muted">{c.body}</p>
      {tranId ? (
        <p className="mt-2 text-xs text-ink-muted">Reference: {tranId}</p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/student"
          className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-fg"
        >
          Student portal
        </Link>
        <Link
          to="/courses"
          className="rounded-lg border border-border bg-surface-elevated px-5 py-3 text-sm font-semibold"
        >
          Browse courses
        </Link>
      </div>
    </div>
  );
}
