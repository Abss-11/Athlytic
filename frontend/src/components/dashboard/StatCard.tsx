import Card from "../ui/Card";

export default function StatCard({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "positive" | "neutral";
}) {
  return (
    <Card className="overflow-hidden border-app-border/75">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-app-primary via-app-primary-strong to-app-accent" />
      <div className="relative">
        <p className="text-xs uppercase tracking-[0.16em] text-app-text-soft">{label}</p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-app-text">{value}</p>
        <p
          className={`mt-4 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            tone === "positive"
              ? "bg-app-accent/20 text-app-accent-strong"
              : "bg-app-surface-strong text-app-text-soft"
          }`}
        >
          {delta}
        </p>
      </div>
    </Card>
  );
}
