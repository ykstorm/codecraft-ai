/**
 * Environment validation for required runtime variables.
 * Throws a descriptive error if any required variable is missing.
 */

const REQUIRED_ENV_VARS = [
  "AUTH_SECRET",
  "AUTH_GITHUB_ID",
  "AUTH_GOOGLE_ID",
  "DATABASE_URL",
] as const;

export type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
}

export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];

  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName] || process.env[varName]?.trim() === "") {
      missing.push(varName);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

export function assertEnv(): void {
  const result = validateEnv();
  if (!result.valid) {
    const missingList = result.missing.join(", ");
    throw new Error(
      `Missing required environment variables: ${missingList}. ` +
        `Please set these variables in your .env file or environment.`
    );
  }
}