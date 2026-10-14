interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * In-memory sliding-window rate limiter, scoped per Next.js server instance.
 * Sufficient as a baseline abuse guard for a low-traffic app; on serverless
 * platforms each cold instance starts with an empty counter, so this is not
 * a hard guarantee under high concurrency — swap for Upstash/Redis if the
 * app ever needs a cross-instance limit.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();

  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (now > b.resetAt) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}
