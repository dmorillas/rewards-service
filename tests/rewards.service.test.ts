import { describe, expect, it, vi } from "vitest";
import { RewardType, type RewardDefinition, type RewardDefinitionContent } from "../src/domain/reward.js";
import { HttpError, IllegalStatusError } from "../src/errors/errors.js";
import type { RewardsRepository } from "../src/repositories/rewards.repository.js";
import { IdGeneratorService } from "../src/services/id.generator.service.js";
import { RewardsService } from "../src/services/rewards.service.js";

function makeService(repository: Partial<RewardsRepository> = {}): RewardsService {
  return new RewardsService(repository as RewardsRepository, new IdGeneratorService());
}

function definition(overrides: Partial<RewardDefinition> = {}): RewardDefinition {
  return {
    id: "reward-1",
    name: "daily_login",
    content: [],
    enabled: true,
    createdAt: 1767225600000,
    updatedAt: 1767225600000,
    ...overrides,
  };
}

describe("RewardsService.addReward", () => {
  it("generates an id and matching timestamps", async () => {
    const repository = { create: vi.fn().mockResolvedValue(undefined) };

    const created = await makeService(repository).addReward("daily", [], true);

    expect(created.id).toBeTypeOf("string");
    expect(created.createdAt).toBeTypeOf("number");
    expect(created.createdAt).toBe(created.updatedAt);
    expect(repository.create).toHaveBeenCalledWith(created);
  });

  it("maps a duplicate name to a 409", async () => {
    const repository = {
      create: vi
        .fn()
        .mockRejectedValue(new Error("UNIQUE constraint failed: reward_definitions.name")),
    };

    await expect(makeService(repository).addReward("duplicate", [], true)).rejects.toBeInstanceOf(
      IllegalStatusError,
    );
  });

  it("rethrows unexpected persistence errors", async () => {
    const failure = new Error("disk full");
    const repository = { create: vi.fn().mockRejectedValue(failure) };

    await expect(makeService(repository).addReward("daily", [], true)).rejects.toBe(failure);
  });
});
