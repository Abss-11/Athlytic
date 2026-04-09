import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { profileApi } from "../api/api";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { MacroPlan, UserRole } from "../types";

type ProfileApiUser = {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  profile?: {
    sport?: string;
    age?: number;
    weight?: number;
    height?: number;
    bodyFatPercent?: number;
    sex?: string;
    activityLevel?: string;
    goalType?: string;
    dietaryPreference?: string;
    allergies?: string[];
    recentIllness?: string;
    recentInjuries?: string;
    medicalNotes?: string;
    goalsSummary?: string;
  };
};

type ProfileFormState = {
  name: string;
  sport: string;
  age: string;
  weight: string;
  height: string;
  bodyFatPercent: string;
  sex: string;
  activityLevel: string;
  goalType: string;
  dietaryPreference: string;
  allergies: string;
  recentIllness: string;
  recentInjuries: string;
  medicalNotes: string;
  goalsSummary: string;
};

const selectClassName =
  "w-full rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-sm text-app-text outline-none transition focus:border-app-primary focus:ring-4 focus:ring-app-primary/15";
const textareaClassName =
  "w-full rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-sm text-app-text outline-none transition placeholder:text-app-text-soft focus:border-app-primary focus:ring-4 focus:ring-app-primary/15";

function toInputValue(value: number | undefined) {
  return value === undefined ? "" : String(value);
}

