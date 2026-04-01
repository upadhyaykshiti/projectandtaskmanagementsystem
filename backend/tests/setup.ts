//Runs before each test file.

import { prisma } from "../src/config/db";

beforeEach(async () => {
  // Clean database before every test
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});