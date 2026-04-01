import { Queue } from "bullmq";
import { redis } from "../config/redis";



export const exportQueue = new Queue("exports", {
  connection: redis,
});