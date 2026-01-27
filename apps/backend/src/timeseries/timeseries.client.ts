import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';

export const timescalePool = new Pool({
  connectionString: process.env.TIMESCALE_DATABASE_URL,
  max: 20,
  ssl: false,
});
