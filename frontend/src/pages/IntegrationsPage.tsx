import { useState } from "react";
import axios from "axios";
import { integrationApi } from "../api/api";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

type Provider = {
  id: string;
  name: string;
  description: string;
  metrics: string[];
  colorFrom: string;
  colorTo: string;
};

const providers: Provider[] = [
  {
    id: "apple_health",
    name: "Apple Health",
    description: "Sync your steps, running distance, active energy, and sleep analysis seamlessly.",
    metrics: ["Running", "Sleep", "Heart Rate", "V02 Max"],
    colorFrom: "from-rose-500",
    colorTo: "to-orange-500",
  },
  {
    id: "garmin",
    name: "Garmin Connect",
    description: "Pull in your advanced cycling dynamics, running power, and body battery metrics.",
    metrics: ["Workouts", "Running", "Stress Level", "Steps"],
    colorFrom: "from-blue-500",
    colorTo: "to-cyan-400",
  },
  {
    id: "whoop",
    name: "WHOOP",
    description: "Import your daily recovery scores, strain, and detailed sleep stages.",
    metrics: ["Recovery", "Strain", "Sleep Quality"],
    colorFrom: "from-slate-800",
    colorTo: "to-slate-900 border border-slate-700",
  },
  {
    id: "oura",
    name: "Oura Ring",
    description: "Synchronize readiness scores, temperature trends, and deep sleep metrics.",
    metrics: ["Readiness", "Sleep Stages", "Activity Goal"],
    colorFrom: "from-emerald-500",
    colorTo: "to-teal-500",
  },
];

export default function IntegrationsPage() {
  const { pushToast } = useToast();
  const [syncingProviderId, setSyncingProviderId] = useState<string | null>(null);

  const handleSync = async (provider: Provider) => {
    setSyncingProviderId(provider.id);
    try {
      await integrationApi.syncProvider(provider.id);
      pushToast(`Connected to ${provider.name}. Synthetic logs successfully imported!`, "success");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        pushToast(error.response?.data?.message || `Failed to sync with ${provider.name}`, "error");
      } else {
        pushToast(`An unexpected error occurred while syncing with ${provider.name}`, "error");
      }
    } finally {
      setSyncingProviderId(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Integrations & Devices"
        title="Connect your wearables to Athlytic."
        description="Sync your activity, sleep, and recovery data from your favorite health ecosystems to automatically populate your dashboard and AI targets."
      />

      <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {providers.map((provider) => (
          <Card key={provider.id} className="flex flex-col">
            <div className={`h-24 w-full rounded-2xl bg-gradient-to-br ${provider.colorFrom} ${provider.colorTo} flex items-center justify-center p-6 shadow-inner`}>
              <h3 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">{provider.name}</h3>
            </div>
            
            <div className="mt-6 flex flex-1 flex-col justify-between">
              <div>
                <p className="text-sm font-medium leading-relaxed text-app-text-soft">
                  {provider.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {provider.metrics.map((metric) => (
                    <span
                      key={metric}
                      className="rounded-full bg-app-surface-strong px-3 py-1 text-xs font-semibold text-app-text-soft"
                    >
                      {metric}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mt-8">
                <Button 
                  className="w-full" 
                  variant={syncingProviderId === provider.id ? "secondary" : "primary"}
                  onClick={() => handleSync(provider)}
                  disabled={syncingProviderId !== null}
                >
                  {syncingProviderId === provider.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      Establishing Connection...
                    </span>
                  ) : (
                    "Connect & Sync"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
