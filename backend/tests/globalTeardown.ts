// Runs once after all tests finish.



import { prisma } from "../src/config/db";
import { redis, cacheRedis } from "../src/config/redis";
import { server } from "../src/index";

export default async () => {
  await prisma.$disconnect();

  if (redis) {
    await redis.quit();
  }

  if (cacheRedis) {
    await cacheRedis.quit();
  }

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
};