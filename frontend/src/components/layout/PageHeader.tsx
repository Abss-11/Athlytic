import Badge from "../ui/Badge";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
}

export default function PageHeader({ eyebrow, title, description, badge }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-app-border/70 bg-app-surface/45 p-5 backdrop-blur-md md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.3em] text-app-text-soft">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-app-text md:text-5xl">
          <span className="bg-gradient-to-r from-app-text via-app-primary to-app-primary-strong bg-clip-text text-transparent">
            {title}
          </span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-app-text-soft md:text-base">{description}</p>
      </div>
      {badge ? <Badge>{badge}</Badge> : null}
    </div>
  );
}
