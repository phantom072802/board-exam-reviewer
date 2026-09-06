const { Pool } = require("pg");

require("dotenv").config();

const isProduction =
  process.env.NODE_ENV === "production";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Prevent Render from hanging indefinitely
  // when PostgreSQL cannot be reached.
  connectionTimeoutMillis: 10000,

  // Keep idle connections healthy.
  idleTimeoutMillis: 30000,

  // Render PostgreSQL uses SSL in production.
  ssl: isProduction
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
    error
  );
});

module.exports = pool;