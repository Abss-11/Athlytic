import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { isValidEmail } from "../lib/validation";
import type { UserRole } from "../types";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { pushToast } = useToast();
  const [role, setRole] = useState<UserRole>("athlete");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    sport: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!form.name.trim()) {
      setError("Enter your name to create an account.");
      setIsSubmitting(false);
      return;
    }

    if (!isValidEmail(form.email)) {
      setError("Enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      setIsSubmitting(false);
      return;
    }

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        sport: form.sport,
      });
      pushToast("Account created successfully.", "success");
      navigate(role === "coach" ? "/coach" : "/onboarding");
    } catch (submissionError) {
      if (axios.isAxiosError(submissionError)) {
        setError(submissionError.response?.data?.message || "Unable to create your account.");
        pushToast(submissionError.response?.data?.message || "Unable to create your account.", "error");
      } else {
        setError("Unable to create your account.");
        pushToast("Unable to create your account.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-app px-4 py-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-6">
      <section className="hidden items-center lg:flex">
        <div className="max-w-xl">
          <p className="field-label">Start your workspace</p>
          <h1 className="mt-4 text-6xl font-bold leading-[1.02] text-app-text">Set up the system behind your next training block.</h1>
          <p className="mt-5 text-base leading-8 text-app-text-soft">
            Create an athlete or coach account, then complete onboarding to activate personalized targets and dashboards.
          </p>
          <div className="mt-8 grid gap-3">
            {["Profile and macro personalization", "Daily performance dashboard", "Coach-ready athlete notes"].map((item) => (
              <div key={item} className="surface-tile font-semibold text-app-text">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center">
      <Card className="w-full max-w-xl p-8">
        <p className="field-label">Create account</p>
        <h2 className="mt-3 text-4xl font-bold text-app-text">Join Athlytic</h2>
        <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="Full name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <Input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
            <Input
              placeholder="Primary sport / team"
              value={form.sport}
              onChange={(event) => setForm((current) => ({ ...current, sport: event.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-3xl bg-app-surface-strong/70 p-1.5">
            <button
              type="button"
              onClick={() => setRole("athlete")}
              className={`focus-ring rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                role === "athlete" ? "bg-app-primary text-white shadow-lift" : "text-app-text-soft hover:text-app-text"
              }`}
            >
              Athlete account
            </button>
            <button
              type="button"
              onClick={() => setRole("coach")}
              className={`focus-ring rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                role === "coach" ? "bg-app-accent text-slate-950 shadow-lift" : "text-app-text-soft hover:text-app-text"
              }`}
            >
              Coach account
            </button>
          </div>
          {error ? <p className="text-sm text-app-danger">{error}</p> : null}
          <Button variant="secondary" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-app-text-soft">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-app-primary">
            Log in
          </Link>
        </p>
      </Card>
      </section>
    </div>
  );
}
