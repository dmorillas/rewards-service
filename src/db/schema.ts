import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { RewardDefinitionContent } from "../domain/reward";

export const rewardDefinitions = sqliteTable("reward_definitions", {
  id: text("id").notNull().primaryKey(),
  name: text("name").notNull().unique(),
  content: text("content", { mode: "json" })
    .$type<RewardDefinitionContent[]>()
    .notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at")
      .notNull()
      .$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at")
      .notNull()
      .$defaultFn(() => Date.now()),
});
