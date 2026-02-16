import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { envSchema } from "../env";

export const db = drizzle(neon(envSchema.DATABASE_URL));
