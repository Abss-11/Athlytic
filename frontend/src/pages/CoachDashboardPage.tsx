import { useEffect, useState } from "react";
import axios from "axios";
import { dashboardApi, coachApi } from "../api/api";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import ProgressBar from "../components/ui/ProgressBar";
import Button from "../components/ui/Button";

type Athlete = {
  id: string;
  name: string;
  email: string;
  profile?: { medicalNotes?: string };
};

export default function CoachDashboardPage() {
  const { pushToast } = useToast();
  const [summary, setSummary] = useState({
    monitoredAthletes: 0,
    flaggedAthletes: 0,
    averageCompliance: 0,
    notes: [] as string[],
  });
  
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [expandedAthleteId, setExpandedAthleteId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    async function loadData() {
      try {
        const response = await dashboardApi.getCoachDashboard();
        setSummary(response.data);
        
        const athletesResponse = await coachApi.getAthletes();
        const loadedAthletes: Athlete[] = athletesResponse.data.athletes || [];
        setAthletes(loadedAthletes);
        
        const initialNotes: { [key: string]: string } = {};
        loadedAthletes.forEach((athlete) => {
          initialNotes[athlete.id] = athlete.profile?.medicalNotes || "";
        });
        setEditingNotes(initialNotes);
      } catch (error) {
        if (!axios.isAxiosError(error)) {
          console.error(error);
        }
      }
    }

    void loadData();
  }, []);

  const handleSaveNotes = async (athleteId: string) => {
    const notesToSave = editingNotes[athleteId] || "";
    try {
      await coachApi.updateNotes(athleteId, notesToSave);
      pushToast("Athlete notes updated securely.", "success");
    } catch (error) {
      if (axios.isAxiosError(error)) {
         pushToast(error.response?.data?.message || "Failed to update notes.", "error");
      } else {
         pushToast("Failed to update notes.", "error");
      }
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Coach portal"
        title="A high-level view of athlete readiness, compliance, and progression."
        description="Assign programs, compare athlete performance, monitor nutrition adherence, and send feedback from a single operations dashboard."
        badge={`${summary.flaggedAthletes} athletes flagged`}
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-app-text">Athlete overview</h3>
              <p className="mt-1 text-sm text-app-text-soft">Performance score, training direction, and next action.</p>
            </div>
            <Button>Assign training block</Button>
          </div>

          <div className="mt-6 grid gap-4">
            {athletes.length === 0 ? (
              <div className="rounded-3xl bg-app-surface-strong p-5 text-sm text-app-text-soft">
                No athletes are connected yet. Invite athletes or create coach-linked accounts to populate this view.
              </div>
            ) : (
              athletes.map((athlete) => (
                <div key={athlete.id} className="rounded-2xl border border-app-border bg-app-surface-strong p-4 transition">
                  <div 
                    className="flex cursor-pointer items-center justify-between"
                    onClick={() => setExpandedAthleteId(prev => prev === athlete.id ? null : athlete.id)}
                  >
                    <div>
                      <p className="font-semibold text-app-text">{athlete.name}</p>
                      <p className="text-xs text-app-text-soft mt-1">{athlete.email}</p>
                    </div>
                    <Button variant="ghost">
                      {expandedAthleteId === athlete.id ? "Close Profile" : "View Profile"}
                    </Button>
                  </div>
                  
                  {expandedAthleteId === athlete.id && (
                    <div className="mt-4 pt-4 border-t border-app-border">
                      <label className="text-sm font-medium text-app-text-soft">Coach Notes & Medical Directives</label>
                      <textarea
                        className="w-full mt-2 rounded-xl border border-app-border bg-app-surface px-4 py-3 text-sm text-app-text outline-none transition placeholder:text-app-text-soft focus:border-app-primary focus:ring-4 focus:ring-app-primary/15"
                        rows={4}
                        placeholder="Enter active directives, fatigue warnings, or injury notes..."
                        value={editingNotes[athlete.id] || ""}
                        onChange={(e) => setEditingNotes(prev => ({ ...prev, [athlete.id]: e.target.value }))}
                      />
                      <div className="mt-3 flex justify-end">
                        <Button onClick={() => handleSaveNotes(athlete.id)}>Save Note to Profile</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card>
            <h3 className="text-xl font-semibold text-app-text">Coach actions</h3>
            <div className="mt-4 grid gap-3">
              {summary.notes.length === 0 ? (
                <div className="rounded-2xl border border-app-border bg-app-surface-strong p-4 text-sm text-app-text-soft">
                  No coach actions yet. Tasks will appear once athletes begin logging activity.
                </div>
              ) : (
                summary.notes.map((task) => (
                  <div key={task} className="rounded-2xl border border-app-border bg-app-surface-strong p-4 text-sm text-app-text">
                    {task}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-semibold text-app-text">Comparison view</h3>
            <div className="mt-4 space-y-4">
              {[
                { label: "Monitored athletes", value: Math.min(100, summary.monitoredAthletes * 20) },
                { label: "Training compliance", value: summary.averageCompliance },
                { label: "Nutrition adherence", value: 0 },
                { label: "Recovery score", value: 0 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-app-text-soft">{item.label}</span>
                    <span className="font-semibold text-app-text">{item.value}%</span>
                  </div>
                  <ProgressBar value={item.value} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
