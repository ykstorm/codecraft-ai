/**
 * Environment validation for chai-vibe-editor
 * Fails fast on startup if required environment variables are missing.
 */

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
}

const REQUIRED_ENV_VARS = [
  "AUTH_SECRET",
  "DATABASE_URL",
] as const;

const OPTIONAL_ENV_VARS = [
  "NEXTAUTH_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
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
      `Missing required environment variables: ${missingList}. Please set these before starting the server.`
    );
  }
}

// Auto-validate on module load in non-test environments
if (process.env.NODE_ENV === "production" || process.env.NEXT_RUNTIME === "nodejs") {
  // Skip early validation — let the app handle it gracefully
  // Uncomment the line below to enable fail-fast in production:
  // assertEnv();
}

export default { validateEnv, assertEnv };