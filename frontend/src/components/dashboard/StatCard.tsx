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
    <Card className="overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-app-primary to-app-accent" />
      <div className="relative">
        <p className="text-sm text-app-text-soft">{label}</p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-app-text">{value}</p>
        <p className={`mt-4 text-sm ${tone === "positive" ? "text-app-accent-strong" : "text-app-text-soft"}`}>
          {delta}
        </p>
      </div>
    </Card>
  );
}
