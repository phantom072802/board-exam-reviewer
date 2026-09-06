require("dotenv").config();

const app = require("./app");
const pool = require("./config/database");

const PORT = Number(process.env.PORT) || 5000;
const HOST = "0.0.0.0";

// ==================================================
// START SERVER
// ==================================================

const server = app.listen(
  PORT,
  HOST,
  () => {
    console.log(
      `Server running on http://${HOST}:${PORT}`
    );

    console.log(
      `Environment: ${
        process.env.NODE_ENV || "development"
      }`
    );

    // Test database after the server is listening.
    testDatabaseConnection();
  }
);

// ==================================================
// TEST DATABASE
// ==================================================

async function testDatabaseConnection() {
  try {
    console.log(
      "Testing PostgreSQL connection..."
    );

    // ==============================================
    // DATABASE IDENTITY + TABLE CHECK
    // ==============================================

    const result = await pool.query(`
      SELECT
        current_database() AS database_name,
        current_schema() AS schema_name,

        EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'practice_sessions'
        ) AS practice_sessions_exists,

        EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'practice_answers'
        ) AS practice_answers_exists,

        EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'notifications'
        ) AS notifications_exists
    `);

    const databaseInfo = result.rows[0];

    // ==============================================
    // CONNECTION STATUS
    // ==============================================

    console.log(
      "Database connection successful"
    );

    // ==============================================
    // DATABASE INFORMATION
    // ==============================================

    console.log(
      `Database name: ${databaseInfo.database_name}`
    );

    console.log(
      `Database schema: ${databaseInfo.schema_name}`
    );

    // ==============================================
    // TABLE EXISTENCE CHECK
    // ==============================================

    console.log(
      `practice_sessions exists: ${
        databaseInfo.practice_sessions_exists
      }`
    );

    console.log(
      `practice_answers exists: ${
        databaseInfo.practice_answers_exists
      }`
    );

    console.log(
      `notifications exists: ${
        databaseInfo.notifications_exists
      }`
    );

    // ==============================================
    // DATABASE DIAGNOSTIC SUMMARY
    // ==============================================

    if (
      databaseInfo.practice_sessions_exists &&
      databaseInfo.practice_answers_exists &&
      databaseInfo.notifications_exists
    ) {
      console.log(
        "Database diagnostic: All required dashboard tables exist."
      );
    } else {
      console.warn(
        "Database diagnostic: One or more required tables are missing."
      );
    }

  } catch (error) {
    console.error(
      "PostgreSQL connection failed:"
    );

    console.error(
      error.message
    );

    console.error(
      "The API server is still running, but database operations may fail."
    );
  }
}

// ==================================================
// GRACEFUL SHUTDOWN
// ==================================================

process.on(
  "SIGTERM",
  async () => {
    console.log(
      "SIGTERM received. Shutting down..."
    );

    server.close(async () => {
      try {
        await pool.end();

        console.log(
          "PostgreSQL connection pool closed."
        );

        process.exit(0);

      } catch (error) {
        console.error(
          "Error closing PostgreSQL pool:",
          error.message
        );

        process.exit(1);
      }
    });
  }
);

// ==================================================
// HANDLE CTRL + C
// ==================================================

process.on(
  "SIGINT",
  async () => {
    console.log(
      "SIGINT received. Shutting down..."
    );

    server.close(async () => {
      try {
        await pool.end();

        console.log(
          "PostgreSQL connection pool closed."
        );

        process.exit(0);

      } catch (error) {
        console.error(
          "Error closing PostgreSQL pool:",
          error.message
        );

        process.exit(1);
      }
    });
  }
);