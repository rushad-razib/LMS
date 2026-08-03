import { NavLink, Outlet } from "react-router-dom";
import { ThemeRoot } from "@/components/ThemeRoot";

export type DashboardNavItem = {
  to: string;
  label: string;
  end?: boolean;
};

type DashboardLayoutProps = {
  portal: "admin" | "teacher";
  title: string;
  nav: DashboardNavItem[];
};

export function DashboardLayout({ portal, title, nav }: DashboardLayoutProps) {
  return (
    <ThemeRoot theme="dark">
      <div className="flex min-h-screen bg-surface text-ink">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-surface-elevated md:flex md:flex-col">
          <div className="border-b border-border px-4 py-5">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              {portal} panel
            </p>
            <p className="font-display text-lg font-semibold">{title}</p>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "rounded-lg px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-accent text-accent-fg"
                      : "text-ink-muted hover:bg-surface hover:text-ink",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-border p-3 text-xs text-ink-muted">
            Shared dark shell · Phase 0
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border bg-surface-elevated px-4 py-3 md:px-6">
            <p className="font-display font-semibold md:hidden">{title}</p>
            <p className="text-sm text-ink-muted">AR Visionary Academy</p>
            <NavLink to="/" className="text-sm text-accent hover:underline">
              View site
            </NavLink>
          </header>

          <div className="flex gap-1 overflow-x-auto border-b border-border p-2 md:hidden">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "whitespace-nowrap rounded-lg px-3 py-2 text-sm",
                    isActive ? "bg-accent text-accent-fg" : "text-ink-muted",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ThemeRoot>
  );
}
