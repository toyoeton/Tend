const requiredEnvNames = [
  "DATABASE_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "PAYSTACK_SECRET_KEY",
  "PAYSTACK_PUBLIC_KEY",
  "RESEND_API_KEY",
  "CANCELLATION_WINDOW_HOURS",
  "ENCRYPTION_KEY"
] as const;

export type RequiredEnvName = (typeof requiredEnvNames)[number];

export function validateEnv(): void {
  const errors: string[] = [];

  for (const name of requiredEnvNames) {
    if (!process.env[name]) {
      errors.push(`Missing required environment variable: ${name}`);
    }
  }

  const cancellationWindow = process.env.CANCELLATION_WINDOW_HOURS;
  if (cancellationWindow && !Number.isFinite(Number.parseInt(cancellationWindow, 10))) {
    errors.push("CANCELLATION_WINDOW_HOURS must be a whole number");
  }

  if (errors.length > 0) {
    throw new Error(`Tend configuration error:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
}

validateEnv();

export function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function optionalEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}

export function cancellationWindowHours(): number {
  const value = env("CANCELLATION_WINDOW_HOURS");
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error("Tend configuration error: CANCELLATION_WINDOW_HOURS must be a whole number");
  }
  return parsed;
}
