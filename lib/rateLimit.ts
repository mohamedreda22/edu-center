import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const hasRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

let ratelimit: Ratelimit | null = null;

if (hasRedis) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(5, '60 s'),
    prefix: 'ratelimit',
  });
}

export { ratelimit };

export async function checkRateLimit(ip: string): Promise<{ success: boolean }> {
  if (!ratelimit) {
    return { success: true };
  }
  return ratelimit.limit(ip);
}
