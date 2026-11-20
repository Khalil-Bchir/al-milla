import { defineConfig, env } from "prisma/config";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const nodeEnv = process.env.NODE_ENV ?? "development";

for (const candidate of [
  path.join(projectRoot, ".env.local"),
  path.join(projectRoot, `.env.${nodeEnv}`),
  path.join(projectRoot, ".env"),
]) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
  }
}

if (!process.env.DATABASE_URL && process.env.POSTGRES_PRISMA_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL;
}
if (!process.env.DIRECT_URL && process.env.POSTGRES_URL_NON_POOLING) {
  process.env.DIRECT_URL = process.env.POSTGRES_URL_NON_POOLING;
}
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/postgres";
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

const schemaPath = path.resolve(__dirname, "prisma", "schema.prisma");
const migrationsPath = path.resolve(__dirname, "prisma", "migrations");

export default defineConfig({
  schema: schemaPath,
  migrations: { path: migrationsPath },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
    directUrl: env("DIRECT_URL"),
  },
});
