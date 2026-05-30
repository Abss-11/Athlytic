import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { dashboardApi } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Button from "../ui/Button";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: "⌁" },
  { label: "Workouts", path: "/workouts", icon: "▣" },
  { label: "Nutrition", path: "/nutrition", icon: "◒" },
  { label: "Running", path: "/running", icon: "↗" },
  { label: "Goals", path: "/goals", icon: "◎" },
  { label: "Community", path: "/community", icon: "✦" },
  { label: "Reports", path: "/reports", icon: "▤" },
  { label: "Integrations", path: "/integrations", icon: "◇" },
  { label: "Biomarkers", path: "/biomarkers", icon: "◌" },
  { label: "Profile", path: "/profile", icon: "●" },
];

export default function AppShell() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; type: string }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated && user?.role === "athlete") {
      dashboardApi.getNotifications().then(res => setNotifications(res.data)).catch(console.error);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-app">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-24 left-[8%] h-72 w-72 rounded-full bg-app-primary/14 blur-3xl" />
        <div className="absolute -right-24 top-[22%] h-72 w-72 rounded-full bg-app-accent/16 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col px-3 pb-4 pt-3 md:px-5 lg:flex-row lg:gap-5 lg:pb-6 lg:pt-5">
        <aside className="glass-panel mb-4 flex w-full flex-col gap-5 p-4 lg:sticky lg:top-5 lg:mb-0 lg:h-[calc(100vh-2.5rem)] lg:w-80 lg:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-app-primary to-app-accent text-lg font-black text-white shadow-lift">
                A
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-app-text-soft [letter-spacing:0.16em]">Athlytic</p>
                <h1 className="text-2xl font-bold text-app-text">Performance OS</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="focus-ring rounded-2xl border border-app-border bg-app-surface px-3 py-2 text-sm font-semibold text-app-text transition hover:-translate-y-0.5 hover:border-app-primary"
              aria-label="Toggle color theme"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
          </div>

          <div className="panel-hero hidden p-5 text-white sm:block">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase text-white/70 [letter-spacing:0.16em]">Current focus</p>
              <span className="rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-white/80 [letter-spacing:0.12em]">
                Build
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-bold">Spring Performance Block</h2>
            <p className="mt-3 text-sm leading-6 text-white/80">
              Stay sharp on protein, recovery, and running efficiency through race week.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="metric-chip border-white/20 bg-white/10 text-white/90">Sleep consistency</span>
              <span className="metric-chip border-white/20 bg-white/10 text-white/90">Progressive load</span>
            </div>
          </div>

          <nav className="-mx-1 flex gap-2 overflow-x-auto pb-1 lg:mx-0 lg:grid lg:overflow-visible lg:pb-0">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition lg:w-full ${
                    isActive
                      ? "bg-gradient-to-r from-app-primary to-app-primary-strong text-white shadow-soft"
                      : "text-app-text-soft hover:bg-app-surface-strong hover:text-app-text"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-xl text-xs transition ${
                        isActive ? "bg-white/16 text-app-accent" : "bg-app-surface-strong text-app-text-soft group-hover:text-app-primary"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
            <NavLink
              to="/coach"
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition lg:w-full ${
                  isActive
                    ? "bg-gradient-to-r from-app-accent to-app-accent-strong text-slate-950 shadow-soft"
                    : "text-app-text-soft hover:bg-app-surface-strong hover:text-app-text"
                }`
              }
            >
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-app-accent/16 text-app-accent">◈</span>
              Coach Portal
            </NavLink>
          </nav>

          <div className="mt-auto rounded-3xl border border-app-border/70 bg-app-surface-strong/80 p-5">
            <p className="text-xs font-semibold uppercase text-app-text-soft [letter-spacing:0.16em]">Logged in as</p>
            <h3 className="mt-2 text-lg font-semibold text-app-text">{user?.name ?? "Guest user"}</h3>
            <p className="text-sm text-app-text-soft">{user?.email ?? "guest@athlytic.app"}</p>
            <Button variant="secondary" className="mt-4 w-full" onClick={() => navigate("/reports")}>
              Weekly report ready
            </Button>
            <Button
              variant="ghost"
              className="mt-3 w-full"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Log out
            </Button>
          </div>
        </aside>

        <main className="flex-1">
          <div className="glass-panel flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden">
            <div className="relative z-50 border-b border-app-border/80 bg-app-surface/58 px-5 py-4 backdrop-blur md:px-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-app-text-soft">Athlete intelligence platform</p>
                  <h2 className="text-2xl font-bold text-app-text">Train smarter. Recover faster. Coach with context.</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="metric-chip">Live data</span>
                    <span className="metric-chip">Daily reset</span>
                    <span className="metric-chip">Coach-ready</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3" ref={notifRef}>
                  <div className="relative">
                    <Button variant="ghost" onClick={() => setShowNotifications(!showNotifications)} className="relative">
                      Alerts
                      {notifications.filter((n) => n.type !== "success").length > 0 && (
                        <span className="absolute right-1 top-1 flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-app-danger opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-app-danger" />
                        </span>
                      )}
                    </Button>
                    {showNotifications && (
                      <div className="absolute right-0 top-full z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-3xl border border-app-border bg-app-surface/95 p-4 shadow-lift backdrop-blur-xl">
                        <h3 className="mb-3 text-sm font-bold text-app-text">Alerts & Insights</h3>
                        <div className="flex flex-col gap-2">
                          {notifications.map((n) => (
                            <div key={n.id} className={`rounded-2xl border p-3 ${n.type === "warning" ? "border-app-danger/20 bg-app-danger/10" : n.type === "success" ? "border-app-success/20 bg-app-success/10" : "border-app-border bg-app-surface"}`}>
                              <p className={`text-sm font-semibold ${n.type === "warning" ? "text-app-danger" : n.type === "success" ? "text-app-success" : "text-app-text"}`}>{n.title}</p>
                              <p className="text-xs mt-1 text-app-text-soft">{n.message}</p>
                            </div>
                          ))}
                          {notifications.length === 0 && <p className="text-xs text-app-text-soft">No new notifications.</p>}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button>Sync metrics</Button>
                </div>
              </div>
            </div>
            <div className="px-5 py-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
