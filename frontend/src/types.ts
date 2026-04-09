export type UserRole = "athlete" | "coach";

export interface NavItem {
  label: string;
  path: string;
}

export interface MacroBreakdown {
  protein: number;
  carbs: number;
  fats: number;
}

export interface StatCardData {
  label: string;
  value: string;
  delta: string;
  tone: "positive" | "neutral";
}

export interface GoalData {
  id: string;
  title: string;
  progress: number;
  target: string;
  current: string;
}

export interface WorkoutEntry {
  id: string;
  focus: string;
  volume: string;
  duration: string;
  intensity: string;
}

export interface RunningEntry {
  id: string;
  label: string;
  distance: number;
  pace: string;
  vo2Max: number;
}

export interface CommunityPost {
  id: string;
  athlete: string;
  role: string;
  content: string;
  metric: string;
  likes: number;
}

export interface Achievement {
  id: string;
  label: string;
  description: string;
}

export interface MacroPlanTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  waterLiters: number;
  sleepHours: number;
  runningDistanceKm: number;
}

export interface MacroPlan {
  hasEnoughProfileData: boolean;
  dailyTargets: MacroPlanTargets;
  estimatedBmr: number | null;
  estimatedTdee: number | null;
  bmi: number | null;
  aiAdvice: string[];
  dietSuggestions: string[];
}
