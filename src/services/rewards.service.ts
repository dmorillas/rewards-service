import "reflect-metadata";
import { injectable, inject } from "tsyringe";
import {Reward, RewardAmount, RewardType, type RewardDefinitionContent, FixedRewardEntry} from "../domain/reward";
import { RewardsRepository } from "../repositories/rewards.repository";
import { IdGeneratorService } from "./id.generator.service";
import { NotFoundError, IllegalStatusError } from "../errors/errors";
import type { RewardDefinition } from "../domain/reward";

@injectable()
export class RewardsService {
  constructor(
    @inject(RewardsRepository) private readonly repository: RewardsRepository,
    @inject(IdGeneratorService) private readonly idGenerator: IdGeneratorService,
  ) {}

  async addReward(
    name: string,
    content: RewardDefinitionContent[],
    enabled: boolean,
  ): Promise<RewardDefinition> {
    const now = Date.now();
    const definition: RewardDefinition = {
      id: this.idGenerator.generateId(),
      name,
      content,
      enabled,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await this.repository.create(definition);
    } catch (error) {
      if (error instanceof Error && /UNIQUE constraint failed/.test(error.message)) {
        throw new IllegalStatusError(`Reward with name '${name}' already exists.`);
      }
      throw error;
    }

    return definition;
  }

  async getRewards(): Promise<RewardDefinition[]> {
    return await this.repository.getRewards();
  }

  async getReward(id: string): Promise<RewardDefinition> {
    const definition = await this.repository.getRewardById(id);

    if (!definition) {
      throw new NotFoundError(`Trying to get non-existing reward with id '${id}'.`);
    }

    return definition;
  }

  async deleteReward(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new NotFoundError(`Trying to delete non-existing reward with id '${id}'.`);
    }
  }

  async updateReward(
    id: string,
    name?: string,
    content?: RewardDefinitionContent[],
    enabled?: boolean,
  ): Promise<RewardDefinition> {
    const definition = await this.repository.update(id, name, content, enabled);

    if (!definition) {
      throw new NotFoundError(`Trying to update non-existing reward with id '${id}'.`);
    }

    return definition;
  }

  async calculateReward(rewardId: string, rng: () => number = Math.random): Promise<Reward[]> {
    const rewardToClaim = await this.repository.getRewardById(rewardId);

    if (!rewardToClaim) {
      throw new NotFoundError(`Reward '${rewardId}' not found`);
    }

    if (!rewardToClaim.enabled) {
      throw new IllegalStatusError(`Reward '${rewardToClaim.name}' is disabled`);
    }

    const amountsFromFixedRewards = this.calculateFixedReward(rewardToClaim.content);
    const amountsFromRandomRewards = this.calculateRandomReward(rewardToClaim.content, rng);

    const totalEnergy = amountsFromFixedRewards.energy + amountsFromRandomRewards.energy;
    const totalCurrency = amountsFromFixedRewards.currency + amountsFromRandomRewards.currency;
    const totalXp = amountsFromFixedRewards.xp + amountsFromRandomRewards.xp;

    const rewards: Reward[] = [];
    if (totalEnergy > 0) rewards.push(new Reward(RewardType.Energy, totalEnergy));
    if (totalCurrency > 0) rewards.push(new Reward(RewardType.Currency, totalCurrency));
    if (totalXp > 0) rewards.push(new Reward(RewardType.Xp, totalXp));

    return rewards;
  }

  private calculateFixedReward(content: RewardDefinitionContent[]): RewardAmount {
    const amounts = new RewardAmount();

    const fixedRewards = content.find((reward) => reward.type === "fixed");
    if (fixedRewards) {
      amounts.energy += this.sumByResource(fixedRewards.rewards, RewardType.Energy);
      amounts.currency += this.sumByResource(fixedRewards.rewards, RewardType.Currency);
      amounts.xp += this.sumByResource(fixedRewards.rewards, RewardType.Xp);
    }

    return amounts;
  }

  private calculateRandomReward(content: RewardDefinitionContent[], rng: () => number): RewardAmount {
    const amounts = new RewardAmount();

    const randomRewards = content.find((reward) => reward.type === "random");
    if (randomRewards) {
      const raffleNumber = Math.floor(rng() * 100);
      let acc = 0;
      let winner = randomRewards.rewards[0];
      for (const reward of randomRewards.rewards) {
        if (acc + reward.chance >= raffleNumber) {
          winner = reward;
          break;
        }
        acc += reward.chance;
      }

      let amount = 0;
      if (winner?.amount !== undefined) {
        amount = winner.amount;
      } else if (winner) {
        const min = winner.minAmount ?? 0;
        const max = winner.maxAmount ?? min;
        amount = Math.floor(rng() * (max - min + 1)) + min;
      }

      if (winner?.resource === RewardType.Energy) amounts.energy += amount;
      if (winner?.resource === RewardType.Currency) amounts.currency += amount;
      if (winner?.resource === RewardType.Xp) amounts.xp += amount;
    }

    return amounts;
  }

  private sumByResource(rewards: FixedRewardEntry[], resource: RewardType): number {
    return rewards
      .filter((reward) => reward.resource === resource)
      .reduce((total, reward) => total + reward.amount, 0);
  }
}
