import { useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import AuthProvider, { useAuth } from "./src/context/AuthContext";
import AuthScreen from "./src/screens/AuthScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import WorkoutScreen from "./src/screens/WorkoutScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

type AppTab = "dashboard" | "workouts" | "profile";

const tabLabels: Record<AppTab, string> = {
  dashboard: "Dashboard",
  workouts: "Workouts",
  profile: "Profile",
};

function MainApp() {
  const { user, isBootstrapping } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");

  if (isBootstrapping) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#8dff4f" size="large" />
        <Text style={styles.loadingText}>Preparing Athlytic Mobile...</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Athlytic Mobile</Text>
        <Text style={styles.headerSubtitle}>Logged in as {user.role}</Text>
      </View>

      <View style={styles.content}>
        {activeTab === "dashboard" ? <DashboardScreen role={user.role} /> : null}
        {activeTab === "workouts" ? <WorkoutScreen /> : null}
        {activeTab === "profile" ? <ProfileScreen /> : null}
      </View>

      <View style={styles.tabBar}>
        {(Object.keys(tabLabels) as AppTab[]).map((tab) => {
          const isActive = tab === activeTab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.85}
              style={[styles.tabButton, isActive ? styles.tabButtonActive : null]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabButtonText, isActive ? styles.tabButtonTextActive : null]}>{tabLabels[tab]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#070f22",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#070f22",
    gap: 12,
  },
  loadingText: {
    color: "#9db2d6",
    fontSize: 15,
    fontWeight: "600",
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#182641",
  },
  headerTitle: {
    color: "#e7f0ff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    marginTop: 2,
    color: "#8ea6cb",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#182641",
    backgroundColor: "#0a142b",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tabButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#223456",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111e38",
  },
  tabButtonActive: {
    backgroundColor: "#8dff4f",
    borderColor: "#8dff4f",
  },
  tabButtonText: {
    color: "#d4e2ff",
    fontSize: 12,
    fontWeight: "700",
  },
  tabButtonTextActive: {
    color: "#062013",
  },
});
