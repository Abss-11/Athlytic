import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const AthleteDashboardPage = lazy(() => import("./pages/AthleteDashboardPage"));
const CoachDashboardPage = lazy(() => import("./pages/CoachDashboardPage"));
const NutritionPage = lazy(() => import("./pages/NutritionPage"));
const WorkoutPage = lazy(() => import("./pages/WorkoutPage"));
const RunningPage = lazy(() => import("./pages/RunningPage"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-app text-sm font-medium text-app-text-soft">
          Loading Athlytic...
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<RegisterPage />} />

        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<AthleteDashboardPage />} />
          <Route path="/coach" element={<CoachDashboardPage />} />
          <Route path="/nutrition" element={<NutritionPage />} />
          <Route path="/workouts" element={<WorkoutPage />} />
          <Route path="/running" element={<RunningPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
