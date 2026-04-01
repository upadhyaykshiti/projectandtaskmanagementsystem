
import request from "supertest";
import app from "../src/index";
import { prisma } from "../src/config/db";
import { createUser, loginUser, createProject } from "./helpers";

const api = request(app);

// Test 1
describe("POST /api/auth/register", () => {
  it("registers a new user successfully", async () => {
    const res = await api.post("/api/auth/register").send({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe("alice@example.com");
    expect(res.body.data).not.toHaveProperty("passwordHash");
  });
});

// Test 2
describe("POST /api/auth/login", () => {
  it("returns access + refresh tokens", async () => {
    const { user } = await createUser({ email: "bob@example.com" });

    const res = await api.post("/api/auth/login").send({
      email: "bob@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data).toHaveProperty("refreshToken");
    expect(res.body.data.user.id).toBe(user.id);
  });
});

// Test 3
describe("POST /api/auth/login wrong password", () => {
  it("returns 401", async () => {
    await createUser({ email: "carol@example.com" });

    const res = await api.post("/api/auth/login").send({
      email: "carol@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
  });
});

// Test 4
describe("GET /api/projects", () => {
  it("returns 401 when no token", async () => {
    const res = await api.get("/api/projects");
    expect(res.status).toBe(401);
  });
});

// Test 5
describe("POST /api/projects", () => {
  it("creates project for authenticated user", async () => {
    const { user } = await createUser({ email: "dave@example.com" });
    const { accessToken } = await loginUser("dave@example.com", "password123");

    const res = await api
      .post("/api/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "My Project", description: "Test project" });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("My Project");
    expect(res.body.data.ownerId).toBe(user.id);
  });
});

// Test 6
describe("GET /api/projects/:id", () => {
  it("returns 403 when accessed by non-member", async () => {
    const { user: owner } = await createUser({ email: "owner@test.com" });
    const { user: nonMember } = await createUser({ email: "nomember@test.com" });

    const project = await createProject(owner.id);

    const { accessToken } = await loginUser("nomember@test.com", "password123");

    const res = await api
      .get(`/api/projects/${project.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
  });
});

// Test 7
describe("PATCH /api/tasks/:id", () => {
  it("member can update task status", async () => {
    const { user: owner } = await createUser({ email: "taskowner@test.com" });
    const { user: member } = await createUser({ email: "taskmember@test.com" });

    const project = await createProject(owner.id);

    await prisma.projectMember.create({
      data: { projectId: project.id, userId: member.id, role: "member" },
    });

    const task = await prisma.task.create({
      data: {
        projectId: project.id,
        title: "Fix bug",
        status: "todo",
        priority: "medium",
      },
    });

    const { accessToken } = await loginUser("taskmember@test.com", "password123");

    const res = await api
      .patch(`/api/tasks/${task.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "in_progress" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("in_progress");
  });
});

// Test 8
describe("DELETE /api/tasks/:id", () => {
  it("member gets 403, owner gets 200", async () => {
    const { user: owner } = await createUser({ email: "delowner@test.com" });
    const { user: member } = await createUser({ email: "delmember@test.com" });

    const project = await createProject(owner.id);

    await prisma.projectMember.create({
      data: { projectId: project.id, userId: member.id, role: "member" },
    });

    const task = await prisma.task.create({
      data: {
        projectId: project.id,
        title: "Delete me",
        status: "todo",
        priority: "low",
      },
    });

    const { accessToken: memberToken } = await loginUser("delmember@test.com", "password123");

    const memberRes = await api
      .delete(`/api/tasks/${task.id}`)
      .set("Authorization", `Bearer ${memberToken}`);

    expect(memberRes.status).toBe(403);

    const { accessToken: ownerToken } = await loginUser("delowner@test.com", "password123");

    const ownerRes = await api
      .delete(`/api/tasks/${task.id}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(ownerRes.status).toBe(200);
  });
});