function toFormState(user: ProfileApiUser | null): ProfileFormState {
  return {
    name: user?.name ?? "",
    sport: user?.profile?.sport ?? "",
    age: toInputValue(user?.profile?.age),
    weight: toInputValue(user?.profile?.weight),
    height: toInputValue(user?.profile?.height),
    bodyFatPercent: toInputValue(user?.profile?.bodyFatPercent),
    sex: user?.profile?.sex ?? "other",
    activityLevel: user?.profile?.activityLevel ?? "moderate",
    goalType: user?.profile?.goalType ?? "maintenance",
    dietaryPreference: user?.profile?.dietaryPreference ?? "none",
    allergies: (user?.profile?.allergies ?? []).join(", "),
    recentIllness: user?.profile?.recentIllness ?? "",
    recentInjuries: user?.profile?.recentInjuries ?? "",
    medicalNotes: user?.profile?.medicalNotes ?? "",
    goalsSummary: user?.profile?.goalsSummary ?? "",
  };
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function ProfilePage() {
  const { user, replaceUser } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState<ProfileFormState>(() => toFormState((user as ProfileApiUser | null) ?? null));
  const [macroPlan, setMacroPlan] = useState<MacroPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await profileApi.getMe();
        const nextUser = response.data.user as ProfileApiUser;
        const nextMacroPlan = response.data.macroPlan as MacroPlan;
        replaceUser(nextUser);
        setForm(toFormState(nextUser));
        setMacroPlan(nextMacroPlan);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          pushToast(error.response?.data?.message || "Could not load profile right now.", "error");
        } else {
          pushToast("Could not load profile right now.", "error");
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadProfile();
  }, [pushToast, replaceUser]);

  const targetCards = useMemo(() => {
    const targets = macroPlan?.dailyTargets;
    if (!targets) {
      return [];
    }

    return [
      { label: "Calories", value: `${targets.calories} kcal` },
      { label: "Protein", value: `${targets.protein} g` },
      { label: "Carbs", value: `${targets.carbs} g` },
      { label: "Fats", value: `${targets.fats} g` },
      { label: "Water", value: `${targets.waterLiters} L` },
      { label: "Sleep", value: `${targets.sleepHours} h` },
    ];
  }, [macroPlan?.dailyTargets]);

  async function handleSave() {
    if (!form.name.trim()) {
      pushToast("Name is required before saving profile.", "error");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        profile: {
          sport: form.sport.trim(),
          age: parseOptionalNumber(form.age),
          weight: parseOptionalNumber(form.weight),
          height: parseOptionalNumber(form.height),
          bodyFatPercent: parseOptionalNumber(form.bodyFatPercent),
          sex: form.sex,
          activityLevel: form.activityLevel,
          goalType: form.goalType,
          dietaryPreference: form.dietaryPreference,
          allergies: form.allergies
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          recentIllness: form.recentIllness.trim(),
          recentInjuries: form.recentInjuries.trim(),
          medicalNotes: form.medicalNotes.trim(),
          goalsSummary: form.goalsSummary.trim(),
        },
      };

      const response = await profileApi.updateMe(payload);
      const nextUser = response.data.user as ProfileApiUser;
      const nextMacroPlan = response.data.macroPlan as MacroPlan;
      replaceUser(nextUser);
      setForm(toFormState(nextUser));
      setMacroPlan(nextMacroPlan);
      pushToast("Profile updated. Macro targets and AI advice refreshed.", "success");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        pushToast(error.response?.data?.message || "Could not save profile changes.", "error");
      } else {
        pushToast("Could not save profile changes.", "error");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Profile + health metrics"
        title="Build your athlete profile and get personalized macros, recovery targets, and diet guidance."
        description="Add body metrics, activity, goals, allergies, injuries, and illness context. Athlytic calculates personalized daily targets automatically."
        badge={macroPlan?.hasEnoughProfileData ? "Personalized targets active" : "Complete age, weight, and height"}
      />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h3 className="text-xl font-semibold text-app-text">Athlete profile inputs</h3>
          <div className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                placeholder="Full name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
              <Input
                placeholder="Primary sport"
                value={form.sport}
                onChange={(event) => setForm((current) => ({ ...current, sport: event.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                placeholder="Age"
                type="number"
                value={form.age}
                onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))}
              />
              <Input
                placeholder="Weight (kg)"
                type="number"
                value={form.weight}
                onChange={(event) => setForm((current) => ({ ...current, weight: event.target.value }))}
              />
              <Input
                placeholder="Height (cm)"
                type="number"
                value={form.height}
                onChange={(event) => setForm((current) => ({ ...current, height: event.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                placeholder="Body fat % (optional)"
                type="number"
                value={form.bodyFatPercent}
                onChange={(event) => setForm((current) => ({ ...current, bodyFatPercent: event.target.value }))}
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>

            <Input
              placeholder="Allergies (comma separated: peanuts, dairy, gluten)"
              value={form.allergies}
              onChange={(event) => setForm((current) => ({ ...current, allergies: event.target.value }))}
            />

            <textarea
              rows={3}
              placeholder="Recent illness (optional)"
              className={textareaClassName}
              value={form.recentIllness}
              onChange={(event) => setForm((current) => ({ ...current, recentIllness: event.target.value }))}
            />

            <textarea
              rows={3}
              placeholder="Recent injuries (optional)"
              className={textareaClassName}
              value={form.recentInjuries}
              onChange={(event) => setForm((current) => ({ ...current, recentInjuries: event.target.value }))}
            />

            <textarea
              rows={3}
              placeholder="Goal summary"
              className={textareaClassName}
              value={form.goalsSummary}
              onChange={(event) => setForm((current) => ({ ...current, goalsSummary: event.target.value }))}
            />

            <textarea
              rows={3}
              placeholder="Coach/medical notes (optional)"
              className={textareaClassName}
              value={form.medicalNotes}
              onChange={(event) => setForm((current) => ({ ...current, medicalNotes: event.target.value }))}
            />

            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving profile..." : "Save profile and update macro plan"}
            </Button>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card>
            <h3 className="text-xl font-semibold text-app-text">Personalized daily targets</h3>
            {isLoading ? (
              <p className="mt-4 text-sm text-app-text-soft">Loading profile targets...</p>
            ) : (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {targetCards.map((item) => (
                    <div key={item.label} className="rounded-2xl bg-app-surface-strong p-4">
                      <p className="text-sm text-app-text-soft">{item.label}</p>
                      <p className="mt-2 text-lg font-semibold text-app-text">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-2 text-sm text-app-text-soft">
                  <p>
                    Estimated BMR:{" "}
                    <span className="font-semibold text-app-text">
                      {macroPlan?.estimatedBmr ? `${macroPlan.estimatedBmr} kcal` : "Need age, weight, and height"}
                    </span>
                  </p>
                  <p>
                    Estimated TDEE:{" "}
                    <span className="font-semibold text-app-text">
                      {macroPlan?.estimatedTdee ? `${macroPlan.estimatedTdee} kcal` : "Need age, weight, and height"}
                    </span>
                  </p>
                  <p>
                    BMI:{" "}
                    <span className="font-semibold text-app-text">
                      {macroPlan?.bmi ? macroPlan.bmi : "Need age, weight, and height"}
                    </span>
                  </p>
                </div>
              </>
            )}
          </Card>

          <Card>
            <h3 className="text-xl font-semibold text-app-text">AI guidance + diet suggestions</h3>
            <div className="mt-5 grid gap-3">
              {(macroPlan?.aiAdvice || []).map((tip) => (
                <div key={tip} className="rounded-2xl border border-app-border bg-app-surface-strong p-4 text-sm text-app-text">
                  {tip}
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3">
              {(macroPlan?.dietSuggestions || []).map((line) => (
                <div key={line} className="rounded-2xl bg-app-surface-strong p-4 text-sm text-app-text-soft">
                  {line}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
