const { Pool } = require("pg");

require("dotenv").config();

const isProduction =
  process.env.NODE_ENV === "production";

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  // Render provides DATABASE_URL for managed PostgreSQL. Keep the individual
  // variables as a fallback so local development continues to work.
  ...(connectionString
    ? { connectionString }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }),

  connectionTimeoutMillis: 10000,

  idleTimeoutMillis: 30000,

  // Hosted PostgreSQL URLs, including Render's, require TLS. Local DB_HOST
  // connections keep their existing non-TLS development behavior.
  ssl: (connectionString || isProduction)
    ? {
        rejectUnauthorized: false,
      }
    : false,
});

pool.on("connect", () => {
  console.log("PostgreSQL connected");
});

pool.on("error", (error) => {
  console.error(
    "Unexpected PostgreSQL error:",
    error.message
  );
});

module.exports = pool;
