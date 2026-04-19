import { useEffect, useState } from "react";
import { biomarkerApi } from "../api/api";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { useToast } from "../context/ToastContext";

interface BiomarkerLog {
  _id?: string;
  id?: string;
  date: string;
  ferritin?: number;
  vitaminD?: number;
  cortisol?: number;
  testosterone?: number;
}

export default function BiomarkersPage() {
  const [logs, setLogs] = useState<BiomarkerLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { pushToast } = useToast();

  const [form, setForm] = useState({
    ferritin: "",
    vitaminD: "",
    cortisol: "",
    testosterone: "",
  });

  async function fetchLogs() {
    try {
      const { data } = await biomarkerApi.list();
      setLogs(data);
    } catch {
      pushToast("Failed to load biomarker logs", "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await biomarkerApi.create({
        ferritin: form.ferritin ? Number(form.ferritin) : undefined,
        vitaminD: form.vitaminD ? Number(form.vitaminD) : undefined,
        cortisol: form.cortisol ? Number(form.cortisol) : undefined,
        testosterone: form.testosterone ? Number(form.testosterone) : undefined,
      });
      pushToast("Lab results logged successfully", "success");
      setIsModalOpen(false);
      setForm({ ferritin: "", vitaminD: "", cortisol: "", testosterone: "" });
      fetchLogs();
    } catch {
      pushToast("Failed to log lab results", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-app-text">Biomarkers & Bloodwork</h1>
          <p className="mt-2 text-app-text-soft">Track your lab results to unlock deeper AI health insights.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <span className="text-lg leading-none">+</span>
          Log Lab Results
        </Button>
      </div>

      {isModalOpen && (
        <Card className="p-6 border-app-primary/20 bg-app-surface shadow-xl">
          <h2 className="text-xl font-bold text-app-text mb-4">Add Lab Results</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-app-text-soft mb-1">Ferritin (ng/mL)</label>
                <Input
                  type="number"
                  value={form.ferritin}
                  onChange={(e) => setForm({ ...form, ferritin: e.target.value })}
                  placeholder="e.g. 45"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-app-text-soft mb-1">Vitamin D (ng/mL)</label>
                <Input
                  type="number"
                  value={form.vitaminD}
                  onChange={(e) => setForm({ ...form, vitaminD: e.target.value })}
                  placeholder="e.g. 30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-app-text-soft mb-1">Cortisol (mcg/dL)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.cortisol}
                  onChange={(e) => setForm({ ...form, cortisol: e.target.value })}
                  placeholder="e.g. 15.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-app-text-soft mb-1">Testosterone (ng/dL)</label>
                <Input
                  type="number"
                  value={form.testosterone}
                  onChange={(e) => setForm({ ...form, testosterone: e.target.value })}
                  placeholder="e.g. 600"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Results</Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <p className="text-app-text-soft">Loading your lab data...</p>
      ) : logs.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 bg-transparent border-app-border/40">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-app-surface-strong text-2xl">
            🩸
          </div>
          <h3 className="text-lg font-medium text-app-text">No lab results found</h3>
          <p className="mt-2 text-app-text-soft max-w-sm mx-auto">
            Upload your latest bloodwork to allow the AI Coach to cross-reference performance drops with physiological deficiencies like low iron.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {logs.map((log) => (
            <Card key={log._id || log.id} className="p-6 relative overflow-hidden">
              <div className="absolute -right-2 -top-2 text-6xl opacity-5">
                🧪
              </div>
              <div className="relative z-10">
                <div className="mb-4">
                  <p className="text-sm font-medium text-app-text-soft">
                    {new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <h3 className="text-lg font-bold text-app-text">Lab Panel</h3>
                </div>
                <div className="space-y-3">
                  {log.ferritin !== undefined && (
                    <div className="flex justify-between items-center border-b border-app-border/40 pb-2">
                      <span className="text-sm text-app-text-soft">Ferritin</span>
                      <span className={`text-sm font-bold ${log.ferritin < 30 ? "text-app-danger" : "text-app-text"}`}>
                        {log.ferritin} ng/mL
                      </span>
                    </div>
                  )}
                  {log.vitaminD !== undefined && (
                    <div className="flex justify-between items-center border-b border-app-border/40 pb-2">
                      <span className="text-sm text-app-text-soft">Vitamin D</span>
                      <span className={`text-sm font-bold ${log.vitaminD < 20 ? "text-app-danger" : "text-app-text"}`}>
                        {log.vitaminD} ng/mL
                      </span>
                    </div>
                  )}
                  {log.cortisol !== undefined && (
                    <div className="flex justify-between items-center border-b border-app-border/40 pb-2">
                      <span className="text-sm text-app-text-soft">Cortisol</span>
                      <span className="text-sm font-bold text-app-text">{log.cortisol} mcg/dL</span>
                    </div>
                  )}
                  {log.testosterone !== undefined && (
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-sm text-app-text-soft">Testosterone</span>
                      <span className="text-sm font-bold text-app-text">{log.testosterone} ng/dL</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
