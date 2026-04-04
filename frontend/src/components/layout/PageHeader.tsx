import Badge from "../ui/Badge";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
}

export default function PageHeader({ eyebrow, title, description, badge }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.24em] text-app-text-soft">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-app-text md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-app-text-soft md:text-base">{description}</p>
      </div>
      {badge ? <Badge>{badge}</Badge> : null}
    </div>
  );
}
