import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/migrations/schema.ts",
  out: "./src/db/migrations",
  schemaFilter: ["public", "auth"],
  dbCredentials: {
    url: process.env.DB_URL!,
    ssl: true,
  },
});
