import { Pool } from "pg";
import { env } from "../config/env";

export const pool = new Pool({ connectionString: env.databaseUrl });

export function query<T = any>(text: string, params: any[] = []) {
  return pool.query<T>(text, params);
}
