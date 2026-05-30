import type { ReactNode } from "react";

export default function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-app-accent/35 bg-gradient-to-r from-app-accent/30 to-app-primary/20 px-3 py-1 text-xs font-semibold uppercase text-app-accent-strong shadow-[0_0_0_1px_rgba(145,255,110,0.18)] [letter-spacing:0.12em]">
      <span className="h-1.5 w-1.5 rounded-full bg-app-accent shadow-[0_0_14px_rgba(145,255,110,0.8)]" />
      {children}
    </span>
  );
}
