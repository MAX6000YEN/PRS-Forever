import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from '../database/schema';
import * as relations from '../database/relations';

export const dbConnection = drizzle({
    schema: { ...schema, ...relations },
    connection: process.env.DB_URL!,
});
