import "reflect-metadata";
import { sql } from "drizzle-orm";
import { pushSQLiteSchema } from "drizzle-kit/api";
import { container, type DependencyContainer } from "tsyringe";
import "../../src/container/index.js";
import { db } from "../../src/db/client.js";
import * as schema from "../../src/db/schema.js";

let schemaReady: Promise<void> | undefined;

async function createSchema(): Promise<void> {
  const originalConsole = { log: console.log, warn: console.warn, error: console.error };
  const originalWrite = process.stdout.write.bind(process.stdout);

  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  process.stdout.write = () => true;

  try {
    const { statementsToExecute } = await pushSQLiteSchema(
      schema as Record<string, unknown>,
      db as unknown as Parameters<typeof pushSQLiteSchema>[1],
    );

    for (const statement of statementsToExecute) {
      db.run(sql.raw(statement));
    }
  } finally {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    process.stdout.write = originalWrite;
  }
}

export async function createTestContainer(): Promise<DependencyContainer> {
  if (!schemaReady) {
    schemaReady = createSchema();
  }
  await schemaReady;

  return container;
}

export function resetTestDatabase(): void {
  db.run(sql`DELETE FROM reward_definitions`);
}
