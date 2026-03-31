

import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null, // Required for BullMQ
});

export const cacheRedis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

// Cache key patterns
export const CacheKeys = {
  userProjects: (userId: string) => `projects:user:${userId}`,
  project: (projectId: string) => `project:${projectId}`,
  refreshToken: (token: string) => `refresh:${token}`,
};

export const CacheTTL = {
  userProjects: 300,  // 5 minutes
  project: 120,       // 2 minutes
};