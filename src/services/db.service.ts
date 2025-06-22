import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();
const env = process.env as any;
if (!env.POSTGRES_USER || !env.FIREBASE_PROJECT_ID || !env.PORT) {
  throw new Error("Missing required environment variables");
}

const pool = new Pool({
  user: env.POSTGRES_USER,
  host: env.POSTGRES_HOST,
  database: env.POSTGRES_DB,
  password: env.POSTGRES_PASSWORD,
  port: parseInt(env.POSTGRES_PORT),
});

export const db = drizzle(pool);
