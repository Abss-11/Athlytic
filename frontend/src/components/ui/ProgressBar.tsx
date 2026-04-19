export default function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full border border-app-border/55 bg-app-muted">
      <div
        className="h-full rounded-full bg-gradient-to-r from-app-primary via-app-primary-strong to-app-accent transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
