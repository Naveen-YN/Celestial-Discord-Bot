const { Pool, neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const ws = require("ws");
const schema = require("../shared/schema.js");

neonConfig.webSocketConstructor = ws;

// 👇 Directly set your DATABASE_URL here
const DATABASE_URL = "postgresql://neondb_owner:npg_wD2J4QNhscdC@ep-falling-unit-a8mrgkze-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

// Optional safety check
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle({ client: pool, schema });

module.exports = { pool, db };
