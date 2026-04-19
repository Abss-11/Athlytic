import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { dashboardApi } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Button from "../ui/Button";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Workouts", path: "/workouts" },
  { label: "Nutrition", path: "/nutrition" },
  { label: "Running", path: "/running" },
  { label: "Goals", path: "/goals" },
  { label: "Community", path: "/community" },
  { label: "Reports", path: "/reports" },
  { label: "Integrations", path: "/integrations" },
  { label: "Biomarkers", path: "/biomarkers" },
  { label: "Profile", path: "/profile" },
];

export default function AppShell() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState<{id: string, title: string, message: string, type: string}[]>([]);
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
        <div className="absolute -top-24 left-[8%] h-72 w-72 rounded-full bg-app-primary/15 blur-3xl" />
        <div className="absolute -right-24 top-[22%] h-72 w-72 rounded-full bg-app-accent/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-6 pt-4 md:px-6 lg:flex-row lg:gap-6">
        <aside className="glass-panel mb-4 flex w-full flex-col gap-6 p-5 lg:sticky lg:top-4 lg:mb-0 lg:h-[calc(100vh-2rem)] lg:w-80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-app-text-soft">Athlytic</p>
              <h1 className="text-2xl font-bold text-app-text">Performance OS</h1>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-2xl border border-app-border bg-app-surface px-3 py-2 text-sm font-semibold text-app-text transition hover:-translate-y-0.5 hover:border-app-primary"
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>

          <div className="panel-hero p-5 text-white">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/70">Current focus</p>
              <span className="rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">
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

          <nav className="grid gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-gradient-to-r from-app-primary to-app-primary-strong text-white shadow-soft"
                      : "text-app-text-soft hover:bg-app-surface-strong hover:text-app-text"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`h-1.5 w-1.5 rounded-full transition ${
                        isActive ? "bg-app-accent shadow-[0_0_14px_rgba(145,255,110,0.9)]" : "bg-app-border group-hover:bg-app-primary"
                      }`}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
            <NavLink
              to="/coach"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-gradient-to-r from-app-accent to-app-accent-strong text-slate-950 shadow-soft"
                    : "text-app-text-soft hover:bg-app-surface-strong hover:text-app-text"
                }`
              }
            >
              <span className="h-1.5 w-1.5 rounded-full bg-app-accent shadow-[0_0_10px_rgba(145,255,110,0.7)]" />
              Coach Portal
            </NavLink>
          </nav>

          <div className="mt-auto rounded-3xl border border-app-border/70 bg-app-surface-strong/90 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-app-text-soft">Logged in as</p>
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
          <div className="glass-panel min-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
            <div className="relative z-50 border-b border-app-border/80 bg-app-surface/55 px-5 py-4 backdrop-blur md:px-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-app-text-soft">Athlete intelligence platform</p>
                  <h2 className="text-2xl font-bold text-app-text">Train smarter. Recover faster. Coach better.</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="metric-chip">Live data</span>
                    <span className="metric-chip">Daily reset</span>
                    <span className="metric-chip">Coach-ready</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 items-center" ref={notifRef}>
                  <div className="relative">
                    <Button variant="ghost" onClick={() => setShowNotifications(!showNotifications)} className="relative">
                      Notifications
                      {notifications.filter(n => n.type !== 'success').length > 0 && (
                        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-app-danger opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-app-danger"></span>
                        </span>
                      )}
                    </Button>
                    {showNotifications && (
                      <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-app-border bg-app-surface-strong p-4 shadow-xl z-50 max-h-96 overflow-y-auto">
                        <h3 className="text-sm font-bold text-app-text mb-3">Alerts & Insights</h3>
                        <div className="flex flex-col gap-2">
                          {notifications.map(n => (
                            <div key={n.id} className={`p-3 rounded-xl border ${n.type === 'warning' ? 'bg-app-danger/10 border-app-danger/20' : n.type === 'success' ? 'bg-app-primary/10 border-app-primary/20' : 'bg-app-surface border-app-border'}`}>
                              <p className={`font-semibold text-sm ${n.type === 'warning' ? 'text-app-danger' : n.type === 'success' ? 'text-app-primary' : 'text-app-text'}`}>{n.title}</p>
                              <p className="text-xs mt-1 text-app-text-soft">{n.message}</p>
                            </div>
                          ))}
                          {notifications.length === 0 && <p className="text-xs text-app-text-soft">No new notifications.</p>}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button>Sync today&apos;s metrics</Button>
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
