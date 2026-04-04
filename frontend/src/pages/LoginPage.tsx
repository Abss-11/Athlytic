import { useEffect, useState } from "react";
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
      navigate(role === "coach" ? "/coach" : "/dashboard");
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
    <div className="flex min-h-screen items-center justify-center bg-app px-4 py-8">
      <Card className="w-full max-w-md p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-app-text-soft">Welcome back</p>
        <h1 className="mt-3 text-4xl font-bold text-app-text">Log into Athlytic</h1>
        <p className="mt-3 text-sm leading-7 text-app-text-soft">
          Secure JWT-based authentication flow for athletes and coaches.
        </p>
        <p className="mt-2 text-sm text-app-text-soft">
          Demo credentials switch with role: athlete uses `demo@athlytic.app`, coach uses `coach@athlytic.app`.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <Input type="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("athlete")}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                role === "athlete" ? "bg-app-primary text-white" : "bg-app-surface-strong text-app-text"
              }`}
            >
              Athlete
            </button>
            <button
              type="button"
              onClick={() => setRole("coach")}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                role === "coach" ? "bg-app-accent text-slate-950" : "bg-app-surface-strong text-app-text"
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
    </div>
  );
}
