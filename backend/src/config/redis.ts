




import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const isTest = process.env.NODE_ENV === "test";

/**
 * Mock Redis client used in tests
 */
function createMockRedis() {
  return {
    get: async () => null,
    set: async () => "OK",
    setex: async () => "OK",
    del: async () => 1,
    quit: async () => {},
    on: () => {},
    duplicate: () => createMockRedis(),
  };
}

/**
 * Real Redis client
 */
function createRealRedis() {
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  client.on("error", () => {});
  return client;
}

/**
 * Export redis for BullMQ + app
 */
export const redis: any = isTest
  ? {
      ...createMockRedis(),
      host: "127.0.0.1",
      port: 6379,
      lazyConnect: true,
    }
  : createRealRedis();

/**
 * Export cache redis
 */
export const cacheRedis: any = isTest
  ? createMockRedis()
  : new Redis(REDIS_URL);

// Cache key patterns
export const CacheKeys = {
  userProjects: (userId: string) => `projects:user:${userId}`,
  project: (projectId: string) => `project:${projectId}`,
  refreshToken: (token: string) => `refresh:${token}`,
};

export const CacheTTL = {
  userProjects: 300,
  project: 120,
};