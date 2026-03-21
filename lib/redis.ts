import Redis from "ioredis";

const globalForRedis = global as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

redis.on("error", (err) => {
  console.error("Redis connection error in lib/redis.ts:", err.message);
});

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
