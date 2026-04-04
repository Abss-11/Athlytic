import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
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
  { label: "Profile", path: "/profile" },
];

export default function AppShell() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-6 pt-4 md:px-6 lg:flex-row lg:gap-6">
        <aside className="glass-panel mb-4 flex w-full flex-col gap-6 p-5 lg:sticky lg:top-4 lg:mb-0 lg:h-[calc(100vh-2rem)] lg:w-80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-app-text-soft">Athlytic</p>
              <h1 className="text-2xl font-bold text-app-text">Performance OS</h1>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-2xl border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text transition hover:border-app-primary"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-app-primary via-app-primary-strong to-slate-950 p-5 text-white">
            <p className="text-sm text-white/70">Current focus</p>
            <h2 className="mt-2 text-2xl font-bold">Spring Performance Block</h2>
            <p className="mt-3 text-sm leading-6 text-white/75">
              Stay sharp on protein, recovery, and running efficiency through race week.
            </p>
          </div>

          <nav className="grid gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-app-primary text-white shadow-soft"
                      : "text-app-text-soft hover:bg-app-surface-strong hover:text-app-text"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/coach"
              className={({ isActive }) =>
                `rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-app-accent text-slate-950 shadow-soft"
                    : "text-app-text-soft hover:bg-app-surface-strong hover:text-app-text"
                }`
              }
            >
              Coach Portal
            </NavLink>
          </nav>

          <div className="mt-auto rounded-3xl bg-app-surface-strong p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-app-text-soft">Logged in as</p>
            <h3 className="mt-2 text-lg font-semibold text-app-text">{user?.name ?? "Guest user"}</h3>
            <p className="text-sm text-app-text-soft">{user?.email ?? "guest@athlytic.app"}</p>
            <Button variant="secondary" className="mt-4 w-full">
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
          <div className="glass-panel min-h-[calc(100vh-2rem)] overflow-hidden">
            <div className="border-b border-app-border px-5 py-4 md:px-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-app-text-soft">Athlete intelligence platform</p>
                  <h2 className="text-2xl font-bold text-app-text">Train smarter. Recover faster. Coach better.</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="ghost">Notifications</Button>
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
