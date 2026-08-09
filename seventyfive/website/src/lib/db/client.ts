import { envSchema } from "@/lib/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export const db = drizzle(neon(envSchema.DATABASE_URL), { schema });
