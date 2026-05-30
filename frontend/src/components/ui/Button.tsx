import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}

const variants = {
  primary:
    "bg-gradient-to-r from-app-primary to-app-primary-strong text-white shadow-lift hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0",
  secondary:
    "bg-gradient-to-r from-app-accent to-app-accent-strong text-slate-950 shadow-lift hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0",
  ghost:
    "bg-app-surface/58 text-app-text ring-1 ring-inset ring-app-border hover:-translate-y-0.5 hover:bg-app-surface-strong active:translate-y-0",
};

export default function Button({ children, className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
