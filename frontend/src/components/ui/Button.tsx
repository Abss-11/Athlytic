import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}

const variants = {
  primary:
    "bg-app-primary text-white shadow-soft hover:-translate-y-0.5 hover:bg-app-primary-strong",
  secondary:
    "bg-app-accent text-slate-950 shadow-soft hover:-translate-y-0.5 hover:bg-app-accent-strong",
  ghost:
    "bg-transparent text-app-text ring-1 ring-inset ring-app-border hover:bg-app-surface-strong",
};

export default function Button({ children, className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
