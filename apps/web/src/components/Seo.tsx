import { Helmet } from "react-helmet-async";
import {
  absoluteUrl,
  DEFAULT_DESCRIPTION,
  SITE_NAME,
} from "@/lib/site";

type SeoProps = {
  title?: string;
  description?: string;
  path?: string;
  noindex?: boolean;
  image?: string | null;
};

export function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  noindex = false,
  image,
}: SeoProps) {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  const canonical = absoluteUrl(path);
  const ogImage = image || undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex ? (
        <meta name="robots" content="noindex,nofollow" />
      ) : (
        <meta name="robots" content="index,follow" />
      )}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}
      <meta name="twitter:card" content={ogImage ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
    </Helmet>
  );
}
