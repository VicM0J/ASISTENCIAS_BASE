import { defineConfig } from "drizzle-kit";

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:12345@localhost:5432/asistnd';

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
