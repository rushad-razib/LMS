/** Canonical public origin for SEO (sitemap, canonical links). */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://lms.rushadrazib.com"
).replace(/\/$/, "");

export const SITE_NAME = "AR Visionary Academy";

export const DEFAULT_DESCRIPTION =
  "Practical training in AI, Computer Skills, Web Development, Graphic Design, IELTS, and Freelancing.";

export function absoluteUrl(path: string): string {
  if (!path || path === "/") return SITE_URL;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}
