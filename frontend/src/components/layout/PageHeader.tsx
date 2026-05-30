import Badge from "../ui/Badge";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
}

export default function PageHeader({ eyebrow, title, description, badge }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-5 rounded-[1.75rem] border border-app-border/70 bg-app-surface/50 p-5 backdrop-blur-md md:flex-row md:items-end md:justify-between md:p-7">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase text-app-text-soft [letter-spacing:0.16em]">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold text-app-text md:text-5xl">
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
