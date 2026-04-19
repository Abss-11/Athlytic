import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { profileApi } from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { MacroPlan } from "../types";

type OnboardingForm = {
  age: string;
  weight: string;
  height: string;
  sex: string;
  activityLevel: string;
  goalType: string;
  dietaryPreference: string;
  allergies: string;
  recentIllness: string;
  recentInjuries: string;
};

const selectClassName =
  "w-full rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-sm text-app-text outline-none transition focus:border-app-primary focus:ring-4 focus:ring-app-primary/15";
const textareaClassName =
  "w-full rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-sm text-app-text outline-none transition placeholder:text-app-text-soft focus:border-app-primary focus:ring-4 focus:ring-app-primary/15";

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, replaceUser } = useAuth();
  const { pushToast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [macroPlan, setMacroPlan] = useState<MacroPlan | null>(null);
  const [form, setForm] = useState<OnboardingForm>({
    age: "",
    weight: "",
    height: "",
    sex: "other",
    activityLevel: "moderate",
    goalType: "maintenance",
    dietaryPreference: "none",
    allergies: "",
    recentIllness: "",
    recentInjuries: "",
  });

  useEffect(() => {
    async function load() {
      if (user?.role === "coach") {
        navigate("/coach", { replace: true });
        return;
      }

      try {
        const response = await profileApi.getMe();
        const nextUser = response.data.user;
        const nextMacroPlan = response.data.macroPlan as MacroPlan;
        replaceUser(nextUser);
        setMacroPlan(nextMacroPlan);
        setForm({
          age: nextUser.profile?.age ? String(nextUser.profile.age) : "",
          weight: nextUser.profile?.weight ? String(nextUser.profile.weight) : "",
          height: nextUser.profile?.height ? String(nextUser.profile.height) : "",
          sex: nextUser.profile?.sex || "other",
          activityLevel: nextUser.profile?.activityLevel || "moderate",
          goalType: nextUser.profile?.goalType || "maintenance",
          dietaryPreference: nextUser.profile?.dietaryPreference || "none",
          allergies: Array.isArray(nextUser.profile?.allergies) ? nextUser.profile.allergies.join(", ") : "",
          recentIllness: nextUser.profile?.recentIllness || "",
          recentInjuries: nextUser.profile?.recentInjuries || "",
        });
      } catch (error) {
        if (axios.isAxiosError(error)) {
          pushToast(error.response?.data?.message || "Could not load onboarding profile.", "error");
        } else {
          pushToast("Could not load onboarding profile.", "error");
        }
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [navigate, pushToast, replaceUser, user?.role]);

  function handleNext() {
    if (step === 1) {
      if (!form.age || !form.weight || !form.height) {
        pushToast("Age, weight, and height are required to continue.", "error");
        return;
      }
    }

    setStep((current) => Math.min(3, current + 1));
  }

  function handleBack() {
    setStep((current) => Math.max(1, current - 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        profile: {
          age: parseNumber(form.age),
          weight: parseNumber(form.weight),
          height: parseNumber(form.height),
          sex: form.sex,
          activityLevel: form.activityLevel,
          goalType: form.goalType,
          dietaryPreference: form.dietaryPreference,
          allergies: form.allergies
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean),
          recentIllness: form.recentIllness.trim(),
          recentInjuries: form.recentInjuries.trim(),
        },
      };

      const response = await profileApi.updateMe(payload);
      replaceUser(response.data.user);
      setMacroPlan(response.data.macroPlan as MacroPlan);
      pushToast("Onboarding complete. Personalized plan is now active.", "success");
      navigate("/dashboard");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        pushToast(error.response?.data?.message || "Could not save onboarding data.", "error");
      } else {
        pushToast("Could not save onboarding data.", "error");
      }
    } finally {
      setIsSaving(false);
    }
  }

  const progressPercent = Math.round((step / 3) * 100);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Card>
        <p className="text-sm uppercase tracking-[0.24em] text-app-text-soft">Athlete onboarding</p>
        <h1 className="mt-3 text-3xl font-bold text-app-text">Set up your performance profile</h1>
        <p className="mt-3 text-sm text-app-text-soft">
          We use this to personalize your daily macros, hydration, sleep, and running targets.
        </p>

        <div className="mt-5 rounded-2xl bg-app-surface-strong p-4">
          <div className="mb-2 flex items-center justify-between text-sm text-app-text-soft">
            <span>
              Step {step} of 3
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-app-surface">
            <div className="h-2 rounded-full bg-app-primary transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {isLoading ? <p className="mt-6 text-sm text-app-text-soft">Loading your profile...</p> : null}

        {!isLoading ? (
          <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
            {step === 1 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  type="number"
                  placeholder="Age"
                  value={form.age}
                  onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Weight (kg)"
                  value={form.weight}
                  onChange={(event) => setForm((current) => ({ ...current, weight: event.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Height (cm)"
                  value={form.height}
                  onChange={(event) => setForm((current) => ({ ...current, height: event.target.value }))}
                />
                <select
                  className={selectClassName}
                  value={form.sex}
                  onChange={(event) => setForm((current) => ({ ...current, sex: event.target.value }))}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <select
                  className={selectClassName}
                  value={form.activityLevel}
                  onChange={(event) => setForm((current) => ({ ...current, activityLevel: event.target.value }))}
                >
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Lightly active</option>
                  <option value="moderate">Moderately active</option>
                  <option value="high">Highly active</option>
                  <option value="elite">Elite training</option>
                </select>
                <select
                  className={selectClassName}
                  value={form.goalType}
                  onChange={(event) => setForm((current) => ({ ...current, goalType: event.target.value }))}
                >
                  <option value="fat_loss">Fat loss</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="muscle_gain">Muscle gain</option>
                  <option value="endurance">Endurance performance</option>
                </select>
                <select
                  className={selectClassName}
                  value={form.dietaryPreference}
                  onChange={(event) => setForm((current) => ({ ...current, dietaryPreference: event.target.value }))}
                >
                  <option value="none">No preference</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="pescatarian">Pescatarian</option>
                  <option value="keto">Keto</option>
                </select>
                <Input
                  placeholder="Allergies (comma separated)"
                  value={form.allergies}
                  onChange={(event) => setForm((current) => ({ ...current, allergies: event.target.value }))}
                />
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-4">
                <textarea
                  rows={4}
                  className={textareaClassName}
                  placeholder="Recent illness (optional)"
                  value={form.recentIllness}
                  onChange={(event) => setForm((current) => ({ ...current, recentIllness: event.target.value }))}
                />
                <textarea
                  rows={4}
                  className={textareaClassName}
                  placeholder="Recent injuries (optional)"
                  value={form.recentInjuries}
                  onChange={(event) => setForm((current) => ({ ...current, recentInjuries: event.target.value }))}
                />
                <div className="rounded-2xl bg-app-surface-strong p-4 text-sm text-app-text-soft">
                  {macroPlan?.hasEnoughProfileData
                    ? "You already have enough data for personalized targets. Save to refresh your latest plan."
                    : "Complete this step to activate personalized daily targets and AI recommendations."}
                </div>
              </div>
            ) : null}

            <div className="mt-2 flex flex-wrap gap-3">
              {step > 1 ? (
                <Button type="button" variant="ghost" onClick={handleBack}>
                  Back
                </Button>
              ) : null}

              {step < 3 ? (
                <Button type="button" onClick={handleNext}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Finish onboarding"}
                </Button>
              )}

              <Button type="button" variant="secondary" onClick={() => navigate("/dashboard")}>
                Skip for now
              </Button>
            </div>
          </form>
        ) : null}
      </Card>
    </div>
  );
}
