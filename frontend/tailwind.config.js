/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          DEFAULT: "rgb(var(--bg) / <alpha-value>)",
          elevated: "rgb(var(--bg-elevated) / <alpha-value>)",
          muted: "rgb(var(--bg-muted) / <alpha-value>)",
          surface: "rgb(var(--surface) / <alpha-value>)",
          "surface-strong": "rgb(var(--surface-strong) / <alpha-value>)",
          "surface-soft": "rgb(var(--surface-soft) / <alpha-value>)",
          border: "rgb(var(--border) / <alpha-value>)",
          text: "rgb(var(--text) / <alpha-value>)",
          "text-soft": "rgb(var(--text-soft) / <alpha-value>)",
          primary: "rgb(var(--primary) / <alpha-value>)",
          "primary-strong": "rgb(var(--primary-strong) / <alpha-value>)",
          accent: "rgb(var(--accent) / <alpha-value>)",
          "accent-strong": "rgb(var(--accent-strong) / <alpha-value>)",
          danger: "rgb(var(--danger) / <alpha-value>)",
        },
      },
      boxShadow: {
        soft: "0 24px 60px rgba(var(--shadow))",
      },
    },
  },
  plugins: [],
}
