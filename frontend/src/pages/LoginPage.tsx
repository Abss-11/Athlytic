import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { profileApi } from "../api/api";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { isValidEmail } from "../lib/validation";
import type { UserRole } from "../types";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { pushToast } = useToast();
  const [role, setRole] = useState<UserRole>("athlete");
  const [email, setEmail] = useState("demo@athlytic.app");
  const [password, setPassword] = useState("password123");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setEmail(role === "coach" ? "coach@athlytic.app" : "demo@athlytic.app");
    setPassword("password123");
  }, [role]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    try {
      await login(email, password, role);
      pushToast("Logged in successfully.", "success");
      if (role === "coach") {
        navigate("/coach");
        return;
      }

      try {
        const profileResponse = await profileApi.getMe();
        const hasEnoughProfileData = Boolean(profileResponse.data?.macroPlan?.hasEnoughProfileData);
        navigate(hasEnoughProfileData ? "/dashboard" : "/onboarding");
      } catch {
        navigate("/onboarding");
      }
    } catch (submissionError) {
      if (axios.isAxiosError(submissionError)) {
        setError(submissionError.response?.data?.message || "Unable to log in right now.");
        pushToast(submissionError.response?.data?.message || "Unable to log in right now.", "error");
      } else {
        setError("Unable to log in right now.");
        pushToast("Unable to log in right now.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-app px-4 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-6">
      <section className="panel-hero hidden min-h-[calc(100vh-3rem)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-white/62 [letter-spacing:0.16em]">Athlytic access</p>
          <h1 className="mt-4 max-w-2xl text-6xl font-bold leading-[1.02]">Return to your performance workspace.</h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/72">
            Jump back into training load, macros, sleep, running trends, and coach feedback without losing the day&apos;s context.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {["Readiness", "Fueling", "Training"].map((item) => (
            <div key={item} className="rounded-3xl border border-white/16 bg-white/10 p-4 backdrop-blur">
              <p className="text-sm text-white/62">{item}</p>
              <p className="mt-2 text-2xl font-bold">Live</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center py-6 lg:py-0">
        <Card className="w-full max-w-md p-8">
          <p className="field-label">Welcome back</p>
          <h2 className="mt-3 text-4xl font-bold text-app-text">Log into Athlytic</h2>
          <p className="mt-3 text-sm leading-7 text-app-text-soft">
            Choose an athlete or coach workspace. Demo credentials update automatically when you switch roles.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <Input type="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <div className="grid grid-cols-2 gap-3 rounded-3xl bg-app-surface-strong/70 p-1.5">
            <button
              type="button"
              onClick={() => setRole("athlete")}
              className={`focus-ring rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                role === "athlete" ? "bg-app-primary text-white shadow-lift" : "text-app-text-soft hover:text-app-text"
              }`}
            >
              Athlete
            </button>
            <button
              type="button"
              onClick={() => setRole("coach")}
              className={`focus-ring rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                role === "coach" ? "bg-app-accent text-slate-950 shadow-lift" : "text-app-text-soft hover:text-app-text"
              }`}
            >
              Coach
            </button>
          </div>
          {error ? <p className="text-sm text-app-danger">{error}</p> : null}
          <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>
          </form>

          <p className="mt-6 text-sm text-app-text-soft">
            New to Athlytic?{" "}
            <Link to="/signup" className="font-semibold text-app-primary">
              Create an account
            </Link>
          </p>
        </Card>
      </section>
    </div>
  );
}
