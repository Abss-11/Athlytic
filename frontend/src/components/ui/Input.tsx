import type { InputHTMLAttributes } from "react";

export default function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`focus-ring w-full rounded-2xl border border-app-border bg-app-surface/82 px-4 py-3 text-sm text-app-text outline-none transition placeholder:text-app-text-soft hover:border-app-primary/35 focus:border-app-primary ${className}`}
    />
  );
}
