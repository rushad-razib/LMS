import { NavLink, Outlet } from "react-router-dom";
import { ThemeRoot } from "@/components/ThemeRoot";

const links = [
  { to: "/student", label: "Dashboard", end: true },
  { to: "/student/courses", label: "My Courses" },
  { to: "/student/profile", label: "Profile" },
];

export function StudentLayout() {
  return (
    <ThemeRoot theme="light">
      <div className="min-h-screen bg-surface text-ink">
        <header className="border-b border-border bg-surface-elevated">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Student portal
              </p>
              <p className="font-display font-semibold">AR Visionary Academy</p>
            </div>
            <nav className="flex flex-wrap gap-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    [
                      "rounded-lg px-3 py-2 text-sm font-medium",
                      isActive
                        ? "bg-accent text-accent-fg"
                        : "text-ink-muted hover:bg-brand-gray hover:text-ink",
                    ].join(" ")
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <NavLink
                to="/"
                className="rounded-lg px-3 py-2 text-sm text-ink-muted hover:text-ink"
              >
                Site
              </NavLink>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <Outlet />
        </main>
      </div>
    </ThemeRoot>
  );
}
