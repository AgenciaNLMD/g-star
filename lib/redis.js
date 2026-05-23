import { Redis } from "ioredis"

const globalForRedis = globalThis

function createRedis() {
  if (!process.env.REDIS_URL) return null
  return new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 })
}

export const redis = globalForRedis.redis ?? createRedis()

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis
