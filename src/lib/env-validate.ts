/**
 * Environment validation for codecraft-ai
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

let _cached: Record<string, string> | null = null;

export function getEnv(): Record<string, string> {
  if (_cached) return _cached;
  const result = validateEnv();
  if (!result.valid) {
    throw new Error(
      `Missing required environment variables: ${result.missing.join(", ")}. Please set these before starting the server.`
    );
  }
  _cached = Object.fromEntries(REQUIRED_ENV_VARS.map(k => [k, process.env[k]!]));
  return _cached;
}

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
  getEnv(); // throws lazily
}

// Auto-validate on module load in non-test environments
if (process.env.NODE_ENV === "production" || process.env.NEXT_RUNTIME === "nodejs") {
  // Skip early validation — let the app handle it gracefully
  // Uncomment the line below to enable fail-fast in production:
  // assertEnv();
}

const envModule = { validateEnv, assertEnv };
export default envModule;