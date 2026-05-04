export type UserRole = "athlete" | "coach";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profile?: {
    sport?: string;
  };
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type DashboardAthleteResponse = {
  performanceScore?: number;
  readinessScore?: number;
  aiInsights?: string[];
  dailyStats?: {
    protein?: { today?: number; target?: number };
    calories?: { today?: number; target?: number };
    sleep?: { today?: number; target?: number };
    workouts?: { today?: number; target?: number };
  };
};

export type DashboardCoachResponse = {
  monitoredAthletes?: number;
  flaggedAthletes?: number;
  averageCompliance?: number;
  notes?: string[];
};

export type WorkoutSetLog = {
  reps: number;
  weightLifted: number;
};

export type WorkoutExercise = {
  name: string;
  bodyRegion: string;
  sets: number;
  reps: number;
  weightLifted: number;
  restSeconds?: number;
  setLogs?: WorkoutSetLog[];
};

export type WorkoutLog = {
  id: string;
  focus: string;
  intensity?: string;
  durationMinutes?: number;
  sets?: number;
  weightLifted?: number;
  averageSetWeightKg?: number;
  exercises?: WorkoutExercise[];
};
