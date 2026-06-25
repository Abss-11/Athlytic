import { Link } from "react-router-dom";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PricingCards from "../components/billing/PricingCards";
import { useTheme } from "../context/ThemeContext";

const proofMetrics = [
  { label: "Weekly load", value: "+18%", detail: "controlled progression" },
  { label: "Recovery", value: "86", detail: "ready for intensity" },
  { label: "Macro match", value: "94%", detail: "fueling compliance" },
];

const featureCards = [
  {
    title: "Athlete command center",
    copy: "Daily readiness, training load, macros, goals, sleep, and running trends come together in a single cockpit.",
  },
  {
    title: "Coach operations",
    copy: "Monitor connected athletes, spot compliance gaps, and keep medical notes and feedback close to the work.",
  },
  {
    title: "Feedback loops",
    copy: "Athlytic turns logged meals, sessions, and biometrics into progress cues that athletes can actually act on.",
  },
];

const workflow = [
  "Create profile",
  "Log sessions",
  "Review trends",
  "Coach decisions",
];

const testimonials = [
  {
    quote: "Athlytic gives our staff the clarity of a performance lab without making athletes fight another spreadsheet.",
    name: "Mina Carter",
    role: "Head Performance Coach",
  },
  {
    quote: "The biggest win is context. I can see how sleep, nutrition, and run quality affect the next block.",
    name: "Ty Brooks",
    role: "Endurance Athlete",
  },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-app px-4 py-4 md:px-6">
      <div className="mx-auto max-w-[1440px]">
        <header className="glass-panel mb-5 flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-app-primary to-app-accent text-base font-black text-white shadow-lift">
              A
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-app-text-soft [letter-spacing:0.16em]">Athlytic</p>
              <h1 className="text-xl font-bold text-app-text">Performance OS</h1>
            </div>
          </Link>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="focus-ring rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-sm font-semibold text-app-text transition hover:-translate-y-0.5 hover:border-app-primary"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <Link to="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button>Start free</Button>
            </Link>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="panel-hero overflow-hidden px-6 py-9 text-white md:px-10 md:py-12 lg:min-h-[620px]">
            <Badge>Built for athletes, coaches, and creators</Badge>
            <h2 className="mt-6 max-w-4xl text-4xl font-bold leading-[1.02] md:text-6xl lg:text-7xl">
              Train, recover, and coach from one premium performance workspace.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/78 md:text-lg">
              Athlytic connects workout logging, running analytics, macro targets, sleep, goals, and coach notes into a
              focused product experience that feels fast enough for daily use.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/signup">
                <Button variant="secondary" className="px-6">
                  Create workspace
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="ghost" className="border-white/20 bg-white/10 px-6 text-white ring-white/20 hover:bg-white/15">
                  View dashboard
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {proofMetrics.map((metric) => (
                <div key={metric.label} className="rounded-3xl border border-white/16 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs font-semibold uppercase text-white/62 [letter-spacing:0.12em]">{metric.label}</p>
                  <p className="mt-3 text-3xl font-bold">{metric.value}</p>
                  <p className="mt-1 text-sm text-white/68">{metric.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <Card className="bg-app-surface/82">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase text-app-text-soft [letter-spacing:0.12em]">Live cockpit</p>
                  <h3 className="mt-3 text-3xl font-bold text-app-text">Today&apos;s performance stack</h3>
                </div>
                <span className="rounded-full bg-app-success/14 px-3 py-1 text-xs font-semibold text-app-success">Synced</span>
              </div>
              <div className="mt-6 grid gap-3">
                {[
                  { label: "Strength block", value: "Upper body power", progress: "72%" },
                  { label: "Fueling target", value: "128g protein logged", progress: "75%" },
                  { label: "Readiness", value: "Sleep + HRV trending up", progress: "86%" },
                ].map((item) => (
                  <div key={item.label} className="surface-tile">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="field-label">{item.label}</p>
                        <p className="mt-1 font-semibold text-app-text">{item.value}</p>
                      </div>
                      <p className="text-sm font-bold text-app-primary">{item.progress}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <p className="field-label">Product flow</p>
              <div className="mt-5 grid gap-3">
                {workflow.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-2xl bg-app-surface-strong/72 p-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-app-primary text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="font-semibold text-app-text">{step}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-3">
          {featureCards.map((feature) => (
            <Card key={feature.title}>
              <h3 className="text-2xl font-semibold text-app-text">{feature.title}</h3>
              <p className="mt-4 text-sm leading-7 text-app-text-soft">{feature.copy}</p>
            </Card>
          ))}
        </section>

        <section className="mt-5">
          <Card>
            <p className="field-label">Why athletes stay</p>
            <h3 className="mt-4 text-3xl font-bold text-app-text">Clear feedback loops, less dashboard noise.</h3>
            <p className="mt-4 text-sm leading-7 text-app-text-soft">
              Athlytic keeps the daily actions obvious: log the session, hit the fuel target, watch the trend, adjust
              the next block.
            </p>
            <div className="mt-7 grid gap-3">
              {[
                "Empty states explain what to log next.",
                "Cards prioritize action and trend clarity.",
                "Coach and athlete views share the same source of truth.",
              ].map((point) => (
                <div key={point} className="surface-tile text-sm font-medium text-app-text">
                  {point}
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-5">
          <Card>
            <p className="field-label">Plans</p>
            <h3 className="mt-4 text-3xl font-bold text-app-text">Choose how deep you want to train.</h3>
            <p className="mt-3 text-sm leading-7 text-app-text-soft">
              Start free with core tracking. Upgrade when you are ready for advanced analytics, PDF reports, and coaching insights.
            </p>
            <div className="mt-6">
              <PricingCards />
            </div>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name}>
              <p className="text-lg leading-8 text-app-text">{testimonial.quote}</p>
              <p className="mt-6 font-semibold text-app-text">{testimonial.name}</p>
              <p className="text-sm text-app-text-soft">{testimonial.role}</p>
            </Card>
          ))}
        </section>

        <footer className="glass-panel mt-5 px-6 py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-app-text">Build the training environment athletes return to daily.</h3>
              <p className="mt-2 text-sm text-app-text-soft">Start with the workspace, then let the data compound.</p>
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
