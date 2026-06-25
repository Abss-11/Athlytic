import { Link } from "react-router-dom";
import Button from "../ui/Button";
import type { PlanId } from "../../lib/plans";
import { plans } from "../../lib/plans";

type PricingCardsProps = {
  currentPlanId?: PlanId;
  onSelectPlan?: (planId: PlanId) => void;
  compact?: boolean;
};

export default function PricingCards({ currentPlanId, onSelectPlan, compact = false }: PricingCardsProps) {
  return (
    <div className={`grid gap-4 ${compact ? "lg:grid-cols-2" : "lg:grid-cols-4"}`}>
      {plans.map((plan) => {
        const isCurrentPlan = currentPlanId === plan.id;

        return (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-3xl border p-5 transition duration-300 hover:-translate-y-1 ${
              plan.featured
                ? "border-app-primary bg-gradient-to-br from-app-primary to-app-primary-strong text-white shadow-lift"
                : "border-app-border bg-app-surface-soft"
            }`}
          >
            {plan.badge ? (
              <span
                className={`absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                  plan.featured ? "bg-white/16 text-white" : "bg-app-accent/16 text-app-accent"
                }`}
              >
                {plan.badge}
              </span>
            ) : null}

            <p className={plan.featured ? "text-sm font-semibold text-white/72" : "text-sm font-semibold text-app-text-soft"}>
              {plan.name}
            </p>
            <h3 className="mt-3 text-3xl font-bold">{plan.price}</h3>
            <p className={plan.featured ? "mt-1 text-sm text-white/70" : "mt-1 text-sm text-app-text-soft"}>{plan.cadence}</p>
            <p className={plan.featured ? "mt-4 text-sm font-semibold text-white" : "mt-4 text-sm font-semibold text-app-text"}>
              {plan.tagline}
            </p>
            <p className={plan.featured ? "mt-2 text-sm leading-6 text-white/72" : "mt-2 text-sm leading-6 text-app-text-soft"}>
              {plan.description}
            </p>

            <div className="mt-5 grid gap-2">
              {plan.features.slice(0, compact ? 4 : 6).map((feature) => (
                <div key={feature} className="flex gap-2 text-sm">
                  <span className={plan.featured ? "text-app-accent" : "text-app-primary"}>+</span>
                  <span className={plan.featured ? "text-white/82" : "text-app-text-soft"}>{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6">
              {onSelectPlan ? (
                <Button
                  type="button"
                  variant={plan.featured ? "secondary" : "ghost"}
                  className="w-full"
                  disabled={isCurrentPlan}
                  onClick={() => onSelectPlan(plan.id)}
                >
                  {isCurrentPlan ? "Current plan" : plan.id === "free" ? "Use Free" : "Choose plan"}
                </Button>
              ) : (
                <Link to="/signup">
                  <Button variant={plan.featured ? "secondary" : "ghost"} className="w-full">
                    {plan.id === "free" ? "Start Free" : "Get Started"}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
