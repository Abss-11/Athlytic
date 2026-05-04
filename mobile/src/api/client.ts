import axios from "axios";
import { Platform } from "react-native";

const platformDefaultApiBaseUrl =
  Platform.select({
    android: "http://10.0.2.2:5000/api",
    ios: "http://127.0.0.1:5000/api",
    default: "http://127.0.0.1:5000/api",
  }) || "http://127.0.0.1:5000/api";

const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = (configuredApiBaseUrl && configuredApiBaseUrl.length > 0
  ? configuredApiBaseUrl
  : platformDefaultApiBaseUrl
).replace(/\/$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export function setApiToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}

export function extractApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { message?: unknown } | undefined;
    if (typeof payload?.message === "string" && payload.message.trim().length > 0) {
      return payload.message;
    }

    if (typeof error.message === "string" && error.message.trim().length > 0) {
      return error.message;
    }
  }

  return fallback;
}
