import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { api, extractApiErrorMessage } from "../api/client";
import type { DashboardAthleteResponse, DashboardCoachResponse, UserRole } from "../types";

type DashboardScreenProps = {
  role: UserRole;
};

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statHint}>{hint}</Text>
    </View>
  );
}

export default function DashboardScreen({ role }: DashboardScreenProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [athleteData, setAthleteData] = useState<DashboardAthleteResponse | null>(null);
  const [coachData, setCoachData] = useState<DashboardCoachResponse | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      if (role === "coach") {
        const response = await api.get<DashboardCoachResponse>("/dashboard/coach");
        setCoachData(response.data);
        setAthleteData(null);
      } else {
        const response = await api.get<DashboardAthleteResponse>("/dashboard/athlete");
        setAthleteData(response.data);
        setCoachData(null);
      }
    } catch (error) {
      setError(extractApiErrorMessage(error, "Could not load dashboard right now."));
    }
  }, [role]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      await loadData();
      setLoading(false);
    }

    void fetchData();
  }, [loadData]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#8dff4f" size="large" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor="#8dff4f" />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>{role === "coach" ? "Coach Dashboard" : "Athlete Dashboard"}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={() => void handleRefresh()}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {role === "coach" ? (
        <View style={styles.grid}>
          <StatCard
            label="Monitored Athletes"
            value={String(coachData?.monitoredAthletes ?? 0)}
            hint="Total athletes in your panel"
          />
          <StatCard
            label="Flagged Athletes"
            value={String(coachData?.flaggedAthletes ?? 0)}
            hint="Need attention this week"
          />
          <StatCard
            label="Compliance"
            value={`${coachData?.averageCompliance ?? 0}%`}
            hint="Average program completion"
          />
        </View>
      ) : (
        <View style={styles.grid}>
          <StatCard
            label="Performance Score"
            value={`${athleteData?.performanceScore ?? 0} / 100`}
            hint="Daily overall performance"
          />
          <StatCard
            label="Readiness Score"
            value={`${athleteData?.readinessScore ?? 0} / 100`}
            hint="Recovery and training readiness"
          />
          <StatCard
            label="Protein Today"
            value={`${athleteData?.dailyStats?.protein?.today ?? 0}g`}
            hint={`Target ${athleteData?.dailyStats?.protein?.target ?? 0}g`}
          />
          <StatCard
            label="Calories Today"
            value={`${athleteData?.dailyStats?.calories?.today ?? 0} kcal`}
            hint={`Target ${athleteData?.dailyStats?.calories?.target ?? 0} kcal`}
          />
          <StatCard
            label="Sleep Today"
            value={`${athleteData?.dailyStats?.sleep?.today ?? 0} hrs`}
            hint={`Target ${athleteData?.dailyStats?.sleep?.target ?? 0} hrs`}
          />
          <StatCard
            label="Workouts Today"
            value={`${athleteData?.dailyStats?.workouts?.today ?? 0}`}
            hint={`Target ${athleteData?.dailyStats?.workouts?.target ?? 0}`}
          />
        </View>
      )}

      {role === "athlete" && Array.isArray(athleteData?.aiInsights) && athleteData.aiInsights.length > 0 ? (
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>AI Performance Insights</Text>
          {athleteData.aiInsights.slice(0, 4).map((insight) => (
            <Text key={insight} style={styles.insightText}>
              • {insight}
            </Text>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: "#9db2d6",
    fontWeight: "600",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#eef4ff",
    fontSize: 22,
    fontWeight: "800",
  },
  refreshButton: {
    borderWidth: 1,
    borderColor: "#324f7e",
    borderRadius: 10,
    backgroundColor: "#152b4f",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  refreshButtonText: {
    color: "#d5e5ff",
    fontSize: 12,
    fontWeight: "700",
  },
  errorText: {
    color: "#ff9a9a",
    fontWeight: "600",
  },
  grid: {
    gap: 10,
  },
  statCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#213a63",
    backgroundColor: "#112243",
    padding: 12,
    gap: 4,
  },
  statLabel: {
    color: "#8ea6cb",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statValue: {
    color: "#eaf3ff",
    fontSize: 24,
    fontWeight: "800",
  },
  statHint: {
    color: "#97add1",
    fontSize: 12,
  },
  insightsCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#324f7e",
    backgroundColor: "#0f1f3e",
    padding: 12,
    gap: 8,
  },
  insightsTitle: {
    color: "#9cff64",
    fontWeight: "800",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  insightText: {
    color: "#d5e4ff",
    fontSize: 13,
    lineHeight: 18,
  },
});
