import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { dashboardApi, coachApi } from "../api/api";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import ProgressBar from "../components/ui/ProgressBar";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

type Athlete = {
  id: string;
  name: string;
  email: string;
  profile?: {
    sport?: string;
    age?: number;
    weight?: number;
    height?: number;
    sex?: string;
    activityLevel?: string;
    goalsSummary?: string;
    recentIllness?: string;
    recentInjuries?: string;
    medicalNotes?: string;
    coachFeedback?: string;
  };
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
  
  // Tabs: "overview" | "performance" | "goals"
  const [profileTab, setProfileTab] = useState<"overview" | "performance" | "goals">("overview");

  // Dynamic state for active athlete
  const [performanceData, setPerformanceData] = useState<any | null>(null);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);

  // Notes and feedback inputs
  const [editingNotes, setEditingNotes] = useState<{ [id: string]: string }>({});
  const [editingFeedback, setEditingFeedback] = useState<{ [id: string]: string }>({});

  // Assign Goal form state
  const [goalForm, setGoalForm] = useState({
    title: "",
    category: "protein" as "protein" | "calories" | "gym" | "running" | "bodyWeight" | "strength",
    targetValue: "",
    unit: "g",
    deadline: "",
  });

  const loadData = useCallback(async () => {
    try {
      const response = await dashboardApi.getCoachDashboard();
      setSummary(response.data);

      const athletesResponse = await coachApi.getAthletes();
      const loadedAthletes: Athlete[] = athletesResponse.data.athletes || [];
      setAthletes(loadedAthletes);

      const initialNotes: { [key: string]: string } = {};
      const initialFeedback: { [key: string]: string } = {};
      loadedAthletes.forEach((athlete) => {
        initialNotes[athlete.id] = athlete.profile?.medicalNotes || "";
        initialFeedback[athlete.id] = athlete.profile?.coachFeedback || "";
      });
      setEditingNotes(initialNotes);
      setEditingFeedback(initialFeedback);
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        console.error(error);
      }
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Load performance logs on athlete expand
  useEffect(() => {
    if (!expandedAthleteId) {
      setPerformanceData(null);
      return;
    }

    async function fetchPerformance() {
      setIsLoadingPerformance(true);
      try {
        const res = await coachApi.getAthletePerformance(expandedAthleteId!);
        setPerformanceData(res.data);
        if (res.data.athlete) {
          setEditingNotes((prev) => ({
            ...prev,
            [expandedAthleteId!]: res.data.athlete.profile?.medicalNotes || "",
          }));
          setEditingFeedback((prev) => ({
            ...prev,
            [expandedAthleteId!]: res.data.athlete.profile?.coachFeedback || "",
          }));
        }
      } catch (err) {
        pushToast("Failed to load athlete logs.", "error");
      } finally {
        setIsLoadingPerformance(false);
      }
    }

    void fetchPerformance();
  }, [expandedAthleteId, pushToast]);

  const handleSaveNotes = async (athleteId: string) => {
    const notesToSave = editingNotes[athleteId] || "";
    try {
      await coachApi.updateNotes(athleteId, notesToSave);
      pushToast("Athlete notes updated securely.", "success");
      void loadData();
    } catch (error) {
      pushToast("Failed to update notes.", "error");
    }
  };

  const handleSaveFeedback = async (athleteId: string) => {
    const feedbackToSave = editingFeedback[athleteId] || "";
    try {
      await coachApi.updateFeedback(athleteId, feedbackToSave);
      pushToast("Coach feedback sent to athlete dashboard.", "success");
      void loadData();
    } catch (error) {
      pushToast("Failed to send feedback.", "error");
    }
  };

  const handleAssignGoal = async (athleteId: string) => {
    if (!goalForm.title.trim() || !goalForm.targetValue) {
      pushToast("Please enter a title and target value.", "error");
      return;
    }

    try {
      const payload = {
        title: goalForm.title.trim(),
        category: goalForm.category,
        targetValue: Number(goalForm.targetValue),
        currentValue: 0,
        unit: goalForm.unit,
        deadline: goalForm.deadline ? new Date(goalForm.deadline).toISOString() : undefined,
      };

      await coachApi.assignGoal(athleteId, payload);
      pushToast("Goal assigned successfully.", "success");
      
      // Reload active athlete's performance data
      const res = await coachApi.getAthletePerformance(athleteId);
      setPerformanceData(res.data);

      setGoalForm({
        title: "",
        category: "protein",
        targetValue: "",
        unit: "g",
        deadline: "",
      });
      void loadData();
    } catch (error) {
      pushToast("Failed to assign goal.", "error");
    }
  };

  // Adjust unit based on category selection
  const handleCategoryChange = (val: string) => {
    let unit = "g";
    if (val === "calories") unit = "kcal";
    else if (val === "gym") unit = "sessions";
    else if (val === "running") unit = "km";
    else if (val === "bodyWeight" || val === "strength") unit = "kg";

    setGoalForm((prev) => ({
      ...prev,
      category: val as any,
      unit,
    }));
  };

  return (
    <div className="app-page">
      <PageHeader
        eyebrow="Coach portal"
        title="A high-level view of athlete readiness, compliance, and progression."
        description="Assign programs, compare athlete performance, monitor nutrition adherence, and send feedback from a single operations dashboard."
        badge={`${summary.flaggedAthletes} athletes flagged`}
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border/40 pb-4 mb-4">
            <div>
              <p className="field-label">Team floor</p>
              <h3 className="mt-1 text-2xl font-semibold text-app-text">Athlete overview</h3>
              <p className="mt-1 text-sm text-app-text-soft">Performance score, training direction, and next action.</p>
            </div>
          </div>

          <div className="grid gap-4">
            {athletes.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-app-border bg-app-surface-strong/80 p-5 text-sm text-app-text-soft">
                No athletes are connected yet. Invite athletes or create coach-linked accounts to populate this view.
              </div>
            ) : (
              athletes.map((athlete) => (
                <div key={athlete.id} className="surface-tile overflow-hidden">
                  <div
                    className="flex cursor-pointer items-center justify-between gap-3 p-1"
                    onClick={() => {
                      setExpandedAthleteId((prev) => (prev === athlete.id ? null : athlete.id));
                      setProfileTab("overview");
                    }}
                  >
                    <div>
                      <p className="font-semibold text-app-text text-base">{athlete.name}</p>
                      <p className="text-xs text-app-text-soft mt-1">{athlete.email}</p>
                    </div>
                    <Button variant="secondary" type="button">
                      {expandedAthleteId === athlete.id ? "Close Panel" : "Inspect Logs"}
                    </Button>
                  </div>

                  {expandedAthleteId === athlete.id && (
                    <div className="mt-4 border-t border-app-border/60 pt-4 animate-page-in">
                      {/* Tabs Bar */}
                      <div className="flex border-b border-app-border/40 mb-4 overflow-x-auto gap-2">
                        {(["overview", "performance", "goals"] as const).map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setProfileTab(tab)}
                            className={`pb-2 px-3 text-xs font-semibold uppercase tracking-wider transition shrink-0 border-b-2 ${
                              profileTab === tab
                                ? "border-app-primary text-app-primary"
                                : "border-transparent text-app-text-soft hover:text-app-text"
                            }`}
                          >
                            {tab === "overview"
                              ? "Overview & Feedback"
                              : tab === "performance"
                              ? "Performance Logs"
                              : "Assign Program Goals"}
                          </button>
                        ))}
                      </div>

                      {/* Tab Content 1: Overview & Feedback */}
                      {profileTab === "overview" && (
                        <div className="space-y-4">
                          {/* Physical Profile Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/20 p-3 rounded-2xl border border-app-border/30">
                            <div>
                              <p className="text-[10px] uppercase text-app-text-soft">Sport</p>
                              <p className="text-sm font-semibold text-app-text">{athlete.profile?.sport || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-app-text-soft">Age</p>
                              <p className="text-sm font-semibold text-app-text">{athlete.profile?.age ? `${athlete.profile.age} yrs` : "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-app-text-soft">Height / Weight</p>
                              <p className="text-sm font-semibold text-app-text">
                                {athlete.profile?.height || "N/A"} cm / {athlete.profile?.weight || "N/A"} kg
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-app-text-soft">Activity Level</p>
                              <p className="text-sm font-semibold text-app-text capitalize">{athlete.profile?.activityLevel || "N/A"}</p>
                            </div>
                          </div>

                          {/* Health Warnings */}
                          {(athlete.profile?.recentInjuries || athlete.profile?.recentIllness) && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 text-xs space-y-1">
                              <p className="font-bold text-red-400 uppercase tracking-wider">Health Status Alerts</p>
                              {athlete.profile?.recentIllness && (
                                <p className="text-app-text">🤒 Illness: <span className="font-medium">{athlete.profile.recentIllness}</span></p>
                              )}
                              {athlete.profile?.recentInjuries && (
                                <p className="text-app-text">🚨 Injury: <span className="font-medium">{athlete.profile.recentInjuries}</span></p>
                              )}
                            </div>
                          )}

                          {athlete.profile?.goalsSummary && (
                            <div>
                              <p className="text-xs font-semibold uppercase text-app-text-soft">Athlete Core Goal</p>
                              <p className="text-sm mt-1 text-app-text italic">"{athlete.profile.goalsSummary}"</p>
                            </div>
                          )}

                          {/* Coach Directives Note */}
                          <div>
                            <label className="text-xs font-semibold uppercase text-app-text-soft">Coach Notes & Medical Directives</label>
                            <textarea
                              className="focus-ring mt-2 w-full rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-xs text-app-text outline-none transition placeholder:text-app-text-soft focus:border-app-primary"
                              rows={3}
                              placeholder="Enter active directives, fatigue warnings, or injury notes..."
                              value={editingNotes[athlete.id] || ""}
                              onChange={(e) => setEditingNotes(prev => ({ ...prev, [athlete.id]: e.target.value }))}
                            />
                            <div className="mt-2 flex justify-end">
                              <Button type="button" onClick={() => handleSaveNotes(athlete.id)}>Save Medical Directive</Button>
                            </div>
                          </div>

                          {/* Coach Direct Message Feedback */}
                          <div className="border-t border-app-border/40 pt-4">
                            <label className="text-xs font-semibold uppercase text-app-text-soft">Direct Feedback (Pushes to Athlete Dashboard)</label>
                            <textarea
                              className="focus-ring mt-2 w-full rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-xs text-app-text outline-none transition placeholder:text-app-text-soft focus:border-app-primary"
                              rows={3}
                              placeholder="Send a motivational tip, training recommendation, or calorie reminder..."
                              value={editingFeedback[athlete.id] || ""}
                              onChange={(e) => setEditingFeedback(prev => ({ ...prev, [athlete.id]: e.target.value }))}
                            />
                            <div className="mt-2 flex justify-end">
                              <Button type="button" onClick={() => handleSaveFeedback(athlete.id)}>Send Feedback Alert</Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tab Content 2: Performance Logs */}
                      {profileTab === "performance" && (
                        <div className="space-y-4">
                          {isLoadingPerformance ? (
                            <p className="text-xs text-app-text-soft text-center py-6">Loading athlete training logs...</p>
                          ) : performanceData ? (
                            <div className="space-y-4">
                              {/* Running History Chart */}
                              <div>
                                <p className="text-xs font-semibold uppercase text-app-text-soft mb-2">Running Logs (km)</p>
                                {performanceData.running.length === 0 ? (
                                  <p className="text-xs text-app-text-soft italic">No running sessions recorded.</p>
                                ) : (
                                  <div className="h-[140px] bg-slate-950/20 p-2 rounded-2xl border border-app-border/30">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart
                                        data={performanceData.running.map((r: any, idx: number) => ({
                                          name: r.loggedAt ? new Date(r.loggedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : `Run ${idx + 1}`,
                                          km: r.distanceKm,
                                        }))}
                                        margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                                      >
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} />
                                        <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} />
                                        <Tooltip />
                                        <Bar dataKey="km" fill="#4c80ff" radius={[4, 4, 0, 0]} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                )}
                              </div>

                              {/* Split Logs Layout */}
                              <div className="grid md:grid-cols-2 gap-4">
                                {/* Gym Workouts */}
                                <div>
                                  <p className="text-xs font-semibold uppercase text-app-text-soft mb-2">Recent Workouts</p>
                                  {performanceData.workouts.length === 0 ? (
                                    <p className="text-xs text-app-text-soft italic">No workouts logged.</p>
                                  ) : (
                                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                      {performanceData.workouts.slice(-3).map((w: any) => (
                                        <div key={w._id || w.id} className="bg-slate-950/20 p-2 rounded-xl border border-app-border/20 text-xs">
                                          <div className="flex justify-between font-semibold">
                                            <span>{w.name}</span>
                                            <span className="text-app-primary">{w.durationMinutes} min</span>
                                          </div>
                                          <p className="text-app-text-soft text-[10px] mt-1 capitalize">Category: {w.category}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Nutrition & Sleep */}
                                <div>
                                  <p className="text-xs font-semibold uppercase text-app-text-soft mb-2">Recent Nutrition</p>
                                  {performanceData.nutrition.length === 0 ? (
                                    <p className="text-xs text-app-text-soft italic">No meals logged.</p>
                                  ) : (
                                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                      {performanceData.nutrition.slice(-3).map((n: any) => (
                                        <div key={n._id || n.id} className="bg-slate-950/20 p-2 rounded-xl border border-app-border/20 text-xs">
                                          <div className="flex justify-between font-semibold">
                                            <span>{n.mealName}</span>
                                            <span className="text-app-accent">{n.calories} kcal</span>
                                          </div>
                                          <p className="text-app-text-soft text-[10px] mt-1">{n.protein}g Protein · {n.carbs}g Carbs · {n.fats}g Fats</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-app-text-soft text-center py-6">Could not load athlete records.</p>
                          )}
                        </div>
                      )}

                      {/* Tab Content 3: Assign Program Goals */}
                      {profileTab === "goals" && (
                        <div className="space-y-4">
                          {/* Active Program Goals list */}
                          <div>
                            <p className="text-xs font-semibold uppercase text-app-text-soft mb-2">Active Goals Checklist</p>
                            {isLoadingPerformance ? (
                              <p className="text-xs text-app-text-soft">Loading goal program checklist...</p>
                            ) : performanceData && performanceData.goals.length > 0 ? (
                              <div className="grid md:grid-cols-2 gap-3">
                                {performanceData.goals.map((goal: any) => {
                                  const pct = Math.min(100, Math.round(((goal.currentValue || 0) / (goal.targetValue || 1)) * 100));
                                  return (
                                    <div key={goal._id || goal.id} className="bg-slate-950/20 p-3 rounded-2xl border border-app-border/20 text-xs">
                                      <div className="flex justify-between font-semibold">
                                        <span>{goal.title}</span>
                                        <span className="text-app-primary">{goal.currentValue}{goal.unit} / {goal.targetValue}{goal.unit}</span>
                                      </div>
                                      <div className="mt-2">
                                        <ProgressBar value={pct} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-app-text-soft italic">No program goals assigned. Assign one below.</p>
                            )}
                          </div>

                          {/* Assign New Goal Form */}
                          <div className="border-t border-app-border/40 pt-4 space-y-3">
                            <p className="text-xs font-bold uppercase text-app-text">Create Program Goal</p>
                            
                            <div className="grid md:grid-cols-2 gap-3">
                              <Input
                                placeholder="Goal Title (e.g. Weekly Cardio Target)"
                                value={goalForm.title}
                                onChange={(e) => setGoalForm(prev => ({ ...prev, title: e.target.value }))}
                              />
                              <div className="flex gap-2">
                                <select
                                  className="focus-ring flex-1 rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-xs text-app-text outline-none transition placeholder:text-app-text-soft focus:border-app-primary"
                                  value={goalForm.category}
                                  onChange={(e) => handleCategoryChange(e.target.value)}
                                >
                                  <option value="protein">Macro: Protein</option>
                                  <option value="calories">Macro: Calories</option>
                                  <option value="running">Running Mileage</option>
                                  <option value="gym">Gym Workouts</option>
                                  <option value="strength">Strength Target</option>
                                  <option value="bodyWeight">Weight Goal</option>
                                </select>
                                <div className="flex items-center justify-center rounded-2xl border border-app-border bg-app-surface px-4 text-xs text-app-text-soft font-semibold min-w-[60px]">
                                  {goalForm.unit}
                                </div>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-3">
                              <Input
                                placeholder="Target Value"
                                type="number"
                                value={goalForm.targetValue}
                                onChange={(e) => setGoalForm(prev => ({ ...prev, targetValue: e.target.value }))}
                              />
                              <Input
                                placeholder="Target Deadline (Optional)"
                                type="date"
                                value={goalForm.deadline}
                                onChange={(e) => setGoalForm(prev => ({ ...prev, deadline: e.target.value }))}
                              />
                            </div>

                            <div className="flex justify-end pt-1">
                              <Button type="button" onClick={() => handleAssignGoal(athlete.id)}>Assign Goal to Athlete</Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card>
            <p className="field-label">Attention queue</p>
            <h3 className="mt-2 text-xl font-semibold text-app-text">Coach actions</h3>
            <div className="mt-4 grid gap-3">
              {summary.notes.length === 0 ? (
                <div className="rounded-2xl border border-app-border bg-app-surface-strong p-4 text-sm text-app-text-soft">
                  No coach actions yet. Tasks will appear once athletes begin logging activity.
                </div>
              ) : (
                summary.notes.map((task) => (
                  <div key={task} className="surface-tile text-xs leading-5 text-app-text font-medium bg-[#1a0e1c]/40 border-purple-500/20">
                    {task}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <p className="field-label">Roster health</p>
            <h3 className="mt-2 text-xl font-semibold text-app-text">Comparison view</h3>
            <div className="mt-4 space-y-4">
              {[
                { label: "Monitored athletes", value: Math.min(100, summary.monitoredAthletes * 20) },
                { label: "Training compliance", value: summary.averageCompliance },
                { label: "Nutrition adherence", value: Math.min(100, Math.round(summary.averageCompliance * 0.95)) },
                { label: "Recovery score", value: Math.min(100, Math.round(summary.averageCompliance * 0.88)) },
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
