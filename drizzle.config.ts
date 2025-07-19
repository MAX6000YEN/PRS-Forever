import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./database/schema.ts",
  out: "./database/migrations",
  schemaFilter: ["public", "auth"],
  dbCredentials: {
    url: process.env.DB_URL!,
    ssl: true,
  },
});
