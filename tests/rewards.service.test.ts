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

function makeServiceWithContent(content: RewardDefinitionContent[]): RewardsService {
  return makeService({
    getRewardById: vi.fn().mockResolvedValue(definition({ content })),
  });
}

describe("RewardsService.calculateReward", () => {
  it("sums fixed rewards per resource", async () => {
    const service = makeServiceWithContent([
      {
        type: "fixed",
        rewards: [
          { resource: RewardType.Energy, amount: 20 },
          { resource: RewardType.Energy, amount: 5 },
          { resource: RewardType.Currency, amount: 100 },
        ],
      },
    ]);

    const rewards = await service.calculateReward("reward-1");

    expect(rewards).toEqual([
      { type: RewardType.Energy, amount: 25 },
      { type: RewardType.Currency, amount: 100 },
    ]);
  });

  it("omits resources whose total is zero", async () => {
    const service = makeServiceWithContent([
      { type: "fixed", rewards: [{ resource: RewardType.Xp, amount: 0 }] },
    ]);

    await expect(service.calculateReward("reward-1")).resolves.toEqual([]);
  });

  it("picks the random winner deterministically from the injected rng", async () => {
    const service = makeServiceWithContent([
      {
        type: "random",
        rewards: [
          { resource: RewardType.Currency, chance: 10, amount: 100 },
          { resource: RewardType.Currency, chance: 40, minAmount: 5, maxAmount: 25 },
        ],
      },
    ]);

    const firstRoll = vi.fn().mockReturnValueOnce(0);
    expect(await service.calculateReward("reward-1", firstRoll)).toEqual([
      { type: RewardType.Currency, amount: 100 },
    ]);

    const secondRoll = vi.fn().mockReturnValueOnce(0.5).mockReturnValueOnce(0);
    expect(await service.calculateReward("reward-1", secondRoll)).toEqual([
      { type: RewardType.Currency, amount: 5 },
    ]);
  });

  it("combines fixed and random rewards into a single result set", async () => {
    const service = makeServiceWithContent([
      {
        type: "fixed",
        rewards: [
          { resource: RewardType.Energy, amount: 20 },
          { resource: RewardType.Xp, amount: 10 },
        ],
      },
      {
        type: "random",
        rewards: [{ resource: RewardType.Currency, chance: 100, amount: 7 }],
      },
    ]);

    const rewards = await service.calculateReward("reward-1", () => 0);

    expect(rewards).toEqual([
      { type: RewardType.Energy, amount: 20 },
      { type: RewardType.Currency, amount: 7 },
      { type: RewardType.Xp, amount: 10 },
    ]);
  });
});

describe("RewardsService.calculateRewardById", () => {
  it("returns the calculated rewards for an enabled definition", async () => {
    const repository = {
      getRewardById: vi.fn().mockResolvedValue(
        definition({
          content: [{ type: "fixed", rewards: [{ resource: RewardType.Energy, amount: 3 }] }],
        }),
      ),
    };

    const rewards = await makeService(repository).calculateReward("reward-1");

    expect(repository.getRewardById).toHaveBeenCalledWith("reward-1");
    expect(rewards).toEqual([{ type: RewardType.Energy, amount: 3 }]);
  });

  it("throws a 404 when the definition does not exist", async () => {
    const service = makeService({ getRewardById: vi.fn().mockResolvedValue(undefined) });

    await expect(service.calculateReward("missing")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("throws a 409 when the definition is disabled", async () => {
    const repository = { getRewardById: vi.fn().mockResolvedValue(definition({ enabled: false })) };

    await expect(makeService(repository).calculateReward("reward-1")).rejects.toBeInstanceOf(
      HttpError,
    );
    await expect(makeService(repository).calculateReward("reward-1")).rejects.toMatchObject({
      status: 409,
    });
  });
});

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
