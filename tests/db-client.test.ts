import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sql } from "drizzle-orm";

describe("db client", () => {
  const originalUrl = process.env.DATABASE_URL;
  let tempDir: string | undefined;

  afterEach(() => {
    vi.resetModules();
    process.env.DATABASE_URL = originalUrl;

    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    }
  });

  it("creates a file-backed database, including missing parent directories", async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rewards-"));
    const filename = path.join(tempDir, "nested", "rewards.db");
    process.env.DATABASE_URL = filename;

    vi.resetModules();
    const { db } = await import("../src/db/client.js");

    expect(fs.existsSync(filename)).toBe(true);
    expect(db.all(sql`select 1 as ok`)).toEqual([{ ok: 1 }]);
  });

  it("strips the file: URL prefix", async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rewards-"));
    const filename = path.join(tempDir, "rewards.db");
    process.env.DATABASE_URL = `file:${filename}`;

    vi.resetModules();
    await import("../src/db/client.js");

    expect(fs.existsSync(filename)).toBe(true);
  });
});
