import { describe, expect, it } from "vitest";
import { RewardType } from "../src/domain/reward.js";
import { isRewardDefinitionContent } from "../src/middlewares/validation.js";

describe("isRewardDefinitionContent", () => {
  it("accepts valid fixed and random parts", () => {
    expect(
      isRewardDefinitionContent([
        {
          type: "fixed",
          rewards: [
            { resource: RewardType.Energy, amount: 1 },
            { resource: RewardType.Currency, amount: 2 },
            { resource: RewardType.Xp, amount: 3 },
          ],
        },
        { type: "random", rewards: [{ resource: RewardType.Xp, chance: 50, amount: 10 }] },
      ]),
    ).toBe(true);

    expect(isRewardDefinitionContent([])).toBe(true);
  });

  it("rejects non-arrays", () => {
    expect(isRewardDefinitionContent("nope")).toBe(false);
    expect(isRewardDefinitionContent({})).toBe(false);
    expect(isRewardDefinitionContent(null)).toBe(false);
  });

  it("rejects parts that are not fixed/random or lack a rewards array", () => {
    expect(isRewardDefinitionContent([{ type: "unknown", rewards: [] }])).toBe(false);
    expect(isRewardDefinitionContent([{ type: "fixed" }])).toBe(false);
    expect(isRewardDefinitionContent([null])).toBe(false);
  });

  it("rejects entries with an unknown resource", () => {
    expect(
      isRewardDefinitionContent([{ type: "fixed", rewards: [{ resource: "gold", amount: 1 }] }]),
    ).toBe(false);
    expect(isRewardDefinitionContent([{ type: "fixed", rewards: [null] }])).toBe(false);
  });
});
