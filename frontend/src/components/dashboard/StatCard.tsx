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
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-app-primary via-app-primary-strong to-app-accent" />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase text-app-text-soft [letter-spacing:0.12em]">{label}</p>
          <span className={`h-2.5 w-2.5 rounded-full ${tone === "positive" ? "bg-app-success" : "bg-app-border"}`} />
        </div>
        <p className="mt-4 text-3xl font-bold text-app-text">{value}</p>
        <p
          className={`mt-4 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            tone === "positive"
              ? "bg-app-success/14 text-app-success"
              : "bg-app-surface-strong text-app-text-soft"
          }`}
        >
          {delta}
        </p>
      </div>
    </Card>
  );
}
