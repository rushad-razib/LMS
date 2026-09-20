import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type BlogPost, ApiError } from "@/lib/api";

export function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listPublicBlog()
      .then((r) => setPosts(r.posts))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed"));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Blog</h1>
      <p className="mt-2 text-ink-muted">News and insights from AR Visionary Academy.</p>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.id}
            to={`/blog/${post.slug}`}
            className="block overflow-hidden rounded-xl border border-border bg-surface-elevated transition hover:border-accent"
          >
            {post.coverImageUrl ? (
              <img
                src={post.coverImageUrl}
                alt=""
                className="h-44 w-full object-cover"
              />
            ) : null}
            <div className="p-4">
              <h2 className="font-display text-xl font-semibold">{post.title}</h2>
              <p className="mt-2 text-sm text-ink-muted line-clamp-3">{post.excerpt}</p>
            </div>
          </Link>
        ))}
        {!error && posts.length === 0 ? (
          <p className="text-ink-muted">No posts published yet.</p>
        ) : null}
      </div>
    </div>
  );
}
