import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ThemeRoot } from "@/components/ThemeRoot";
import { useAuth } from "@/features/auth/AuthProvider";
import { api, type PublicWebsiteSettings } from "@/lib/api";
import { SITE_NAME } from "@/lib/site";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/courses", label: "Courses" },
  { to: "/trainers", label: "Trainers" },
  { to: "/gallery", label: "Gallery" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

function brandName(settings: PublicWebsiteSettings | null) {
  return settings?.siteName?.trim() || SITE_NAME;
}

function defaultCopyright(settings: PublicWebsiteSettings | null) {
  if (settings?.footerCopyright?.trim()) return settings.footerCopyright.trim();
  return `© ${new Date().getFullYear()} ${brandName(settings)} · AR Ventures`;
}

export function MarketingLayout() {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<PublicWebsiteSettings | null>(null);

  useEffect(() => {
    api
      .getPublicSettings()
      .then((r) => setSettings(r.settings))
      .catch(() => setSettings(null));
  }, []);

  const name = brandName(settings);

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
            <NavLink
              to="/"
              className="flex items-center gap-2 font-display text-lg font-semibold text-ink"
            >
              {settings?.headerLogoUrl ? (
                <img
                  src={settings.headerLogoUrl}
                  alt={name}
                  className="h-9 w-auto max-w-50 object-contain"
                />
              ) : (
                name
              )}
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
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-ink-muted md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              {settings?.footerLogoUrl ? (
                <img
                  src={settings.footerLogoUrl}
                  alt={name}
                  className="h-8 w-auto max-w-40 object-contain"
                />
              ) : null}
              <span>{defaultCopyright(settings)}</span>
            </div>
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
