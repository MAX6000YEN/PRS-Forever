import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from '../database/schema';

export const dbConnection = drizzle({
    schema,
    connection: process.env.DB_URL!,
});
