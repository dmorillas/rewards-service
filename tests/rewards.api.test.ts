import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import app from "../src/app.js";
import { createTestContainer, resetTestDatabase } from "./helpers/test-container.js";

const fixedContent = [
  {
    type: "fixed",
    rewards: [
      { resource: "energy", amount: 20 },
      { resource: "xp", amount: 10 },
    ],
  },
];

describe("rewards API", () => {
  beforeAll(async () => {
    await createTestContainer();
    resetTestDatabase();
  });

  it("responds to the health check", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("creates a reward definition", async () => {
    const response = await request(app)
      .post("/api/v1/rewards")
      .send({ name: "api_create", content: fixedContent });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ name: "api_create", enabled: true });
    expect(response.body.id).toBeTypeOf("string");
  });

  it("lists reward definitions", async () => {
    await request(app)
      .post("/api/v1/rewards")
      .send({ name: "api_list", content: fixedContent });

    const response = await request(app).get("/api/v1/rewards");

    expect(response.status).toBe(200);
    expect(response.body.map((definition: { name: string }) => definition.name)).toContain(
      "api_list",
    );
  });

  it("reads a reward definition by id and returns 404 when missing", async () => {
    const created = await request(app)
      .post("/api/v1/rewards")
      .send({ name: "api_read", content: fixedContent });

    const found = await request(app).get(`/api/v1/rewards/${created.body.id}`);
    expect(found.status).toBe(200);
    expect(found.body).toMatchObject({ id: created.body.id });

    const missing = await request(app).get("/api/v1/rewards/does-not-exist");
    expect(missing.status).toBe(404);
  });

  it("updates a reward definition", async () => {
    const created = await request(app)
      .post("/api/v1/rewards")
      .send({ name: "api_update", content: fixedContent });

    const response = await request(app)
      .patch(`/api/v1/rewards/${created.body.id}`)
      .send({ name: "api_update_v2", enabled: false });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: created.body.id, name: "api_update_v2", enabled: false });

    const contentOnly = await request(app)
      .patch(`/api/v1/rewards/${created.body.id}`)
      .send({ content: [{ type: "fixed", rewards: [{ resource: "xp", amount: 5 }] }] });

    expect(contentOnly.status).toBe(200);
    expect(contentOnly.body).toMatchObject({
      id: created.body.id,
      name: "api_update_v2",
      content: [{ type: "fixed", rewards: [{ resource: "xp", amount: 5 }] }],
    });
  });

  it("deletes a reward definition", async () => {
    const created = await request(app)
      .post("/api/v1/rewards")
      .send({ name: "api_delete", content: fixedContent });

    const deleted = await request(app).delete(`/api/v1/rewards/${created.body.id}`);
    expect(deleted.status).toBe(204);

    const afterDelete = await request(app).get(`/api/v1/rewards/${created.body.id}`);
    expect(afterDelete.status).toBe(404);
  });

  it("calculates a reward", async () => {
    const created = await request(app)
      .post("/api/v1/rewards")
      .send({ name: "api_calculate", content: fixedContent });

    const response = await request(app).post(`/api/v1/rewards/${created.body.id}/calculate`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      rewardId: created.body.id,
      rewards: [
        { type: "energy", amount: 20 },
        { type: "xp", amount: 10 },
      ],
    });
  });

  it("returns 409 when calculating a disabled reward", async () => {
    const created = await request(app)
      .post("/api/v1/rewards")
      .send({ name: "api_disabled", content: fixedContent, enabled: false });

    const response = await request(app).post(`/api/v1/rewards/${created.body.id}/calculate`);
    expect(response.status).toBe(409);
  });

  it("returns 409 when creating a reward with a duplicate name", async () => {
    await request(app).post("/api/v1/rewards").send({ name: "api_duplicate", content: fixedContent });

    const response = await request(app)
      .post("/api/v1/rewards")
      .send({ name: "api_duplicate", content: fixedContent });

    expect(response.status).toBe(409);
  });

  it("returns 400 for invalid payloads", async () => {
    const noName = await request(app).post("/api/v1/rewards").send({ content: fixedContent });
    expect(noName.status).toBe(400);

    const blankName = await request(app).post("/api/v1/rewards").send({ name: "  ", content: fixedContent });
    expect(blankName.status).toBe(400);

    const badContent = await request(app)
      .post("/api/v1/rewards")
      .send({ name: "api_bad", content: "nope" });
    expect(badContent.status).toBe(400);

    const badEnabled = await request(app)
      .post("/api/v1/rewards")
      .send({ name: "api_bad_enabled", content: fixedContent, enabled: "yes" });
    expect(badEnabled.status).toBe(400);
  });

  it("returns 400 and 404 for invalid or missing definitions on update and delete", async () => {
    const created = await request(app)
      .post("/api/v1/rewards")
      .send({ name: "api_patch", content: fixedContent });

    const blankName = await request(app)
      .patch(`/api/v1/rewards/${created.body.id}`)
      .send({ name: "" });
    expect(blankName.status).toBe(400);

    const badContent = await request(app)
      .patch(`/api/v1/rewards/${created.body.id}`)
      .send({ content: 42 });
    expect(badContent.status).toBe(400);

    const badEnabled = await request(app)
      .patch(`/api/v1/rewards/${created.body.id}`)
      .send({ enabled: "nope" });
    expect(badEnabled.status).toBe(400);

    const missingPatch = await request(app)
      .patch("/api/v1/rewards/missing")
      .send({ name: "whatever" });
    expect(missingPatch.status).toBe(404);

    const missingDelete = await request(app).delete("/api/v1/rewards/missing");
    expect(missingDelete.status).toBe(404);
  });

  it("returns 404 when calculating an unknown reward", async () => {
    const response = await request(app).post("/api/v1/rewards/missing/calculate");
    expect(response.status).toBe(404);
  });

  it("returns 404 for unknown routes", async () => {
    const response = await request(app).get("/nope");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Not found" });
  });
});
