import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        eyebrow="Profile"
        title="Personalize your athlete identity, coaching preferences, and training focus."
        description="Keep profile details, sports specialization, body metrics, and notification preferences aligned with your current block."
        badge="Profile 92% complete"
      />

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <h3 className="text-xl font-semibold text-app-text">Account details</h3>
          <div className="mt-5 grid gap-4">
            <Input defaultValue={user?.name ?? "Jordan Lee"} />
            <Input defaultValue={user?.email ?? "jordan@athlytic.app"} />
            <Input defaultValue={user?.profile?.sport ?? "Hybrid athlete"} />
            <Input defaultValue="Weight target: 76 kg" />
            <Button>Update profile</Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-semibold text-app-text">Performance profile</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Primary sport", value: user?.profile?.sport ?? "Running + strength" },
                { label: "Coach assigned", value: "Riley Bennett" },
                { label: "Current phase", value: "Build block" },
                { label: "Notifications", value: "Reports + reminders" },
              ].map((item) => (
              <div key={item.label} className="rounded-3xl bg-app-surface-strong p-5">
                <p className="text-sm text-app-text-soft">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-app-text">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
