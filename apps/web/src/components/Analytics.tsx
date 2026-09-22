import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const GA_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID || "").trim();
const GSC = (import.meta.env.VITE_GSC_VERIFICATION || "").trim();

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function ensureGtag(id: string) {
  if (typeof window === "undefined" || window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", id, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

/** Loads gtag when VITE_GA_MEASUREMENT_ID is set; tracks SPA route changes. */
export function Analytics() {
  const location = useLocation();

  useEffect(() => {
    if (!GA_ID) return;
    ensureGtag(GA_ID);
  }, []);

  useEffect(() => {
    if (!GA_ID || !window.gtag) return;
    window.gtag("event", "page_view", {
      page_path: `${location.pathname}${location.search}`,
      page_title: document.title,
    });
  }, [location.pathname, location.search]);

  return GSC ? (
    <Helmet>
      <meta name="google-site-verification" content={GSC} />
    </Helmet>
  ) : null;
}
