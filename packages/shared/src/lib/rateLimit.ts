/**
 * Edge Sliding-Window Rate Limiter
 * Cybersecurity Hardening against DoS, brute force, and form spam.
 */

export interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
}

export const RATE_LIMIT_RULES = {
  // Public contact inquiries: 5 per 10 minutes
  INQUIRIES: { windowMs: 10 * 60 * 1000, maxRequests: 5 },
  // Auth actions & recovery: 10 per 15 minutes
  AUTH: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  // Dedicated image uploads: 15 uploads per 10 minutes
  UPLOAD: { windowMs: 10 * 60 * 1000, maxRequests: 15 },
  // General write mutations: 60 per minute
  WRITES: { windowMs: 60 * 1000, maxRequests: 60 },
  // Public link clicks: 30 per minute
  CLICKS: { windowMs: 60 * 1000, maxRequests: 30 },
} as const;

// Global in-memory timestamp store per edge worker instance
const MAX_CACHE_ENTRIES = 10000;
const hitCache = new Map<string, number[]>();

// Prevent edge worker memory exhaustion: evict stale entries
function cleanupStaleEntries() {
  if (hitCache.size < MAX_CACHE_ENTRIES) return;
  const now = Date.now();
  for (const [key, hits] of hitCache.entries()) {
    if (hits.length === 0 || hits[hits.length - 1] < now - 15 * 60 * 1000) {
      hitCache.delete(key);
    }
  }
}

export function getClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const xForwarded = request.headers.get("x-forwarded-for");
  if (xForwarded) {
    const first = xForwarded.split(",")[0];
    if (first) return first.trim();
  }

  const trueClientIp = request.headers.get("true-client-ip");
  if (trueClientIp) return trueClientIp.trim();

  return "127.0.0.1";
}

export function checkRateLimit(
  key: string,
  rule: RateLimitRule
): { allowed: boolean; remaining: number; resetInMs: number } {
  cleanupStaleEntries();
  const now = Date.now();
  const windowStart = now - rule.windowMs;

  // Clean old entries
  const existing = hitCache.get(key) || [];
  const validHits = existing.filter((t) => t > windowStart);

  if (validHits.length >= rule.maxRequests) {
    const oldestHit = validHits[0];
    const resetInMs = Math.max(0, oldestHit + rule.windowMs - now);
    hitCache.set(key, validHits);
    return {
      allowed: false,
      remaining: 0,
      resetInMs,
    };
  }

  validHits.push(now);
  hitCache.set(key, validHits);

  return {
    allowed: true,
    remaining: rule.maxRequests - validHits.length,
    resetInMs: rule.windowMs,
  };
}

export function enforceRateLimit(
  request: Request,
  scope: string,
  rule: RateLimitRule = RATE_LIMIT_RULES.WRITES
): Response | null {
  const ip = getClientIp(request);
  const cacheKey = `${scope}:${ip}`;
  const result = checkRateLimit(cacheKey, rule);

  if (!result.allowed) {
    const retryAfterSec = Math.ceil(result.resetInMs / 1000);
    return new Response(
      JSON.stringify({
        error: "Too many requests. Please wait a few moments before trying again.",
        retryAfter: retryAfterSec,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfterSec),
        },
      }
    );
  }

  return null;
}
