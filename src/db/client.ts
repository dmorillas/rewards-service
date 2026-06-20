import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const url: string = process.env.DATABASE_URL ?? "./rewards.db";
const filename = url.startsWith("file:") ? url.slice("file:".length) : url;

if (filename !== ":memory:") {
  fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
}

const sqlite = new Database(filename);
if (filename !== ":memory:") {
  sqlite.pragma("journal_mode = WAL");
}

export const db = drizzle(sqlite, { schema });

export { schema };
