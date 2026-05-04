import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api, extractApiErrorMessage } from "../api/client";
import type { WorkoutLog } from "../types";

type WorkoutSetForm = {
  id: string;
  reps: string;
  weightLifted: string;
};

const bodyRegionOptions = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Sports", "Other"];
const intensityOptions = ["Low", "Medium", "High", "Max"] as const;

function createSetId() {
  return `set-${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptySet(): WorkoutSetForm {
  return {
    id: createSetId(),
    reps: "",
    weightLifted: "",
  };
}

function getWorkoutAverageSetWeight(workout: WorkoutLog) {
  if (typeof workout.averageSetWeightKg === "number") {
    return Math.round((workout.averageSetWeightKg + Number.EPSILON) * 100) / 100;
  }

  const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
  let totalSets = 0;
  let totalSetWeight = 0;

  exercises.forEach((exercise) => {
    if (Array.isArray(exercise.setLogs) && exercise.setLogs.length > 0) {
      totalSets += exercise.setLogs.length;
      totalSetWeight += exercise.setLogs.reduce((sum, setLog) => sum + (setLog.weightLifted || 0), 0);
      return;
    }

    const sets = exercise.sets || 0;
    totalSets += sets;
    totalSetWeight += sets * (exercise.weightLifted || 0);
  });

  if (totalSets <= 0) {
    return workout.weightLifted || 0;
  }

  return Math.round(((totalSetWeight / totalSets) + Number.EPSILON) * 100) / 100;
}

export default function WorkoutScreen() {
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focus, setFocus] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [intensity, setIntensity] = useState<(typeof intensityOptions)[number]>("Medium");
  const [exerciseName, setExerciseName] = useState("");
  const [bodyRegion, setBodyRegion] = useState("Other");
  const [setRows, setSetRows] = useState<WorkoutSetForm[]>([createEmptySet()]);

  const loadWorkouts = useCallback(async () => {
    setErrorMessage(null);
    try {
      const response = await api.get<WorkoutLog[]>("/workouts");
      setWorkouts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, "Could not load workouts."));
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      await loadWorkouts();
      setLoading(false);
    }

    void fetchData();
  }, [loadWorkouts]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadWorkouts();
    setRefreshing(false);
  }

  function updateSetRow(setId: string, field: "reps" | "weightLifted", value: string) {
    setSetRows((current) => current.map((setLog) => (setLog.id === setId ? { ...setLog, [field]: value } : setLog)));
  }

  function addSetRow() {
    setSetRows((current) => [...current, createEmptySet()]);
  }

  function removeSetRow(setId: string) {
    setSetRows((current) => {
      if (current.length <= 1) {
        return [createEmptySet()];
      }

      return current.filter((setLog) => setLog.id !== setId);
    });
  }

  function resetForm() {
    setFocus("");
    setDurationMinutes("");
    setIntensity("Medium");
    setExerciseName("");
    setBodyRegion("Other");
    setSetRows([createEmptySet()]);
  }

  async function handleSaveWorkout() {
    setErrorMessage(null);
    if (!focus.trim()) {
      setErrorMessage("Session title is required.");
      return;
    }

    if (!exerciseName.trim()) {
      setErrorMessage("Exercise name is required.");
      return;
    }

    const normalizedSetLogs = [];
    for (let index = 0; index < setRows.length; index += 1) {
      const row = setRows[index];
      const reps = Number(row.reps);
      const weightLifted = Number(row.weightLifted);

      if (!Number.isInteger(reps) || reps < 1 || reps > 300) {
        setErrorMessage(`Set ${index + 1}: reps must be a whole number between 1 and 300.`);
        return;
      }

      if (Number.isNaN(weightLifted) || weightLifted < 0 || weightLifted > 2000) {
        setErrorMessage(`Set ${index + 1}: weight must be between 0 and 2000 kg.`);
        return;
      }

      normalizedSetLogs.push({
        reps,
        weightLifted,
      });
    }

    if (normalizedSetLogs.length === 0) {
      setErrorMessage("Please add at least one set.");
      return;
    }

    const parsedDuration = durationMinutes.trim().length > 0 ? Number(durationMinutes) : undefined;
    if (parsedDuration !== undefined && (Number.isNaN(parsedDuration) || parsedDuration < 1 || parsedDuration > 720)) {
      setErrorMessage("Duration must be between 1 and 720 minutes.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/workouts", {
        focus: focus.trim(),
        intensity,
        ...(parsedDuration ? { durationMinutes: parsedDuration } : {}),
        exercises: [
          {
            name: exerciseName.trim(),
            bodyRegion,
            setLogs: normalizedSetLogs,
          },
        ],
      });

      resetForm();
      await loadWorkouts();
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, "Could not save workout."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#8dff4f" size="large" />
        <Text style={styles.loadingText}>Loading workouts...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor="#8dff4f" />}
    >
      <Text style={styles.title}>Log Workout Session</Text>

      <View style={styles.formCard}>
        <TextInput
          placeholder="Session title (e.g. Push Day)"
          placeholderTextColor="#8ea6cb"
          style={styles.input}
          value={focus}
          onChangeText={setFocus}
        />
        <TextInput
          placeholder="Duration (minutes, optional)"
          placeholderTextColor="#8ea6cb"
          style={styles.input}
          value={durationMinutes}
          onChangeText={setDurationMinutes}
          keyboardType="numeric"
        />
        <Text style={styles.label}>Intensity</Text>
        <View style={styles.rowWrap}>
          {intensityOptions.map((entry) => {
            const active = entry === intensity;
            return (
              <TouchableOpacity
                key={entry}
                style={[styles.pill, active ? styles.pillActive : null]}
                onPress={() => setIntensity(entry)}
              >
                <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>{entry}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          placeholder="Exercise name"
          placeholderTextColor="#8ea6cb"
          style={styles.input}
          value={exerciseName}
          onChangeText={setExerciseName}
        />
        <Text style={styles.label}>Body Region</Text>
        <View style={styles.rowWrap}>
          {bodyRegionOptions.map((region) => {
            const active = region === bodyRegion;
            return (
              <TouchableOpacity
                key={region}
                style={[styles.pill, active ? styles.pillActive : null]}
                onPress={() => setBodyRegion(region)}
              >
                <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>{region}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.setHeader}>
          <Text style={styles.label}>Set Logs</Text>
          <TouchableOpacity style={styles.inlineButton} onPress={addSetRow}>
            <Text style={styles.inlineButtonText}>Add Set</Text>
          </TouchableOpacity>
        </View>
        {setRows.map((setLog, index) => (
          <View key={setLog.id} style={styles.setRow}>
            <Text style={styles.setIndex}>Set {index + 1}</Text>
            <TextInput
              placeholder="Reps"
              placeholderTextColor="#8ea6cb"
              style={[styles.input, styles.smallInput]}
              value={setLog.reps}
              onChangeText={(value) => updateSetRow(setLog.id, "reps", value)}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Weight"
              placeholderTextColor="#8ea6cb"
              style={[styles.input, styles.smallInput]}
              value={setLog.weightLifted}
              onChangeText={(value) => updateSetRow(setLog.id, "weightLifted", value)}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.removeSetButton} onPress={() => removeSetRow(setLog.id)}>
              <Text style={styles.removeSetButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <TouchableOpacity style={styles.saveButton} onPress={() => void handleSaveWorkout()} disabled={saving}>
          {saving ? <ActivityIndicator color="#072012" /> : <Text style={styles.saveButtonText}>Save workout</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Recent Workouts</Text>
      {workouts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No workouts yet. Log your first session above.</Text>
        </View>
      ) : (
        workouts.slice(0, 12).map((workout) => (
          <View key={workout.id} style={styles.workoutCard}>
            <Text style={styles.workoutTitle}>{workout.focus}</Text>
            <Text style={styles.workoutMeta}>
              {workout.intensity || "Medium"} • {workout.sets || 0} sets • {workout.durationMinutes || 0} min
            </Text>
            <Text style={styles.workoutMeta}>Avg set weight: {getWorkoutAverageSetWeight(workout)} kg/set</Text>
          </View>
        ))
      )}
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
  title: {
    color: "#eef4ff",
    fontSize: 20,
    fontWeight: "800",
  },
  formCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#213a63",
    backgroundColor: "#112243",
    padding: 12,
    gap: 10,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a4067",
    backgroundColor: "#15284a",
    color: "#eef4ff",
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
  },
  label: {
    color: "#9cb1d5",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#35537e",
    backgroundColor: "#142949",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pillActive: {
    borderColor: "#8dff4f",
    backgroundColor: "#8dff4f",
  },
  pillText: {
    color: "#d4e2ff",
    fontSize: 12,
    fontWeight: "700",
  },
  pillTextActive: {
    color: "#08230f",
  },
  setHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inlineButton: {
    borderWidth: 1,
    borderColor: "#2c4368",
    borderRadius: 8,
    backgroundColor: "#173057",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  inlineButtonText: {
    color: "#d7e5ff",
    fontSize: 11,
    fontWeight: "700",
  },
  setRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#26406b",
    backgroundColor: "#132847",
    padding: 8,
    gap: 8,
  },
  setIndex: {
    color: "#8ea6cb",
    fontSize: 11,
    fontWeight: "700",
  },
  smallInput: {
    paddingVertical: 8,
  },
  removeSetButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#70445a",
    backgroundColor: "#402131",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  removeSetButtonText: {
    color: "#ffb2c1",
    fontSize: 11,
    fontWeight: "700",
  },
  errorText: {
    color: "#ff9797",
    fontWeight: "700",
    fontSize: 12,
  },
  saveButton: {
    borderRadius: 10,
    backgroundColor: "#8dff4f",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 2,
  },
  saveButtonText: {
    color: "#072012",
    fontWeight: "800",
    fontSize: 13,
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#213a63",
    backgroundColor: "#10203d",
    padding: 12,
  },
  emptyText: {
    color: "#9cb1d5",
    fontSize: 13,
  },
  workoutCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#223c64",
    backgroundColor: "#10213f",
    padding: 12,
    gap: 4,
  },
  workoutTitle: {
    color: "#eef4ff",
    fontWeight: "800",
    fontSize: 15,
  },
  workoutMeta: {
    color: "#9cb1d5",
    fontSize: 12,
  },
});
