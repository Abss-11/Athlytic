export function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

export function isPositiveNumber(value: string) {
  return Number(value) > 0;
}
