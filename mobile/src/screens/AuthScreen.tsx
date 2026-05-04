import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";

type AuthMode = "login" | "register";

export default function AuthScreen() {
  const { login, register, isAuthenticating } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<UserRole>("athlete");
  const [name, setName] = useState("");
  const [sport, setSport] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setErrorMessage(null);
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password.trim()) {
      setErrorMessage("Email and password are required.");
      return;
    }

    if (mode === "register" && !name.trim()) {
      setErrorMessage("Name is required for signup.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    try {
      if (mode === "login") {
        await login({
          email: trimmedEmail,
          password,
          role,
        });
      } else {
        await register({
          name: name.trim(),
          email: trimmedEmail,
          password,
          role,
          sport: sport.trim() || undefined,
        });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed.");
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.brand}>ATHLYTIC</Text>
          <Text style={styles.title}>{mode === "login" ? "Welcome Back" : "Create Account"}</Text>
          <Text style={styles.subtitle}>
            Performance tracking for athletes and coaches. Connected to: {API_BASE_URL}
          </Text>

          <View style={styles.roleRow}>
            {(["athlete", "coach"] as UserRole[]).map((roleOption) => {
              const active = roleOption === role;
              return (
                <TouchableOpacity
                  key={roleOption}
                  style={[styles.roleButton, active ? styles.roleButtonActive : null]}
                  onPress={() => setRole(roleOption)}
                >
                  <Text style={[styles.roleButtonText, active ? styles.roleButtonTextActive : null]}>{roleOption}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {mode === "register" ? (
            <>
              <TextInput
                placeholder="Full name"
                placeholderTextColor="#8ea6cb"
                style={styles.input}
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                placeholder="Primary sport (optional)"
                placeholderTextColor="#8ea6cb"
                style={styles.input}
                autoCapitalize="words"
                value={sport}
                onChangeText={setSport}
              />
            </>
          ) : null}

          <TextInput
            placeholder="Email"
            placeholderTextColor="#8ea6cb"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#8ea6cb"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <TouchableOpacity style={styles.submitButton} onPress={() => void handleSubmit()} disabled={isAuthenticating}>
            {isAuthenticating ? (
              <ActivityIndicator color="#092312" />
            ) : (
              <Text style={styles.submitButtonText}>{mode === "login" ? "Login" : "Create account"}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setErrorMessage(null);
              setMode((current) => (current === "login" ? "register" : "login"));
            }}
          >
            <Text style={styles.toggleText}>
              {mode === "login" ? "New here? Create an account" : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070f22",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#20365d",
    backgroundColor: "#0d1b35",
    padding: 18,
    gap: 12,
  },
  brand: {
    color: "#9db2d6",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 3,
  },
  title: {
    color: "#eef4ff",
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    color: "#9db2d6",
    fontSize: 12,
    lineHeight: 18,
  },
  roleRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  roleButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2b4168",
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#132547",
  },
  roleButtonActive: {
    backgroundColor: "#8dff4f",
    borderColor: "#8dff4f",
  },
  roleButtonText: {
    color: "#d7e5ff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  roleButtonTextActive: {
    color: "#0b2713",
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a4067",
    backgroundColor: "#142747",
    color: "#ecf4ff",
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  errorText: {
    color: "#ff8f8f",
    fontSize: 13,
    fontWeight: "600",
  },
  submitButton: {
    borderRadius: 12,
    backgroundColor: "#8dff4f",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  submitButtonText: {
    color: "#092312",
    fontWeight: "800",
    fontSize: 14,
  },
  toggleText: {
    marginTop: 6,
    color: "#99b8f2",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 12,
  },
});
