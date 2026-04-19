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
      className={`glass-panel overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_45%)] before:opacity-70 p-5 md:p-6 ${className}`}
    >
      <div className="relative">{children}</div>
    </section>
  );
}
