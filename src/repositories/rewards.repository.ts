import "reflect-metadata";
import { injectable } from "tsyringe";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/client";
import type { RewardDefinition, RewardDefinitionContent } from "../domain/reward";

@injectable()
export class RewardsRepository {
  async getRewards(): Promise<RewardDefinition[]> {
    return db.select().from(schema.rewardDefinitions);
  }

  async getRewardById(id: string): Promise<RewardDefinition | undefined> {
    const [definition] = await db
      .select()
      .from(schema.rewardDefinitions)
      .where(eq(schema.rewardDefinitions.id, id))
      .limit(1);

    return definition;
  }

  async create(input: RewardDefinition): Promise<RewardDefinition> {
    const [definition] = await db
      .insert(schema.rewardDefinitions)
      .values({
        id: input.id,
        name: input.name,
        content: input.content,
        enabled: input.enabled,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      })
      .returning();

    return definition;
  }

  async update(
    id: string,
    name?: string,
    content?: RewardDefinitionContent[],
    enabled?: boolean,
  ): Promise<RewardDefinition | undefined> {
    const [definition] = await db
      .update(schema.rewardDefinitions)
      .set({
        ...(name !== undefined ? { name } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(enabled !== undefined ? { enabled } : {}),
        updatedAt: Date.now(),
      })
      .where(eq(schema.rewardDefinitions.id, id))
      .returning();

    return definition;
  }

  async delete(id: string): Promise<RewardDefinition | undefined> {
    const [definition] = await db
      .delete(schema.rewardDefinitions)
      .where(eq(schema.rewardDefinitions.id, id))
      .returning();

    return definition;
  }
}
