interface ProgressRingProps {
  value: number;
  label: string;
}

export default function ProgressRing({ value, label }: ProgressRingProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} className="fill-none stroke-app-muted" strokeWidth="10" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="fill-none stroke-app-accent"
            strokeLinecap="round"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-app-text">
          {clampedValue}%
        </div>
      </div>
      <div>
        <p className="text-sm text-app-text-soft">{label}</p>
        <p className="text-xl font-semibold text-app-text">Daily completion</p>
      </div>
    </div>
  );
}
