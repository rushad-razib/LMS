import { NavLink, Outlet } from "react-router-dom";
import { ThemeRoot } from "@/components/ThemeRoot";
import { useAuth } from "@/features/auth/AuthProvider";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/courses", label: "Courses" },
];

export function MarketingLayout() {
  const { user, logout } = useAuth();

  return (
    <ThemeRoot theme="light">
      <div className="min-h-screen bg-surface text-ink">
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
            <span>Theme tokens adjustable in tokens.css</span>
          </div>
        </footer>
      </div>
    </ThemeRoot>
  );
}
