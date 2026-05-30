import type { ReactNode } from "react";

export default function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`glass-panel interactive-card overflow-hidden p-5 before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.1),transparent_44%)] before:opacity-70 md:p-6 ${className}`}
    >
      <div className="relative">{children}</div>
    </section>
  );
}
