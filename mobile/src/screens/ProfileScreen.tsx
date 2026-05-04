import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { API_BASE_URL } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      Alert.alert("Logout failed", "Please try again.");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{user?.name || "-"}</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email || "-"}</Text>
        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{user?.role || "-"}</Text>
        <Text style={styles.label}>Primary Sport</Text>
        <Text style={styles.value}>{user?.profile?.sport || "Not set"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>API Base URL</Text>
        <Text style={styles.value}>{API_BASE_URL}</Text>
        <Text style={styles.hint}>
          For physical device testing, set `EXPO_PUBLIC_API_URL` to your laptop IP, e.g. `http://192.168.x.x:5000/api`.
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={() => void handleLogout()}>
        <Text style={styles.logoutButtonText}>Log out</Text>
      </TouchableOpacity>
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
  title: {
    color: "#eef4ff",
    fontSize: 20,
    fontWeight: "800",
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#223a62",
    backgroundColor: "#112342",
    padding: 12,
    gap: 4,
  },
  label: {
    marginTop: 6,
    color: "#8ea6cb",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  value: {
    color: "#e9f2ff",
    fontSize: 15,
    fontWeight: "700",
  },
  hint: {
    marginTop: 6,
    color: "#9cb1d5",
    fontSize: 12,
    lineHeight: 18,
  },
  logoutButton: {
    marginTop: 6,
    borderRadius: 12,
    backgroundColor: "#ff6f91",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  logoutButtonText: {
    color: "#330916",
    fontSize: 14,
    fontWeight: "800",
  },
});
