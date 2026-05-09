// Simple in-memory rate limiter for AI endpoints.
// Use @upstash/ratelimit + @upstash/redis for production deployments.
// For Vercel: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Sliding window: 20 requests per 60 seconds per IP
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(ip: string): {
  success: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  // Clean up expired entries
  if (entry && now > entry.resetAt) {
    rateLimitStore.delete(ip);
  }

  const current = rateLimitStore.get(ip);

  if (!current || now > current.resetAt) {
    const resetAt = now + WINDOW_MS;
    rateLimitStore.set(ip, { count: 1, resetAt });
    return { success: true, remaining: MAX_REQUESTS - 1, resetAt };
  }

  if (current.count >= MAX_REQUESTS) {
    return { success: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count++;
  return {
    success: true,
    remaining: MAX_REQUESTS - current.count,
    resetAt: current.resetAt,
  };
}

export const RATE_LIMIT_ERROR = {
  error: "Too many requests. Please slow down.",
  retryAfter: 60,
};