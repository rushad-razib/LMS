import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ThemeRoot } from "@/components/ThemeRoot";
import { useAuth } from "@/features/auth/AuthProvider";
import { api, type PublicWebsiteSettings } from "@/lib/api";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/courses", label: "Courses" },
  { to: "/trainers", label: "Trainers" },
  { to: "/gallery", label: "Gallery" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

export function MarketingLayout() {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<PublicWebsiteSettings | null>(null);

  useEffect(() => {
    api
      .getPublicSettings()
      .then((r) => setSettings(r.settings))
      .catch(() => setSettings(null));
  }, []);

  return (
    <ThemeRoot theme="light">
      <div className="min-h-screen bg-surface text-ink">
        {settings?.announcementBar ? (
          <div className="bg-accent px-4 py-2 text-center text-sm font-medium text-accent-fg">
            {settings.announcementBar}
          </div>
        ) : null}
        <header className="sticky top-0 z-40 border-b border-border bg-surface-elevated/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <NavLink to="/" className="font-display text-lg font-semibold text-ink">
              AR Visionary Academy
            </NavLink>
            <nav className="flex flex-wrap items-center gap-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    [
                      "rounded-lg px-3 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-accent text-accent-fg"
                        : "text-ink-muted hover:bg-brand-gray hover:text-ink",
                    ].join(" ")
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              {user ? (
                <>
                  <NavLink
                    to={
                      user.role === "ADMIN"
                        ? "/admin"
                        : user.role === "TEACHER"
                          ? "/teacher"
                          : "/student"
                    }
                    className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:text-ink"
                  >
                    Portal
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:text-ink"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:text-ink"
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
                  >
                    Register
                  </NavLink>
                </>
              )}
            </nav>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
        <footer className="mt-16 border-t border-border bg-surface-elevated">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-ink-muted md:flex-row md:justify-between">
            <span>© {new Date().getFullYear()} AR Visionary Academy · AR Ventures</span>
            <span className="flex flex-wrap gap-3">
              <NavLink to="/privacy" className="hover:text-ink">
                Privacy
              </NavLink>
              <NavLink to="/terms" className="hover:text-ink">
                Terms
              </NavLink>
              <NavLink to="/faq" className="hover:text-ink">
                FAQ
              </NavLink>
            </span>
          </div>
        </footer>
      </div>
    </ThemeRoot>
  );
}
