import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const env = readFileSync(resolve(".env"), "utf8");
const url = env.match(/^DATABASE_URL=\"?([^\"\n]+)\"?/m)?.[1];
if (!url?.startsWith("file:")) throw new Error("DATABASE_URL SQLite mancante");
const dbPath = url.replace("file:", "");
if (existsSync(dbPath)) unlinkSync(dbPath);
execFileSync("sqlite3", [dbPath], {
  input: readFileSync("prisma/migrations/20260711113000_init/migration.sql"),
  stdio: ["pipe", "inherit", "inherit"],
});
console.log(`Database SQLite pronto: ${dbPath}`);
