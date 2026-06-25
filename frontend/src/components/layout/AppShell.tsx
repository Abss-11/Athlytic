import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { dashboardApi, runningApi } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useBillingPlan } from "../../lib/plans";
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
  const { plan, isPro } = useBillingPlan();

  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; type: string }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStats, setReportStats] = useState<{
    totalKm: number;
    avgPace: string;
    activeDay: string;
  } | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleOpenReport = async () => {
    setShowReportModal(true);
    setIsGeneratingReport(true);
    try {
      const response = await runningApi.list();
      const runs = Array.isArray(response.data) ? response.data : [];
      
      if (runs.length === 0) {
        setReportStats({
          totalKm: 0,
          avgPace: "N/A",
          activeDay: "None (no runs yet)"
        });
        return;
      }

      // Calculate Total Km
      const totalKm = runs.reduce((sum: number, run: any) => sum + (run.distanceKm ?? 0), 0);
      
      // Calculate Average Pace
      let totalSeconds = 0;
      let count = 0;
      runs.forEach((run: any) => {
        if (!run.pace) return;
        const match = run.pace.match(/(\d+):(\d+)/);
        if (match) {
          const mins = parseInt(match[1], 10);
          const secs = parseInt(match[2], 10);
          totalSeconds += mins * 60 + secs;
          count++;
        } else {
          const decimal = parseFloat(run.pace);
          if (Number.isFinite(decimal) && decimal > 0) {
            totalSeconds += decimal * 60;
            count++;
          }
        }
      });
      
      let avgPace = "N/A";
      if (count > 0) {
        const avgSeconds = totalSeconds / count;
        const mins = Math.floor(avgSeconds / 60);
        const secs = Math.round(avgSeconds % 60);
        avgPace = `${mins}:${secs < 10 ? "0" : ""}${secs} /km`;
      }

      // Calculate Most Active Day
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const counts: Record<string, number> = {};
      runs.forEach((run: any) => {
        const date = run.loggedAt || run.createdAt;
        if (date) {
          const dayName = days[new Date(date).getDay()];
          counts[dayName] = (counts[dayName] || 0) + 1;
        }
      });

      let activeDay = "None";
      let maxCount = 0;
      Object.entries(counts).forEach(([day, countVal]) => {
        if (countVal > maxCount) {
          maxCount = countVal;
          activeDay = day;
        }
      });

      if (activeDay === "None" && runs.length > 0) {
        activeDay = "Monday";
      }

      setReportStats({
        totalKm: Math.round(totalKm * 10) / 10,
        avgPace,
        activeDay
      });
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

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
            <div className="mt-4 rounded-2xl border border-app-border/70 bg-app-surface px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-app-text-soft">Plan</p>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${isPro ? "bg-app-accent/16 text-app-accent" : "bg-app-primary/12 text-app-primary"}`}>
                  {isPro ? "Pro" : "Free"}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-app-text">{plan.name}</p>
            </div>
            <Button
              variant="secondary"
              className="mt-4 w-full"
              onClick={() => {
                if (isPro) {
                  void handleOpenReport();
                  return;
                }
                navigate("/profile");
              }}
            >
              {isPro ? "Weekly report ready" : "Unlock weekly reports"}
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

      {/* Weekly Performance Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md border border-app-border/40 bg-app-surface/95 p-6 shadow-soft md:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-app-border/40 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-app-accent font-semibold">Weekly Report</p>
                <h3 className="text-2xl font-bold text-app-text mt-1">Weekly Summary</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="rounded-xl border border-app-border bg-app-surface px-3 py-1.5 text-xs font-semibold text-app-text transition hover:border-app-danger"
              >
                Close
              </button>
            </div>

            {isGeneratingReport ? (
              <div className="flex flex-col items-center justify-center py-8">
                <span className="animate-spin h-8 w-8 border-4 border-app-primary border-t-transparent rounded-full mb-3"></span>
                <p className="text-sm text-app-text-soft">Compiling performance database...</p>
              </div>
            ) : reportStats ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-app-border/40 bg-app-surface-strong/60 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-app-text-soft">Total Distance</p>
                    <p className="mt-1 text-2xl font-bold text-app-primary">{reportStats.totalKm} km</p>
                  </div>
                  <span className="text-3xl">🏃‍♂️</span>
                </div>

                <div className="rounded-2xl border border-app-border/40 bg-app-surface-strong/60 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-app-text-soft">Average Pace</p>
                    <p className="mt-1 text-2xl font-bold text-app-accent">{reportStats.avgPace}</p>
                  </div>
                  <span className="text-3xl">⚡</span>
                </div>

                <div className="rounded-2xl border border-app-border/40 bg-app-surface-strong/60 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-app-text-soft">Most Active Day</p>
                    <p className="mt-1 text-2xl font-bold text-app-text">{reportStats.activeDay}</p>
                  </div>
                  <span className="text-3xl">📅</span>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-app-primary/10 to-app-accent/10 border border-app-border/40 p-4">
                  <p className="text-sm font-semibold text-app-text">Performance Insight</p>
                  <p className="mt-1.5 text-xs text-app-text-soft leading-5">
                    {reportStats.totalKm > 0 
                      ? `Fantastic work this week! Your runs on ${reportStats.activeDay}s are driving your cardiovascular gains. Maintain your pace of ${reportStats.avgPace} as you dial in your training block.`
                      : "Start logging your running sessions to generate personalized weekly insights and see your metrics compile here!"
                    }
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
