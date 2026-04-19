export function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

export function isPositiveNumber(value: string) {
  return Number(value) > 0;
}

export function extractApiErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object"
  ) {
    const payload = error.response.data as { message?: unknown; errors?: Array<{ message?: unknown }> };
    if (typeof payload.message === "string" && payload.message.trim()) {
      if (Array.isArray(payload.errors) && payload.errors.length > 0 && typeof payload.errors[0]?.message === "string") {
        return `${payload.message} ${payload.errors[0].message}`;
      }
      return payload.message;
    }
  }

  return fallback;
}
