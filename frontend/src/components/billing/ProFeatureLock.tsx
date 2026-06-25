import { Link } from "react-router-dom";
import Button from "../ui/Button";

type ProFeatureLockProps = {
  title: string;
  description: string;
  cta?: string;
};

export default function ProFeatureLock({ title, description, cta = "View plans" }: ProFeatureLockProps) {
  return (
    <div className="rounded-3xl border border-app-primary/35 bg-app-primary/10 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="metric-chip border-app-primary/25 bg-app-primary/10 text-app-primary">Pro</span>
          <h3 className="mt-3 text-lg font-semibold text-app-text">{title}</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-app-text-soft">{description}</p>
        </div>
        <Link to="/profile">
          <Button variant="secondary">{cta}</Button>
        </Link>
      </div>
    </div>
  );
}
