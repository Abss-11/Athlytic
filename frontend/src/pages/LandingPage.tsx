import { Link } from "react-router-dom";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useTheme } from "../context/ThemeContext";

const featureCards = [
  {
    title: "Unified athlete dashboard",
    copy: "Track training load, calories, hydration, sleep, and performance scores from one clean command center.",
  },
  {
    title: "Coach intelligence layer",
    copy: "Monitor every athlete, assign programs, compare trends, and deliver feedback with confidence.",
  },
  {
    title: "AI performance assistant",
    copy: "Surface action-ready insights on recovery, nutrition gaps, pace trends, and goal completion.",
  },
];

const testimonials = [
  {
    quote: "Athlytic gives our staff the clarity of a pro performance lab without the clutter of five different tools.",
    name: "Mina Carter",
    role: "Head Performance Coach",
  },
  {
    quote: "I finally understand how my sleep, nutrition, and running blocks affect my race-week output.",
    name: "Ty Brooks",
    role: "Endurance Athlete",
  },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-app px-4 py-4 md:px-6">
      <div className="mx-auto max-w-[1440px]">
        <header className="glass-panel mb-6 flex flex-col gap-5 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-app-text-soft">Athlytic</p>
            <h1 className="text-2xl font-bold text-app-text">Performance Tracking Platform</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-sm font-medium text-app-text"
            >
              {theme === "dark" ? "Switch to light" : "Switch to dark"}
            </button>
            <Link to="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button>Start free trial</Button>
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="glass-panel overflow-hidden px-6 py-8 md:px-10 md:py-12">
            <Badge>Built for athletes and coaches</Badge>
            <h2 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-app-text md:text-6xl">
              A clean, high-performance workspace for training, nutrition, and coaching decisions.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-app-text-soft">
              Athlytic brings together training logs, running metrics, macro tracking, goal systems, and athlete
              intelligence in one startup-grade platform designed for modern performance teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/dashboard">
                <Button className="px-6">Open athlete dashboard</Button>
              </Link>
              <Link to="/coach">
                <Button variant="secondary" className="px-6">
                  Explore coach portal
                </Button>
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                "Track training, nutrition, and recovery in one place",
                "Built for athletes, coaches, and performance teams",
                "Starts clean and grows with your real data",
                "Responsive dashboards for desktop, tablet, and mobile",
              ].map((highlight) => (
                <div key={highlight} className="rounded-2xl bg-app-surface-strong px-4 py-4 text-sm font-medium text-app-text">
                  {highlight}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <Card className="bg-gradient-to-br from-app-primary to-slate-950 text-white">
              <p className="text-sm text-white/70">Built for real performance teams</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  "Athlete dashboards for daily logging",
                  "Coach views for oversight and planning",
                  "Progress tracking across training blocks",
                  "A single workspace instead of scattered tools",
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-white/80">{item}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <p className="text-sm uppercase tracking-[0.24em] text-app-text-soft">What Athlytic analyzes</p>
              <div className="mt-4 grid gap-3">
                {[
                  "Nutrition adherence and macro consistency.",
                  "Running performance, pacing, and training volume.",
                  "Workout history, goal progress, and recovery signals.",
                ].map((insight) => (
                  <div key={insight} className="rounded-2xl bg-app-surface-strong p-4 text-sm leading-6 text-app-text">
                    {insight}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          {featureCards.map((feature) => (
            <Card key={feature.title}>
              <h3 className="text-2xl font-semibold text-app-text">{feature.title}</h3>
              <p className="mt-4 text-sm leading-7 text-app-text-soft">{feature.copy}</p>
            </Card>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <p className="text-sm uppercase tracking-[0.24em] text-app-text-soft">Why athletes stay</p>
            <h3 className="mt-4 text-3xl font-bold text-app-text">Clear feedback loops.</h3>
            <p className="mt-4 text-sm leading-7 text-app-text-soft">
              From protein compliance to personal records, every part of the product is built to turn daily input into
              motivation, clarity, and better training decisions.
            </p>
            <div className="mt-8 grid gap-4">
              {[
                "Start empty and build your own data history.",
                "See trends emerge naturally as you log activity.",
                "Keep coaches and athletes on the same page.",
              ].map((point) => (
                <div key={point} className="rounded-2xl bg-app-surface-strong p-4">
                  <p className="text-sm text-app-text">{point}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="text-sm uppercase tracking-[0.24em] text-app-text-soft">Pricing</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-app-border bg-app-surface-soft p-5">
                <p className="text-sm text-app-text-soft">Starter</p>
                <h3 className="mt-3 text-3xl font-bold text-app-text">$19</h3>
                <p className="mt-2 text-sm text-app-text-soft">Solo athletes building consistent habits.</p>
              </div>
              <div className="rounded-3xl border border-app-primary bg-app-primary px-5 py-6 text-white shadow-soft">
                <p className="text-sm text-white/75">Pro</p>
                <h3 className="mt-3 text-3xl font-bold">$49</h3>
                <p className="mt-2 text-sm text-white/75">Advanced tracking, AI insights, and deep performance analytics.</p>
              </div>
              <div className="rounded-3xl border border-app-border bg-app-surface-soft p-5">
                <p className="text-sm text-app-text-soft">Team</p>
                <h3 className="mt-3 text-3xl font-bold text-app-text">$149</h3>
                <p className="mt-2 text-sm text-app-text-soft">Coach portal, athlete groups, and performance operations.</p>
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name}>
              <p className="text-lg leading-8 text-app-text">{testimonial.quote}</p>
              <p className="mt-6 font-semibold text-app-text">{testimonial.name}</p>
              <p className="text-sm text-app-text-soft">{testimonial.role}</p>
            </Card>
          ))}
        </section>

        <footer className="mt-6 glass-panel px-6 py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-app-text">Ready to build a smarter training environment?</h3>
              <p className="mt-2 text-sm text-app-text-soft">
                Launch Athlytic for your athletes, coaches, and performance staff.
              </p>
            </div>
            <Link to="/signup">
              <Button variant="secondary">Create your account</Button>
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
