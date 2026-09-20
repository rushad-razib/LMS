import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type BlogPost, ApiError } from "@/lib/api";

export function BlogDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    api
      .getPublicBlog(slug)
      .then((r) => setPost(r.post))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed"));
  }, [slug]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-red-600">{error}</p>
        <Link to="/blog" className="mt-4 inline-block text-accent">
          Back to blog
        </Link>
      </div>
    );
  }

  if (!post) {
    return <p className="mx-auto max-w-3xl px-4 py-12 text-ink-muted">Loading…</p>;
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link to="/blog" className="text-sm text-accent">
        ← Blog
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold">{post.title}</h1>
      {post.publishedAt ? (
        <p className="mt-2 text-sm text-ink-muted">
          {new Date(post.publishedAt).toLocaleDateString()}
        </p>
      ) : null}
      {post.coverImageUrl ? (
        <img
          src={post.coverImageUrl}
          alt=""
          className="mt-6 max-h-80 w-full rounded-xl object-cover"
        />
      ) : null}
      <div
        className="prose prose-neutral mt-8 max-w-none"
        dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
      />
    </article>
  );
}
