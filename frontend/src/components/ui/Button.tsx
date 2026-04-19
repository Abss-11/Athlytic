import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}

const variants = {
  primary:
    "bg-gradient-to-r from-app-primary to-app-primary-strong text-white shadow-soft hover:-translate-y-0.5 hover:brightness-110",
  secondary:
    "bg-gradient-to-r from-app-accent to-app-accent-strong text-slate-950 shadow-soft hover:-translate-y-0.5 hover:brightness-105",
  ghost:
    "bg-app-surface/55 text-app-text ring-1 ring-inset ring-app-border hover:bg-app-surface-strong",
};

export default function Button({ children, className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-primary/25 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
