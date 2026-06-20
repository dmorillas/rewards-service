import "reflect-metadata";
import { injectable, inject } from "tsyringe";
import { Reward, RewardAmount, RewardType, type RewardDefinitionContent } from "../domain/reward";
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
}
