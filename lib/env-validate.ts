/**
 * The environment sign-in needs, checked at run time.
 *
 * Without every one of these variables the deployment runs the playground
 * only: proxy.ts answers 503 for the pages behind sign-in and for
 * /api/auth/*, and the landing header leaves out the dashboard link.
 */

const REQUIRED_ENV_VARS = [
  "AUTH_SECRET",
  "AUTH_GITHUB_ID",
  "AUTH_GITHUB_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "DATABASE_URL",
] as const;

interface EnvValidationResult {
  valid: boolean;
  missing: string[];
}

type Env = Record<string, string | undefined>;

export function validateEnv(env: Env = process.env): EnvValidationResult {
  const missing: string[] = [];

  for (const varName of REQUIRED_ENV_VARS) {
    if (!env[varName] || env[varName]?.trim() === "") {
      missing.push(varName);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/** True when sign-in can work: every variable above is set and not blank. */
export function isAuthConfigured(env: Env = process.env): boolean {
  return validateEnv(env).valid;
}

export function assertEnv(): void {
  const result = validateEnv();
  if (!result.valid) {
    throw new Error(
      `Missing required environment variables: ${result.missing.join(", ")}. ` +
        `Please set these variables in your .env file or environment.`
    );
  }
}
