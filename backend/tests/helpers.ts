import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import supertest from "supertest";
import app from "../src/index";

export const prisma = new PrismaClient();

export async function cleanDb() {
  // Delete in dependency order
  await prisma.export.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
}

export async function createUser(overrides?: Partial<{ name: string; email: string; password: string }>) {
  const data = {
    name: overrides?.name ?? "Test User",
    email: overrides?.email ?? `test_${Date.now()}@example.com`,
    password: overrides?.password ?? "password123",
  };
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash },
  });
  return { user, password: data.password };
}

export async function loginUser(email: string, password: string) {
  const res = await supertest(app)
    .post("/api/auth/login")
    .send({ email, password });
  return res.body.data as { accessToken: string; refreshToken: string };
}

export async function createProject(
  ownerId: string,
  name = "Test Project"
) {
  return prisma.project.create({
    data: {
      name,
      ownerId,
      members: { create: { userId: ownerId, role: "owner" } },
    },
  });
}