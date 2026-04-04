import type { ReactNode } from "react";

export default function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-app-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-app-accent-strong">
      {children}
    </span>
  );
}
