import { beforeEach, describe, expect, it } from "vitest";
import type { DependencyContainer } from "tsyringe";
import {
  RewardType,
  type RewardDefinition,
  type RewardDefinitionContent,
} from "../src/domain/reward.js";
import { RewardsRepository } from "../src/repositories/rewards.repository.js";
import { createTestContainer, resetTestDatabase } from "./helpers/test-container.js";

const content: RewardDefinitionContent[] = [
  { type: "fixed", rewards: [{ resource: RewardType.Energy, amount: 20 }] },
];

function definition(overrides: Partial<RewardDefinition> = {}): RewardDefinition {
  return {
    id: "reward-1",
    name: "daily",
    content,
    enabled: true,
    createdAt: 1767225600000,
    updatedAt: 1767225600000,
    ...overrides,
  };
}

describe("RewardsRepository", () => {
  let container: DependencyContainer;
  let repository: RewardsRepository;

  beforeEach(async () => {
    container = await createTestContainer();
    resetTestDatabase();
    repository = container.resolve(RewardsRepository);
  });

  it("creates a definition", async () => {
    const created = await repository.create(definition({ name: "daily" }));

    expect(created.id).toBe("reward-1");
    expect(created.name).toBe("daily");
    expect(created.enabled).toBe(true);
    expect(created.content).toEqual(content);
  });

  it("finds a definition by id", async () => {
    const created = await repository.create(definition({ name: "weekly" }));

    expect(await repository.getRewardById(created.id)).toMatchObject({ id: created.id });
    expect(await repository.getRewardById("missing")).toBeUndefined();
  });

  it("lists all definitions", async () => {
    await repository.create(definition({ id: "reward-1", name: "one" }));
    await repository.create(definition({ id: "reward-2", name: "two" }));

    const all = await repository.getRewards();

    expect(all).toHaveLength(2);
    expect(all.map((entry) => entry.name).sort()).toEqual(["one", "two"]);
  });

  it("updates fields and returns undefined for a missing definition", async () => {
    const created = await repository.create(definition({ name: "old" }));

    const updated = await repository.update(created.id, "new", undefined, false);

    expect(updated).toMatchObject({ id: created.id, name: "new", enabled: false });
    expect(await repository.update("missing", "x", undefined, undefined)).toBeUndefined();
  });

  it("deletes a definition", async () => {
    const created = await repository.create(definition({ name: "temporary" }));

    const deleted = await repository.delete(created.id);

    expect(deleted).toMatchObject({ id: created.id });
    expect(await repository.getRewardById(created.id)).toBeUndefined();
    expect(await repository.delete(created.id)).toBeUndefined();
  });

  it("rejects duplicate names", async () => {
    await repository.create(definition({ id: "reward-1", name: "duplicate" }));

    await expect(repository.create(definition({ id: "reward-2", name: "duplicate" }))).rejects.toThrow(
      /UNIQUE/,
    );
  });
});
