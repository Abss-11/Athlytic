import { useEffect, useState } from "react";

export type PlanId = "free" | "pro_monthly" | "pro_yearly" | "student";

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  description: string;
  badge?: string;
  featured?: boolean;
  features: string[];
  limitations?: string[];
};

export const planStorageKey = "athlytic-plan";

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "Rs 0",
    cadence: "forever",
    tagline: "Start tracking",
    description: "Core logging for athletes building a consistent training habit.",
    features: ["Workout, running, nutrition, and goals logs", "Basic dashboard", "Starter progress charts", "Community access"],
    limitations: ["Limited history", "No PDF exports", "No advanced reports"],
  },
  {
    id: "pro_monthly",
    name: "Pro",
    price: "Rs 299",
    cadence: "per month",
    tagline: "Most flexible",
    description: "Advanced performance intelligence for serious athletes.",
    badge: "Popular",
    featured: true,
    features: [
      "Unlimited training history",
      "Advanced running analytics",
      "Weekly performance reports",
      "PDF exports",
      "Recovery and readiness insights",
      "Coach-athlete tools",
    ],
  },
  {
    id: "pro_yearly",
    name: "Pro Yearly",
    price: "Rs 2,799",
    cadence: "per year",
    tagline: "Save Rs 789",
    description: "Best value for athletes committing to a full training year.",
    badge: "Best value",
    features: [
      "Everything in Pro monthly",
      "Two months effectively free",
      "Year-round trend comparisons",
      "Priority report exports",
      "Long-term progress reviews",
    ],
  },
  {
    id: "student",
    name: "Student Pro",
    price: "Rs 199",
    cadence: "per month",
    tagline: "Student pricing",
    description: "Full Pro access at a student-friendly monthly price.",
    badge: "Student",
    features: ["Everything in Pro", "Discounted access", "Student verification ready", "Built for campus athletes"],
  },
];

export function isProPlan(planId: PlanId) {
  return planId !== "free";
}

export function getPlan(planId: PlanId) {
  return plans.find((plan) => plan.id === planId) ?? plans[0];
}

function readStoredPlan(): PlanId {
  if (typeof window === "undefined") {
    return "free";
  }

  const storedPlan = window.localStorage.getItem(planStorageKey) as PlanId | null;
  return storedPlan && plans.some((plan) => plan.id === storedPlan) ? storedPlan : "free";
}

export function useBillingPlan() {
  const [planId, setPlanIdState] = useState<PlanId>(() => readStoredPlan());

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === planStorageKey) {
        setPlanIdState(readStoredPlan());
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  function setPlanId(nextPlanId: PlanId) {
    setPlanIdState(nextPlanId);
    window.localStorage.setItem(planStorageKey, nextPlanId);
  }

  return {
    planId,
    plan: getPlan(planId),
    isPro: isProPlan(planId),
    setPlanId,
  };
}
