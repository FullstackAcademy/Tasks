import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

const email = `test_${Date.now()}@taskflow.app`;
let token;
let categoryId;

describe("TaskFlow API", () => {
  it("registers a user", async () => {
    const res = await request(app).post("/auth/register").send({ email, password: "password123" });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it("rejects unauthenticated category access", async () => {
    const res = await request(app).get("/categories");
    expect(res.status).toBe(401);
  });

  it("creates a category", async () => {
    const res = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Work" });
    expect(res.status).toBe(201);
    categoryId = res.body.id;
  });

  it("creates and lists a task in that category", async () => {
    await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Ship it", categoryId, recurringDays: [1, 3] });
    const res = await request(app)
      .get(`/tasks?categoryId=${categoryId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe("Ship it");
  });
});